import { Injectable } from '@nestjs/common';
import { ClockService } from '../common/clock/clock.service.js';
import { AuditService } from '../common/audit/audit.service.js';
import {
  badRequest,
  conflict,
  notFound,
} from '../common/errors/api-exception.js';
import { startCycle } from '../cycle-engine/cycle-engine.js';
import { FilesService } from '../files/files.service.js';
import { PASSPORT_FIELD_KEY } from '../forms/default-config.js';
import {
  FormConfigService,
  presentField,
  type StepWithFields,
} from '../forms/form-config.service.js';
import {
  isFilled,
  throwIfIssues,
  validateAnswers,
  type ValidationIssue,
} from '../forms/validate-answers.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type AnswerInput = Record<string, Record<string, unknown>>;

export interface MissingField {
  step: string;
  field: string;
  label: string;
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly forms: FormConfigService,
    private readonly files: FilesService,
    private readonly clock: ClockService,
    private readonly audit: AuditService,
  ) {}

  private async profileSteps(): Promise<StepWithFields[]> {
    return (await this.forms.activeSteps()).filter((s) => !s.repeatable);
  }

  private async liveUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt)
      throw notFound('USER_NOT_FOUND', 'User not found');
    return user;
  }

  private async answerMap(userId: string) {
    const rows = await this.prisma.profileAnswer.findMany({
      where: { userId },
    });
    return new Map(rows.map((r) => [r.fieldId, r.value]));
  }

  private missingFrom(
    steps: StepWithFields[],
    answers: Map<string, unknown>,
  ): MissingField[] {
    const missing: MissingField[] = [];
    for (const s of steps) {
      for (const f of s.fields) {
        if (f.required && f.visible && !isFilled(f.type, answers.get(f.id))) {
          missing.push({ step: s.key, field: f.key, label: f.label });
        }
      }
    }
    return missing;
  }

  async missingRequired(userId: string): Promise<MissingField[]> {
    return this.missingFrom(
      await this.profileSteps(),
      await this.answerMap(userId),
    );
  }

  async getProfile(userId: string) {
    const user = await this.liveUser(userId);
    const steps = await this.profileSteps();
    const answers = await this.answerMap(userId);
    const missing = this.missingFrom(steps, answers);
    return {
      onboarded: user.onboardedAt !== null,
      onboardedAt: user.onboardedAt,
      profileComplete: missing.length === 0,
      missing,
      steps: steps.map((s) => {
        const visible = s.fields.filter((f) => f.visible);
        return {
          key: s.key,
          title: s.title,
          order: s.order,
          complete: !missing.some((m) => m.step === s.key),
          fields: visible.map((f) => ({
            ...presentField(f),
            value: answers.get(f.id) ?? null,
          })),
        };
      }),
    };
  }

  /**
   * Saves (possibly partial) answers: `{ [stepKey]: { [fieldKey]: value | null } }`.
   * Used for the user's own drafts and for admin edits (`actorId` set).
   */
  async saveProfile(userId: string, input: AnswerInput, actorId?: string) {
    const user = await this.liveUser(userId);
    const steps = await this.profileSteps();
    const stepsByKey = new Map(steps.map((s) => [s.key, s]));
    const issues: ValidationIssue[] = [];
    const writes: { fieldId: string; key: string; value: unknown }[] = [];
    const nested = Object.entries(input);

    for (const [stepKey, stepInput] of nested) {
      const step = stepsByKey.get(stepKey);
      if (!step) {
        issues.push({ field: stepKey, message: 'Unknown step' });
        continue;
      }
      if (
        stepInput === null ||
        typeof stepInput !== 'object' ||
        Array.isArray(stepInput)
      ) {
        issues.push({
          field: stepKey,
          message: 'Must be an object of field values',
        });
        continue;
      }
      const result = await validateAnswers(
        step.fields.filter((f) => f.visible),
        stepInput,
        {
          requireAll: false,
          // Once onboarded, required fields may be changed but not blanked.
          allowClearRequired: user.onboardedAt === null,
          prefix: stepKey,
          fileUsable: (id) => this.files.isOwnedBy(id, userId),
        },
      );
      issues.push(...result.issues);
      for (const [key, value] of Object.entries(result.values)) {
        const field = step.fields.find((f) => f.key === key)!;
        writes.push({ fieldId: field.id, key, value });
      }
    }
    throwIfIssues(issues);

    const before = await this.answerMap(userId);
    await this.prisma.$transaction(async (tx) => {
      for (const w of writes) {
        if (w.value === null) {
          await tx.profileAnswer.deleteMany({
            where: { userId, fieldId: w.fieldId },
          });
        } else {
          const value = w.value as Prisma.InputJsonValue;
          await tx.profileAnswer.upsert({
            where: { userId_fieldId: { userId, fieldId: w.fieldId } },
            create: { userId, fieldId: w.fieldId, value },
            update: { value },
          });
        }
      }
      const passport = writes.find((w) => w.key === PASSPORT_FIELD_KEY);
      if (passport) {
        await tx.user.update({
          where: { id: userId },
          data: {
            passportNo:
              typeof passport.value === 'string' ? passport.value : null,
          },
        });
      }
      if (actorId && writes.length > 0) {
        await this.audit.log(
          {
            actorId,
            action: 'user.profile.update',
            entity: 'user',
            entityId: userId,
            before: Object.fromEntries(
              writes.map((w) => [w.key, before.get(w.fieldId) ?? null]),
            ),
            after: Object.fromEntries(writes.map((w) => [w.key, w.value])),
          },
          tx,
        );
      }
    });
    return this.getProfile(userId);
  }

  /** Completes onboarding: every required profile field must be filled. Starts the first cycle. */
  async submitOnboarding(userId: string) {
    const user = await this.liveUser(userId);
    if (user.onboardedAt) {
      throw conflict(
        'ALREADY_ONBOARDED',
        'Onboarding has already been submitted',
      );
    }
    const missing = await this.missingRequired(userId);
    if (missing.length > 0) {
      throw badRequest(
        'ONBOARDING_INCOMPLETE',
        'Fill in all required fields before submitting',
        { missing },
      );
    }
    const now = this.clock.now();
    const cycle = startCycle({ cycleNo: user.cycleNo, start: null }, now);
    const { count } = await this.prisma.user.updateMany({
      where: { id: userId, onboardedAt: null },
      data: {
        onboardedAt: now,
        cycleNo: cycle.cycleNo,
        cycleStartDate: cycle.start,
      },
    });
    if (count === 0) {
      throw conflict(
        'ALREADY_ONBOARDED',
        'Onboarding has already been submitted',
      );
    }
    return this.getProfile(userId);
  }
}
