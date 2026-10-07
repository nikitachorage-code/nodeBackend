import { Injectable } from '@nestjs/common';
import { AuditService } from '../common/audit/audit.service.js';
import {
  badRequest,
  conflict,
  notFound,
} from '../common/errors/api-exception.js';
import { Prisma } from '../generated/prisma/client.js';
import type { Field, Step } from '../generated/prisma/client.js';
import { ClockService } from '../common/clock/clock.service.js';
import type { FieldType } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UPLOAD_DATE_KEY } from './default-config.js';
import type {
  CreateFieldDto,
  CreateStepDto,
  UpdateFieldDto,
  UpdateStepDto,
} from './form-config.dto.js';

export type StepWithFields = Step & { fields: Field[] };

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^(\d)/, 'f_$1')
    .slice(0, 60);

/** A field is read-only when the system fills it (the certification upload date). */
export const isReadOnlyField = (f: Pick<Field, 'key' | 'system'>) =>
  f.system && f.key === UPLOAD_DATE_KEY;

export function presentField(f: Field) {
  return {
    id: f.id,
    key: f.key,
    label: f.label,
    type: f.type,
    required: f.required,
    helpText: f.helpText,
    visible: f.visible,
    options: f.options,
    order: f.order,
    system: f.system,
    readOnly: isReadOnlyField(f),
    archived: f.archivedAt !== null,
  };
}

export function presentStep(s: StepWithFields) {
  return {
    id: s.id,
    key: s.key,
    title: s.title,
    order: s.order,
    enabled: s.enabled,
    system: s.system,
    repeatable: s.repeatable,
    fields: s.fields.map(presentField),
  };
}

@Injectable()
export class FormConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly clock: ClockService,
  ) {}

  /** Steps and fields a user sees: enabled steps, non-archived visible fields. */
  async listForUsers() {
    const steps = await this.activeSteps();
    return steps.map((s) =>
      presentStep({ ...s, fields: s.fields.filter((f) => f.visible) }),
    );
  }

  /** Steps with their active fields (including hidden ones). Used by validators. */
  activeSteps(): Promise<StepWithFields[]> {
    return this.prisma.step.findMany({
      where: { enabled: true },
      orderBy: { order: 'asc' },
      include: {
        fields: {
          where: { archivedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async listForAdmin() {
    const steps = await this.prisma.step.findMany({
      orderBy: { order: 'asc' },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    return steps.map(presentStep);
  }

  // ---- steps -------------------------------------------------------------

  async createStep(actorId: string, dto: CreateStepDto) {
    const key = dto.key ?? (slug(dto.title) || 'step');
    if (await this.prisma.step.findUnique({ where: { key } })) {
      throw conflict(
        'STEP_KEY_TAKEN',
        `A step with key "${key}" already exists`,
      );
    }
    const last = await this.prisma.step.aggregate({ _max: { order: true } });
    const step = await this.prisma.step.create({
      data: {
        key,
        title: dto.title.trim(),
        order: dto.order ?? (last._max.order ?? 0) + 1,
      },
      include: { fields: true },
    });
    await this.audit.log({
      actorId,
      action: 'step.create',
      entity: 'step',
      entityId: step.id,
      after: presentStep(step),
    });
    return presentStep(step);
  }

  async updateStep(actorId: string, id: string, dto: UpdateStepDto) {
    const before = await this.prisma.step.findUnique({
      where: { id },
      include: { fields: true },
    });
    if (!before) throw notFound('STEP_NOT_FOUND', 'Step not found');
    if (before.system && dto.enabled === false) {
      throw conflict(
        'SYSTEM_STEP_PROTECTED',
        'The certification step cannot be disabled',
      );
    }
    const after = await this.prisma.step.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        order: dto.order,
        enabled: dto.enabled,
      },
      include: { fields: true },
    });
    await this.audit.log({
      actorId,
      action: 'step.update',
      entity: 'step',
      entityId: id,
      before: presentStep(before),
      after: presentStep(after),
    });
    return presentStep(after);
  }

  // ---- fields ------------------------------------------------------------

  private checkOptions(type: FieldType, options: string[] | undefined) {
    if (type === 'DROPDOWN') {
      if (!options || options.length === 0) {
        throw badRequest(
          'OPTIONS_REQUIRED',
          'Dropdown fields need at least one option',
        );
      }
      if (new Set(options).size !== options.length) {
        throw badRequest(
          'OPTIONS_DUPLICATE',
          'Dropdown options must be unique',
        );
      }
    } else if (options !== undefined) {
      throw badRequest(
        'OPTIONS_NOT_ALLOWED',
        'Only dropdown fields can have options',
      );
    }
  }

  async createField(actorId: string, stepId: string, dto: CreateFieldDto) {
    const step = await this.prisma.step.findUnique({ where: { id: stepId } });
    if (!step) throw notFound('STEP_NOT_FOUND', 'Step not found');
    this.checkOptions(dto.type, dto.options);
    const key = dto.key ?? (slug(dto.label) || 'field');
    if (
      await this.prisma.field.findUnique({
        where: { stepId_key: { stepId, key } },
      })
    ) {
      throw conflict(
        'FIELD_KEY_TAKEN',
        `A field with key "${key}" already exists in this step (it may be archived)`,
      );
    }
    const last = await this.prisma.field.aggregate({
      where: { stepId },
      _max: { order: true },
    });
    const field = await this.prisma.field.create({
      data: {
        stepId,
        key,
        label: dto.label.trim(),
        type: dto.type,
        required: dto.required ?? false,
        helpText: dto.helpText ?? null,
        visible: dto.visible ?? true,
        options: dto.options,
        order: dto.order ?? (last._max.order ?? 0) + 1,
      },
    });
    await this.audit.log({
      actorId,
      action: 'field.create',
      entity: 'field',
      entityId: field.id,
      after: presentField(field),
    });
    return presentField(field);
  }

  /** True when any user has stored a value for this field. */
  private async fieldHasData(field: Field, step: Step): Promise<boolean> {
    if (step.repeatable) {
      const rows = await this.prisma.$queryRaw<{ n: bigint }[]>`
        SELECT count(*) AS n FROM certifications
        WHERE jsonb_exists(data, ${field.key})`;
      return Number(rows[0]?.n ?? 0) > 0;
    }
    return (
      (await this.prisma.profileAnswer.count({
        where: { fieldId: field.id },
      })) > 0
    );
  }

  async updateField(actorId: string, id: string, dto: UpdateFieldDto) {
    const before = await this.prisma.field.findUnique({
      where: { id },
      include: { step: true },
    });
    if (!before) throw notFound('FIELD_NOT_FOUND', 'Field not found');
    const { step, ...field } = before;
    if (field.archivedAt) {
      throw conflict('FIELD_ARCHIVED', 'Archived fields cannot be edited');
    }

    if (field.system) {
      if (dto.type !== undefined && dto.type !== field.type) {
        throw conflict(
          'SYSTEM_FIELD_PROTECTED',
          'System field types cannot change',
        );
      }
      if (dto.visible === false) {
        throw conflict(
          'SYSTEM_FIELD_PROTECTED',
          'System fields cannot be hidden',
        );
      }
      if (dto.required !== undefined && dto.required !== field.required) {
        throw conflict(
          'SYSTEM_FIELD_PROTECTED',
          'Required flag of system fields cannot change',
        );
      }
    }

    const newType = dto.type ?? field.type;
    if (newType !== field.type && (await this.fieldHasData(field, step))) {
      throw conflict(
        'FIELD_HAS_DATA',
        'The field type cannot change because data already exists for this field',
      );
    }
    if (dto.options !== undefined || newType !== field.type) {
      this.checkOptions(
        newType,
        dto.options ?? (field.options as string[] | null) ?? undefined,
      );
    }

    const after = await this.prisma.field.update({
      where: { id },
      data: {
        label: dto.label?.trim(),
        type: dto.type,
        required: dto.required,
        helpText: dto.helpText,
        visible: dto.visible,
        options: newType === 'DROPDOWN' ? dto.options : Prisma.DbNull,
        order: dto.order,
      },
    });
    await this.audit.log({
      actorId,
      action: 'field.update',
      entity: 'field',
      entityId: id,
      before: presentField(field),
      after: presentField(after),
    });
    return presentField(after);
  }

  /** Removing a field archives it. Stored answers are kept. */
  async archiveField(actorId: string, id: string) {
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field) throw notFound('FIELD_NOT_FOUND', 'Field not found');
    if (field.system) {
      throw conflict(
        'SYSTEM_FIELD_PROTECTED',
        'System fields cannot be removed',
      );
    }
    if (field.archivedAt) return presentField(field);
    const after = await this.prisma.field.update({
      where: { id },
      data: { archivedAt: this.clock.now() },
    });
    await this.audit.log({
      actorId,
      action: 'field.archive',
      entity: 'field',
      entityId: id,
      before: presentField(field),
      after: presentField(after),
    });
    return presentField(after);
  }
}
