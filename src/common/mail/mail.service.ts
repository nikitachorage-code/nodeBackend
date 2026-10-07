import { Injectable, Logger } from '@nestjs/common';

export interface Mail {
  to: string;
  subject: string;
  body: string;
  kind: 'VERIFY_EMAIL' | 'PASSWORD_RESET' | 'LAPSE_WARNING' | 'LAPSE_NOTICE';
}

/** Logs emails to the console for now. The recent outbox is kept in memory for tests. */
@Injectable()
export class MailService {
  private readonly logger = new Logger('Mail');
  readonly outbox: Mail[] = [];

  private send(mail: Mail) {
    this.outbox.push(mail);
    if (this.outbox.length > 200) this.outbox.shift();
    this.logger.log(`To: ${mail.to} | ${mail.subject}\n${mail.body}`);
  }

  sendVerification(to: string, name: string, token: string) {
    this.send({
      kind: 'VERIFY_EMAIL',
      to,
      subject: 'Verify your email',
      body: `Hi ${name}, verify your email with this token: ${token}`,
    });
  }

  sendPasswordReset(to: string, name: string, token: string) {
    this.send({
      kind: 'PASSWORD_RESET',
      to,
      subject: 'Reset your password',
      body: `Hi ${name}, reset your password with this token: ${token}`,
    });
  }

  sendLapseWarning(to: string, name: string, deadline: Date) {
    this.send({
      kind: 'LAPSE_WARNING',
      to,
      subject: 'Upload a certification to keep your certifications',
      body: `Hi ${name}, upload a certification before ${deadline.toISOString().slice(0, 10)} or all your certifications will lapse.`,
    });
  }

  sendLapseNotice(to: string, name: string) {
    this.send({
      kind: 'LAPSE_NOTICE',
      to,
      subject: 'Your certifications have lapsed',
      body: `Hi ${name}, your certifications lapsed. Upload a new certification to start a new cycle.`,
    });
  }
}
