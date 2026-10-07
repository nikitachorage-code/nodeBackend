import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../common/audit/audit.service.js';
import { ClockService } from '../common/clock/clock.service.js';
import { MailService } from '../common/mail/mail.service.js';
import type { Env } from '../config/env.validation.js';
import {
  addYears,
  evaluate,
  shouldWarn,
  type EngineCert,
  type Evaluation,
} from '../cycle-engine/cycle-engine.js';
import { CERT_NUMBER_KEY } from '../forms/default-config.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';

export interface SyncResult {
  evaluation: Evaluation;
  certs: EngineCert[];
  lapsed: boolean;
}

interface PendingMail {
  kind: 'lapse' | 'warning';
  email: string;
  name: string;
  deadline?: Date;
}

export type SyncFn = (opts?: { warn?: boolean }) => Promise<SyncResult | null>;

/**
 * The one place that applies the cycle engine to the database. Cached status,
 * progress and at-risk flags on `users` are always rebuilt from certification
 * records here, so calling it repeatedly is safe (idempotent).
 */
@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: ClockService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly settings: SettingsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Runs `fn` in a transaction holding a row lock on the user, so concurrent
   * uploads, deletes and the daily job serialise per user. `sync()` can be
   * called any number of times inside. Emails go out after the commit.
   */
  async transact<T>(
    userId: string,
    fn: (tx: Prisma.TransactionClient, sync: SyncFn) => Promise<T>,
  ): Promise<T> {
    const mails: PendingMail[] = [];
    const result = await this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
        return fn(tx, (opts) => this.syncTx(tx, userId, mails, opts));
      },
      { timeout: 20_000 },
    );
    for (const m of mails) {
      if (m.kind === 'lapse') this.mail.sendLapseNotice(m.email, m.name);
      else this.mail.sendLapseWarning(m.email, m.name, m.deadline!);
    }
    return result;
  }

  /** Rebuilds one user's cycle state from their certification records. */
  syncUser(
    userId: string,
    opts?: { warn?: boolean },
  ): Promise<SyncResult | null> {
    return this.transact(userId, (_tx, sync) => sync(opts));
  }

  /** Syncs every active, onboarded user (the daily job). */
  async syncAll(opts?: { warn?: boolean }) {
    const ids = await this.prisma.user.findMany({
      where: { deletedAt: null, onboardedAt: { not: null }, role: 'USER' },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    let lapsedUsers = 0;
    for (const { id } of ids) {
      const r = await this.syncUser(id, opts);
      if (r?.lapsed) lapsedUsers += 1;
    }
    return { users: ids.length, lapsedUsers };
  }

  private async syncTx(
    tx: Prisma.TransactionClient,
    userId: string,
    mails: PendingMail[],
    opts?: { warn?: boolean },
  ): Promise<SyncResult | null> {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt || !user.onboardedAt) return null;

    const rows = await tx.certification.findMany({
      where: { userId, deletedAt: null },
    });
    const now = this.clock.now();
    const certs: EngineCert[] = rows.map((r) => ({
      id: r.id,
      uploadedAt: r.uploadedAt,
      status: r.status,
      cycleNo: r.cycleNo,
    }));

    const evaluation = evaluate({
      state: { cycleNo: user.cycleNo, start: user.cycleStartDate },
      certs,
      requiredPerCycle: await this.settings.getRequiredPerCycle(tx),
      now,
    });

    // Apply lapses and cycle assignments to the records.
    const lapsedIds = new Set(
      evaluation.lapses.flatMap((l) => l.lapsedCertIds),
    );
    if (lapsedIds.size > 0) {
      await tx.certification.updateMany({
        where: { id: { in: [...lapsedIds] } },
        data: { status: 'LAPSED', lapsedAt: now },
      });
    }
    const byCycle = new Map<number, string[]>();
    for (const a of evaluation.assignments) {
      byCycle.set(a.cycleNo, [...(byCycle.get(a.cycleNo) ?? []), a.certId]);
    }
    for (const [cycleNo, ids] of byCycle) {
      await tx.certification.updateMany({
        where: { id: { in: ids } },
        data: { cycleNo },
      });
    }
    for (const l of evaluation.lapses) {
      await this.audit.log(
        {
          actorId: null,
          action: 'certification.lapse',
          entity: 'user',
          entityId: userId,
          after: {
            cycleNo: l.cycleNo,
            ruleInstant: l.ruleInstant,
            lapsedCertificationIds: l.lapsedCertIds,
          },
        },
        tx,
      );
    }

    const assigned = new Map(
      evaluation.assignments.map((a) => [a.certId, a.cycleNo]),
    );
    const after: EngineCert[] = certs.map((c) => ({
      ...c,
      status: lapsedIds.has(c.id) ? 'LAPSED' : c.status,
      cycleNo: assigned.get(c.id) ?? c.cycleNo,
    }));

    const latestActive = rows
      .filter((r) => !lapsedIds.has(r.id) && r.status === 'ACTIVE')
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];
    const certNo = (
      latestActive?.data as Record<string, unknown> | undefined
    )?.[CERT_NUMBER_KEY];
    const lastCertNo = typeof certNo === 'string' ? certNo : null;

    let warningSentCycle = user.warningSentCycle;
    if (
      opts?.warn &&
      evaluation.state.start &&
      warningSentCycle !== evaluation.state.cycleNo &&
      shouldWarn(
        evaluation.state,
        after,
        now,
        this.config.get('WARNING_LEAD_DAYS', { infer: true }),
      )
    ) {
      warningSentCycle = evaluation.state.cycleNo;
      mails.push({
        kind: 'warning',
        email: user.email,
        name: user.name,
        deadline: addYears(evaluation.state.start, 2),
      });
    }

    const next = {
      status: evaluation.status,
      cycleNo: evaluation.state.cycleNo,
      cycleStartDate: evaluation.state.start,
      progressCount: evaluation.progressCount,
      atRisk: evaluation.atRisk,
      lastCertNo,
      warningSentCycle,
    };
    const changed =
      next.status !== user.status ||
      next.cycleNo !== user.cycleNo ||
      next.cycleStartDate?.getTime() !== user.cycleStartDate?.getTime() ||
      next.progressCount !== user.progressCount ||
      next.atRisk !== user.atRisk ||
      next.lastCertNo !== user.lastCertNo ||
      next.warningSentCycle !== user.warningSentCycle;
    if (changed) {
      await tx.user.update({ where: { id: userId }, data: next });
    }

    if (evaluation.lapses.length > 0) {
      mails.push({ kind: 'lapse', email: user.email, name: user.name });
    }
    return { evaluation, certs: after, lapsed: evaluation.lapses.length > 0 };
  }
}
