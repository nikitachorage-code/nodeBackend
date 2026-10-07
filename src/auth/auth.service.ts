import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { ClockService } from '../common/clock/clock.service.js';
import { MailService } from '../common/mail/mail.service.js';
import {
  badRequest,
  conflict,
  unauthorized,
  forbidden,
} from '../common/errors/api-exception.js';
import type { Env } from '../config/env.validation.js';
import type { EmailTokenType } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RegisterDto } from './auth.dto.js';

const TOKEN_TTL_MS: Record<EmailTokenType, number> = {
  VERIFY: 24 * 3_600_000,
  RESET: 3_600_000,
};

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly clock: ClockService,
    private readonly mail: MailService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private get exposeTokens() {
    return this.config.get('EXPOSE_DEV_TOKENS', { infer: true });
  }

  hashPassword(password: string) {
    return argon2.hash(password);
  }

  private async issueToken(userId: string, type: EmailTokenType) {
    const token = randomBytes(32).toString('hex');
    await this.prisma.emailToken.create({
      data: {
        userId,
        type,
        tokenHash: sha256(token),
        expiresAt: new Date(this.clock.now().getTime() + TOKEN_TTL_MS[type]),
      },
    });
    return token;
  }

  /** Validates and consumes a single-use token. */
  private async consumeToken(token: string, type: EmailTokenType) {
    const record = await this.prisma.emailToken.findUnique({
      where: { tokenHash: sha256(token) },
    });
    const now = this.clock.now();
    if (
      !record ||
      record.type !== type ||
      record.usedAt ||
      record.expiresAt.getTime() <= now.getTime()
    ) {
      throw badRequest('INVALID_TOKEN', 'Token is invalid or has expired');
    }
    await this.prisma.emailToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    });
    return record.userId;
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw conflict(
        'EMAIL_TAKEN',
        'An account with this email already exists',
      );
    }
    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name.trim(),
        passwordHash: await this.hashPassword(dto.password),
        role: 'USER',
      },
    });
    const token = await this.issueToken(user.id, 'VERIFY');
    this.mail.sendVerification(user.email, user.name, token);
    return {
      message: 'Registered. Check your email to verify your account.',
      ...(this.exposeTokens ? { verificationToken: token } : {}),
    };
  }

  async verifyEmail(token: string) {
    const userId = await this.consumeToken(token, 'VERIFY');
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: this.clock.now() },
    });
    return { message: 'Email verified' };
  }

  async login(emailInput: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: emailInput.trim().toLowerCase() },
    });
    const valid =
      user &&
      !user.deletedAt &&
      (await argon2.verify(user.passwordHash, password));
    if (!user || !valid) {
      throw unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');
    }
    if (!user.emailVerifiedAt) {
      throw forbidden(
        'EMAIL_NOT_VERIFIED',
        'Verify your email before logging in',
      );
    }
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    });
    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async forgotPassword(emailInput: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: emailInput.trim().toLowerCase() },
    });
    let token: string | undefined;
    if (user && !user.deletedAt) {
      token = await this.issueToken(user.id, 'RESET');
      this.mail.sendPasswordReset(user.email, user.name, token);
    }
    // Same response whether or not the account exists.
    return {
      message: 'If the account exists, a reset email has been sent.',
      ...(this.exposeTokens && token ? { resetToken: token } : {}),
    };
  }

  async resetPassword(token: string, password: string) {
    const userId = await this.consumeToken(token, 'RESET');
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await this.hashPassword(password) },
    });
    return { message: 'Password updated' };
  }

  async changePassword(userId: string, current: string, next: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!(await argon2.verify(user.passwordHash, current))) {
      throw badRequest(
        'INVALID_CURRENT_PASSWORD',
        'Current password is incorrect',
      );
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await this.hashPassword(next) },
    });
    return { message: 'Password updated' };
  }
}
