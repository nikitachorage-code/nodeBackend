import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from '../common/audit/audit.service.js';
import { ClockService } from '../common/clock/clock.service.js';
import { CurrentUser, Roles } from '../common/decorators/decorators.js';
import type { AuthUser } from '../common/decorators/decorators.js';
import { badRequest, notFound } from '../common/errors/api-exception.js';
import type { Env } from '../config/env.validation.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { AuditQueryDto, SetClockDto, UpdateSettingsDto } from './admin.dto.js';

@ApiTags('admin: system')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminSystemController {
  constructor(
    private readonly settings: SettingsService,
    private readonly prisma: PrismaService,
    private readonly clock: ClockService,
    private readonly audit: AuditService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get('settings')
  getSettings() {
    return this.settings.getAll();
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() actor: AuthUser,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settings.update(actor.id, { ...dto });
  }

  @Get('audit-logs')
  async auditLogs(@Query() q: AuditQueryDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 50;
    const where: Prisma.AuditLogWhereInput = {
      ...(q.entity ? { entity: q.entity } : {}),
      ...(q.action ? { action: q.action } : {}),
      ...(q.entityId ? { entityId: q.entityId } : {}),
      ...(q.actorId ? { actorId: q.actorId } : {}),
      ...(q.from || q.to
        ? {
            createdAt: {
              ...(q.from ? { gte: new Date(q.from) } : {}),
              ...(q.to ? { lt: new Date(q.to) } : {}),
            },
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const actorIds = [
      ...new Set(rows.map((r) => r.actorId).filter((x): x is string => !!x)),
    ];
    const actors = await this.prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, name: true, email: true },
    });
    const byId = new Map(actors.map((a) => [a.id, a]));
    return {
      data: rows.map((r) => ({
        id: r.id,
        at: r.createdAt,
        action: r.action,
        entity: r.entity,
        entityId: r.entityId,
        actor: r.actorId ? (byId.get(r.actorId) ?? { id: r.actorId }) : null,
        before: r.before,
        after: r.after,
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  private requireTimeTravel() {
    const enabled =
      this.config.get('ALLOW_TIME_TRAVEL', { infer: true }) &&
      this.config.get('NODE_ENV', { infer: true }) !== 'production';
    if (!enabled)
      throw notFound('NOT_FOUND', 'Cannot GET/POST /api/admin/clock');
  }

  @Get('clock')
  getClock() {
    this.requireTimeTravel();
    return { now: this.clock.now(), shifted: this.clock.isShifted() };
  }

  /** Test helper. Only exists when ALLOW_TIME_TRAVEL=true and NODE_ENV is not production. */
  @Post('clock')
  @HttpCode(200)
  async setClock(@CurrentUser() actor: AuthUser, @Body() dto: SetClockDto) {
    this.requireTimeTravel();
    if (dto.reset === true) {
      this.clock.reset();
    } else if (dto.now) {
      this.clock.set(new Date(dto.now));
    } else {
      throw badRequest(
        'CLOCK_INPUT_REQUIRED',
        'Send { "now": "<ISO date>" } or { "reset": true }',
      );
    }
    const now = this.clock.now();
    await this.audit.log({
      actorId: actor.id,
      action: 'clock.set',
      entity: 'clock',
      after: { now, reset: dto.reset === true },
    });
    return { now, shifted: this.clock.isShifted() };
  }
}
