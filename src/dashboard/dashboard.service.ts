import { Injectable } from '@nestjs/common';
import { ClockService } from '../common/clock/clock.service.js';
import { notFound } from '../common/errors/api-exception.js';
import {
  cycleWindows,
  pastCycles,
  yearTiles,
} from '../cycle-engine/cycle-engine.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { SyncService } from '../sync/sync.service.js';

const DAY_MS = 86_400_000;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sync: SyncService,
    private readonly settings: SettingsService,
    private readonly clock: ClockService,
  ) {}

  async get(userId: string) {
    const result = await this.sync.syncUser(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt)
      throw notFound('USER_NOT_FOUND', 'User not found');
    const now = this.clock.now();
    const required = await this.settings.getRequiredPerCycle();

    if (!result) {
      return {
        onboarded: false,
        status: user.status,
        now,
        cycle: null,
        progress: { completed: 0, required, label: `0/${required}` },
        atRisk: false,
        warning: {
          code: 'ONBOARDING_REQUIRED',
          message: 'Complete onboarding to start your first cycle.',
        },
        pastCycles: [],
        lapsedCertifications: 0,
      };
    }

    const { evaluation, certs } = result;
    const state = evaluation.state;
    const w = state.start ? cycleWindows(state.start) : null;
    const lapsedCertifications = certs.filter(
      (c) => c.status === 'LAPSED',
    ).length;

    let warning: {
      code: string;
      message: string;
      deadline?: Date;
      daysLeft?: number;
    } | null = null;
    if (evaluation.atRisk && w) {
      const daysLeft = Math.max(
        0,
        Math.ceil((w.year3.start.getTime() - now.getTime()) / DAY_MS),
      );
      warning = {
        code: 'LAPSE_RISK',
        message: `Upload a certification before ${w.year3.start.toISOString().slice(0, 10)} or all your certifications will lapse.`,
        deadline: w.year3.start,
        daysLeft,
      };
    } else if (!state.start) {
      warning = {
        code: 'NO_ACTIVE_CYCLE',
        message:
          lapsedCertifications > 0
            ? 'Your certifications lapsed. Your next certification upload starts a new cycle.'
            : 'Your next certification upload starts a new cycle.',
      };
    }

    return {
      onboarded: true,
      status: evaluation.status,
      now,
      cycle: state.start
        ? {
            cycleNo: state.cycleNo,
            start: state.start,
            end: w!.end,
            currentYear: evaluation.currentYear,
            years: yearTiles(state, certs, now),
          }
        : null,
      progress: {
        completed: evaluation.progressCount,
        required,
        label: `${evaluation.progressCount}/${required}`,
      },
      atRisk: evaluation.atRisk,
      warning,
      pastCycles: pastCycles(state, certs),
      lapsedCertifications,
    };
  }
}
