import { Injectable } from '@nestjs/common';
import { AuditService } from '../common/audit/audit.service.js';
import { badRequest } from '../common/errors/api-exception.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const REQUIRED_PER_CYCLE_KEY = 'required_certifications_per_cycle';

/** Known settings: default value and validator. Unknown keys are rejected. */
const DEFINITIONS: Record<
  string,
  { default: unknown; validate: (v: unknown) => boolean; hint: string }
> = {
  [REQUIRED_PER_CYCLE_KEY]: {
    default: 6,
    validate: (v) =>
      Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 100,
    hint: 'an integer between 1 and 100',
  },
};

type Db = Pick<PrismaService, 'setting'> | Prisma.TransactionClient;

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getRequiredPerCycle(db: Db = this.prisma): Promise<number> {
    const row = await db.setting.findUnique({
      where: { key: REQUIRED_PER_CYCLE_KEY },
    });
    return typeof row?.value === 'number'
      ? row.value
      : (DEFINITIONS[REQUIRED_PER_CYCLE_KEY].default as number);
  }

  async getAll(): Promise<Record<string, unknown>> {
    const rows = await this.prisma.setting.findMany();
    const stored = new Map(rows.map((r) => [r.key, r.value]));
    return Object.fromEntries(
      Object.entries(DEFINITIONS).map(([k, d]) => [
        k,
        stored.get(k) ?? d.default,
      ]),
    );
  }

  async update(actorId: string, changes: Record<string, unknown>) {
    for (const [key, value] of Object.entries(changes)) {
      const def = DEFINITIONS[key];
      if (!def) throw badRequest('UNKNOWN_SETTING', `Unknown setting "${key}"`);
      if (!def.validate(value)) {
        throw badRequest('INVALID_SETTING', `${key} must be ${def.hint}`);
      }
    }
    const before = await this.getAll();
    await this.prisma.$transaction(async (tx) => {
      for (const [key, value] of Object.entries(changes)) {
        await tx.setting.upsert({
          where: { key },
          create: { key, value: value as Prisma.InputJsonValue },
          update: { value: value as Prisma.InputJsonValue },
        });
      }
      await this.audit.log(
        {
          actorId,
          action: 'settings.update',
          entity: 'setting',
          before,
          after: { ...before, ...changes },
        },
        tx,
      );
    });
    return this.getAll();
  }
}
