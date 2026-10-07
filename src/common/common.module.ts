import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit/audit.service.js';
import { ClockService } from './clock/clock.service.js';
import { MailService } from './mail/mail.service.js';

@Global()
@Module({
  providers: [ClockService, AuditService, MailService],
  exports: [ClockService, AuditService, MailService],
})
export class CommonModule {}
