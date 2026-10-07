import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import type { Env } from '../config/env.validation.js';
import { SyncService } from '../sync/sync.service.js';

@Injectable()
export class JobsService {
  private readonly logger = new Logger('DailyJob');

  constructor(
    private readonly sync: SyncService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Every day at 02:00 server time. Disabled with ENABLE_SCHEDULER=false. */
  @Cron('0 2 * * *')
  async scheduled() {
    if (!this.config.get('ENABLE_SCHEDULER', { infer: true })) return;
    await this.runDaily();
  }

  /** Re-syncs every user (lapses, status, progress) and sends pre-Year-3 warnings. Idempotent. */
  async runDaily() {
    const result = await this.sync.syncAll({ warn: true });
    this.logger.log(
      `Synced ${result.users} users, ${result.lapsedUsers} lapsed`,
    );
    return result;
  }
}
