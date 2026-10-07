import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CommonModule } from './common/common.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { JwtAuthGuard, RolesGuard } from './common/guards/guards.js';
import { validateEnv, type Env } from './config/env.validation.js';
import { CertificationsModule } from './certifications/certifications.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { SyncModule } from './sync/sync.module.js';
import { FilesModule } from './files/files.module.js';
import { FormsModule } from './forms/forms.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProfileModule } from './profile/profile.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => [
        {
          ttl: 60_000,
          limit: config.get('GLOBAL_THROTTLE_LIMIT', { infer: true }),
        },
      ],
    }),
    PrismaModule,
    CommonModule,
    AuthModule,
    FormsModule,
    FilesModule,
    SettingsModule,
    SyncModule,
    ProfileModule,
    CertificationsModule,
    DashboardModule,
    JobsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Order matters: throttle, then authenticate, then authorise by role.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
