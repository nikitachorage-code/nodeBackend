import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuditService } from '../common/audit/audit.service.js';
import { ClockService } from '../common/clock/clock.service.js';
import { toCsv } from '../common/csv/csv.js';
import {
  badRequest,
  conflict,
  notFound,
} from '../common/errors/api-exception.js';
import { explain, type EngineCert } from '../cycle-engine/cycle-engine.js';
import { DashboardService } from '../dashboard/dashboard.service.js';
import { FormConfigService } from '../forms/form-config.service.js';
import type { Prisma, User } from '../generated/prisma/client.js';
import { presentCertification } from '../certifications/certifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { SyncService } from '../sync/sync.service.js';
import type {
  CreateAdminDto,
  UpdateUserDto,
  UserSort,
  UsersQueryDto,
} from './admin.dto.js';

const EXPORT_LIMIT = 10_000;

const SORT_COLUMN: Record<UserSort, keyof Prisma.UserOrderByWithRelationInput> =
  {
    name: 'name',
    email: 'email',
    passport: 'passportNo',
    status: 'status',
    progress: 'progressCount',
    registered: 'createdAt',
  };

export interface ColumnDef {
  key: string;
  label: string;
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly forms: FormConfigService,
    private readonly profile: ProfileService,
    private readonly dashboard: DashboardService,
    private readonly sync: SyncService,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
    private readonly clock: ClockService,
  ) {}

  // ---- table -------------------------------------------------------------

  /** Profile fields an admin can add as extra table columns. */
  private async availableColumns() {
    const steps = (await this.forms.activeSteps()).filter((s) => !s.repeatable);
    return steps.flatMap((s) =>
      s.fields
        .filter((f) => f.visible)
        .map((f) => ({
          fieldId: f.id,
          key: `${s.key}.${f.key}`,
          label: `${s.title}: ${f.label}`,
          type: f.type,
        })),
    );
  }

  private where(q: UsersQueryDto): Prisma.UserWhereInput {
    // Prisma's contains does not escape LIKE wildcards, so do it here.
    const term = q.search?.trim().replace(/[\\%_]/g, (c) => `\\${c}`);
    return {
      role: 'USER',
      deletedAt: null,
      ...(q.status && q.status !== 'ALL' ? { status: q.status } : {}),
      ...(q.atRisk ? { atRisk: true } : {}),
      ...(term
        ? {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
              { passportNo: { contains: term, mode: 'insensitive' } },
              {
                certifications: {
                  some: {
                    deletedAt: null,
                    data: {
                      path: ['certification_number'],
                      string_contains: term,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
  }

  private orderBy(q: UsersQueryDto): Prisma.UserOrderByWithRelationInput[] {
    const col = SORT_COLUMN[q.sort ?? 'registered'];
    const order = q.order ?? 'desc';
    return [{ [col]: order }, { id: 'asc' }];
  }

  private async selectedColumns(q: UsersQueryDto) {
    const available = await this.availableColumns();
    const wanted = (q.fields ?? '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    const selected = wanted.map((k) => {
      const col = available.find((a) => a.key === k);
      if (!col) {
        throw badRequest('UNKNOWN_COLUMN', `Unknown column "${k}"`, {
          available: available.map((a) => a.key),
        });
      }
      return col;
    });
    return { available, selected };
  }

  private async answersFor(userIds: string[], fieldIds: string[]) {
    if (userIds.length === 0 || fieldIds.length === 0) {
      return new Map<string, Map<string, unknown>>();
    }
    const rows = await this.prisma.profileAnswer.findMany({
      where: { userId: { in: userIds }, fieldId: { in: fieldIds } },
    });
    const byUser = new Map<string, Map<string, unknown>>();
    for (const r of rows) {
      if (!byUser.has(r.userId)) byUser.set(r.userId, new Map());
      byUser.get(r.userId)!.set(r.fieldId, r.value);
    }
    return byUser;
  }

  private row(
    u: User,
    required: number,
    selected: { fieldId: string; key: string }[],
    answers: Map<string, unknown> | undefined,
  ) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      passportNo: u.passportNo,
      status: u.status,
      progress: {
        completed: u.progressCount,
        required,
        label: `${u.progressCount}/${required}`,
      },
      atRisk: u.atRisk,
      onboarded: u.onboardedAt !== null,
      cycleNo: u.cycleNo,
      registeredAt: u.createdAt,
      answers: Object.fromEntries(
        selected.map((c) => [c.key, answers?.get(c.fieldId) ?? null]),
      ),
    };
  }

  async list(q: UsersQueryDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const where = this.where(q);
    const { available, selected } = await this.selectedColumns(q);
    const [total, users, required] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: this.orderBy(q),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.settings.getRequiredPerCycle(),
    ]);
    const answers = await this.answersFor(
      users.map((u) => u.id),
      selected.map((c) => c.fieldId),
    );
    return {
      data: users.map((u) =>
        this.row(u, required, selected, answers.get(u.id)),
      ),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      columns: {
        base: [
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'passportNo', label: 'Passport no.' },
          { key: 'status', label: 'Status' },
          { key: 'progress', label: 'Certifications' },
          { key: 'registeredAt', label: 'Registered' },
        ] satisfies ColumnDef[],
        selected: selected.map(({ key, label }) => ({ key, label })),
        available: available.map(({ key, label, type }) => ({
          key,
          label,
          type,
        })),
      },
    };
  }

  async exportCsv(q: UsersQueryDto): Promise<string> {
    const { selected } = await this.selectedColumns(q);
    const [users, required] = await Promise.all([
      this.prisma.user.findMany({
        where: this.where(q),
        orderBy: this.orderBy(q),
        take: EXPORT_LIMIT,
      }),
      this.settings.getRequiredPerCycle(),
    ]);
    const answers = await this.answersFor(
      users.map((u) => u.id),
      selected.map((c) => c.fieldId),
    );
    const headers = [
      'Name',
      'Email',
      'Passport no.',
      'Status',
      'Certifications',
      'At risk',
      'Registered',
      ...selected.map((c) => c.label),
    ];
    const rows = users.map((u) => [
      u.name,
      u.email,
      u.passportNo,
      u.status,
      `${u.progressCount}/${required}`,
      u.atRisk,
      u.createdAt,
      ...selected.map((c) => answers.get(u.id)?.get(c.fieldId) ?? null),
    ]);
    return toCsv(headers, rows);
  }

  async stats() {
    const base: Prisma.UserWhereInput = { role: 'USER', deletedAt: null };
    const [total, candidates, diplomates, atRisk, onboarded, lapsed] =
      await Promise.all([
        this.prisma.user.count({ where: base }),
        this.prisma.user.count({ where: { ...base, status: 'CANDIDATE' } }),
        this.prisma.user.count({ where: { ...base, status: 'DIPLOMATE' } }),
        this.prisma.user.count({ where: { ...base, atRisk: true } }),
        this.prisma.user.count({
          where: { ...base, onboardedAt: { not: null } },
        }),
        this.prisma.user.count({
          where: {
            ...base,
            status: 'CANDIDATE',
            certifications: { some: { status: 'LAPSED', deletedAt: null } },
          },
        }),
      ]);
    return {
      totalUsers: total,
      candidates,
      diplomates,
      atRisk,
      onboarded,
      notOnboarded: total - onboarded,
      lapsedCandidates: lapsed,
      generatedAt: this.clock.now(),
    };
  }

  // ---- single user -------------------------------------------------------

  private async target(id: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { id, role: 'USER', deletedAt: null },
    });
    if (!user) throw notFound('USER_NOT_FOUND', 'User not found');
    return user;
  }

  private presentUser(u: User) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      status: u.status,
      passportNo: u.passportNo,
      emailVerified: u.emailVerifiedAt !== null,
      onboarded: u.onboardedAt !== null,
      onboardedAt: u.onboardedAt,
      registeredAt: u.createdAt,
    };
  }

  /** Profile, cycle dashboard and status for one user. Syncs first so numbers are current. */
  async detail(id: string) {
    await this.target(id);
    const dashboard = await this.dashboard.get(id);
    const user = await this.target(id);
    return {
      user: this.presentUser(user),
      profile: await this.profile.getProfile(id),
      dashboard,
    };
  }

  /** Read-only certification history with a plain-language account of how the numbers were derived. */
  async certificationHistory(id: string) {
    await this.target(id);
    const result = await this.sync.syncUser(id);
    const user = await this.target(id);
    const rows = await this.prisma.certification.findMany({
      where: { userId: id },
      orderBy: { uploadedAt: 'desc' },
    });
    const required = await this.settings.getRequiredPerCycle();
    const engineCerts: EngineCert[] = rows
      .filter((r) => r.deletedAt === null)
      .map((r) => ({
        id: r.id,
        uploadedAt: r.uploadedAt,
        status: r.status,
        cycleNo: r.cycleNo,
      }));
    const lapseLogs = await this.prisma.auditLog.findMany({
      where: { action: 'certification.lapse', entity: 'user', entityId: id },
      orderBy: { createdAt: 'asc' },
    });
    const lapses = lapseLogs.map((l) => {
      const after = l.after as {
        cycleNo: number;
        ruleInstant: string;
        lapsedCertificationIds: string[];
      };
      return {
        cycleNo: after.cycleNo,
        ruleInstant: new Date(after.ruleInstant),
        certCount: after.lapsedCertificationIds.length,
      };
    });
    return {
      user: this.presentUser(user),
      explanation: explain({
        onboarded: user.onboardedAt !== null,
        state: { cycleNo: user.cycleNo, start: user.cycleStartDate },
        certs: engineCerts,
        requiredPerCycle: required,
        now: this.clock.now(),
        lapses,
      }),
      progress: {
        completed: result?.evaluation.progressCount ?? 0,
        required,
      },
      certifications: rows.map((r) => ({
        ...presentCertification(r, user.cycleStartDate, user.cycleNo),
        deleted: r.deletedAt !== null,
        deletedAt: r.deletedAt,
      })),
    };
  }

  async update(actorId: string, id: string, dto: UpdateUserDto) {
    const before = await this.target(id);
    const email = dto.email?.trim().toLowerCase();
    if (email && email !== before.email) {
      const taken = await this.prisma.user.findUnique({ where: { email } });
      if (taken)
        throw conflict('EMAIL_TAKEN', 'Another account uses this email');
    }
    if (dto.answers) {
      // Validates everything before any write, and audits the answer changes.
      await this.profile.saveProfile(id, dto.answers, actorId);
    }
    const name = dto.name?.trim();
    if ((name && name !== before.name) || (email && email !== before.email)) {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id },
          data: { name, email },
        });
        await this.audit.log(
          {
            actorId,
            action: 'user.update',
            entity: 'user',
            entityId: id,
            before: { name: before.name, email: before.email },
            after: { name: name ?? before.name, email: email ?? before.email },
          },
          tx,
        );
      });
    }
    return this.detail(id);
  }

  /** Soft delete. The user loses access immediately; certifications and files are kept. */
  async remove(actorId: string, id: string) {
    const before = await this.target(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { deletedAt: this.clock.now() },
      });
      await this.audit.log(
        {
          actorId,
          action: 'user.delete',
          entity: 'user',
          entityId: id,
          before: {
            name: before.name,
            email: before.email,
            status: before.status,
          },
        },
        tx,
      );
    });
    return { deleted: true };
  }

  async resync(id: string) {
    await this.target(id);
    return this.dashboard.get(id);
  }

  async createAdmin(actorId: string, dto: CreateAdminDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw conflict(
        'EMAIL_TAKEN',
        'An account with this email already exists',
      );
    }
    const admin = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          name: dto.name.trim(),
          role: 'ADMIN',
          passwordHash: await argon2.hash(dto.password),
          emailVerifiedAt: this.clock.now(),
        },
      });
      await this.audit.log(
        {
          actorId,
          action: 'admin.create',
          entity: 'user',
          entityId: created.id,
          after: { email, name: created.name, role: 'ADMIN' },
        },
        tx,
      );
      return created;
    });
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
  }
}
