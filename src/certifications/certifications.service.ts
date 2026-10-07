import { Injectable } from '@nestjs/common';
import { AuditService } from '../common/audit/audit.service.js';
import { ClockService } from '../common/clock/clock.service.js';
import type { AuthUser } from '../common/decorators/decorators.js';
import {
  conflict,
  forbidden,
  notFound,
} from '../common/errors/api-exception.js';
import { yearOfCycle } from '../cycle-engine/cycle-engine.js';
import { FilesService } from '../files/files.service.js';
import { CERT_FILE_KEY, UPLOAD_DATE_KEY } from '../forms/default-config.js';
import { FormConfigService } from '../forms/form-config.service.js';
import { throwIfIssues, validateAnswers } from '../forms/validate-answers.js';
import type { Certification, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { SyncService, type SyncResult } from '../sync/sync.service.js';

type CertData = Record<string, string | number | boolean>;

export function presentCertification(
  c: Certification,
  cycleStart: Date | null,
  currentCycleNo: number,
) {
  return {
    id: c.id,
    cycleNo: c.cycleNo,
    status: c.status,
    uploadedAt: c.uploadedAt,
    lapsedAt: c.lapsedAt,
    /** Year of the cycle (1-3) this was uploaded in; only known for the current cycle. */
    cycleYear:
      cycleStart && c.cycleNo === currentCycleNo
        ? yearOfCycle(cycleStart, c.uploadedAt)
        : null,
    data: c.data as CertData,
    fileId: c.fileId,
    fileUrl: c.fileId ? `/api/files/${c.fileId}` : null,
    readOnly: c.status === 'LAPSED',
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

@Injectable()
export class CertificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sync: SyncService,
    private readonly forms: FormConfigService,
    private readonly files: FilesService,
    private readonly clock: ClockService,
    private readonly audit: AuditService,
    private readonly settings: SettingsService,
  ) {}

  private async certFields() {
    const step = (await this.forms.activeSteps()).find((s) => s.repeatable);
    return (step?.fields ?? []).filter((f) => f.visible);
  }

  private async summary(result: SyncResult | null) {
    const required = await this.settings.getRequiredPerCycle();
    return {
      status: result?.evaluation.status ?? 'CANDIDATE',
      progress: {
        completed: result?.evaluation.progressCount ?? 0,
        required,
      },
      lapsed: result?.lapsed ?? false,
    };
  }

  private async requireOnboarded(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt)
      throw notFound('USER_NOT_FOUND', 'User not found');
    if (!user.onboardedAt) {
      throw forbidden(
        'ONBOARDING_REQUIRED',
        'Complete onboarding before adding certifications',
      );
    }
    return user;
  }

  private async load(
    userId: string,
    id: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const cert = await tx.certification.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!cert)
      throw notFound('CERTIFICATION_NOT_FOUND', 'Certification not found');
    return cert;
  }

  async create(actor: AuthUser, data: Record<string, unknown>) {
    await this.requireOnboarded(actor.id);
    const fields = await this.certFields();
    const { values, issues } = await validateAnswers(fields, data, {
      requireAll: true,
      readOnlyKeys: new Set([UPLOAD_DATE_KEY]),
      fileUsable: (id) => this.files.isOwnedBy(id, actor.id),
    });
    throwIfIssues(issues);

    return this.sync.transact(actor.id, async (tx, sync) => {
      // Bring the cycle up to date first, so a lapse due before this upload happens before it.
      await sync();
      const uploadedAt = this.clock.now();
      const cert = await tx.certification.create({
        data: {
          userId: actor.id,
          cycleNo: 0,
          data: values as Prisma.InputJsonObject,
          fileId: values[CERT_FILE_KEY] as string,
          uploadedAt,
        },
      });
      const result = await sync();
      const fresh = await tx.certification.findUniqueOrThrow({
        where: { id: cert.id },
      });
      const user = await tx.user.findUniqueOrThrow({ where: { id: actor.id } });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'certification.create',
          entity: 'certification',
          entityId: cert.id,
          after: { cycleNo: fresh.cycleNo, uploadedAt, data: values },
        },
        tx,
      );
      return {
        certification: presentCertification(
          fresh,
          user.cycleStartDate,
          user.cycleNo,
        ),
        ...(await this.summary(result)),
      };
    });
  }

  async list(userId: string, status?: 'ACTIVE' | 'LAPSED') {
    await this.sync.syncUser(userId);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const rows = await this.prisma.certification.findMany({
      where: { userId, deletedAt: null, ...(status ? { status } : {}) },
      orderBy: { uploadedAt: 'desc' },
    });
    return rows.map((c) =>
      presentCertification(c, user.cycleStartDate, user.cycleNo),
    );
  }

  async get(userId: string, id: string) {
    await this.sync.syncUser(userId);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return presentCertification(
      await this.load(userId, id),
      user.cycleStartDate,
      user.cycleNo,
    );
  }

  async update(actor: AuthUser, id: string, data: Record<string, unknown>) {
    const fields = await this.certFields();
    const { values, issues } = await validateAnswers(fields, data, {
      requireAll: false,
      allowClearRequired: false,
      readOnlyKeys: new Set([UPLOAD_DATE_KEY]),
      fileUsable: (fid) => this.files.isOwnedBy(fid, actor.id),
    });
    throwIfIssues(issues);

    return this.sync.transact(actor.id, async (tx, sync) => {
      await sync();
      const before = await this.load(actor.id, id, tx);
      if (before.status === 'LAPSED') {
        throw conflict(
          'CERTIFICATION_LAPSED',
          'Lapsed certifications are read-only',
        );
      }
      const merged: CertData = { ...(before.data as CertData) };
      for (const [k, v] of Object.entries(values)) {
        if (v === null) delete merged[k];
        else merged[k] = v;
      }
      // uploadedAt and cycleNo are never touched here: editing cannot move a certification to another year.
      const after = await tx.certification.update({
        where: { id },
        data: {
          data: merged as Prisma.InputJsonObject,
          fileId:
            (merged[CERT_FILE_KEY] as string | undefined) ?? before.fileId,
        },
      });
      const result = await sync();
      const user = await tx.user.findUniqueOrThrow({ where: { id: actor.id } });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'certification.update',
          entity: 'certification',
          entityId: id,
          before: before.data,
          after: merged,
        },
        tx,
      );
      return {
        certification: presentCertification(
          after,
          user.cycleStartDate,
          user.cycleNo,
        ),
        ...(await this.summary(result)),
      };
    });
  }

  /** Soft-deletes. Everything recalculates; completed cycles stay frozen (see cycle engine). */
  async remove(actor: AuthUser, id: string) {
    return this.sync.transact(actor.id, async (tx, sync) => {
      await sync();
      const before = await this.load(actor.id, id, tx);
      if (before.status === 'LAPSED') {
        throw conflict(
          'CERTIFICATION_LAPSED',
          'Lapsed certifications are read-only',
        );
      }
      await tx.certification.update({
        where: { id },
        data: { deletedAt: this.clock.now() },
      });
      const result = await sync();
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'certification.delete',
          entity: 'certification',
          entityId: id,
          before: {
            cycleNo: before.cycleNo,
            uploadedAt: before.uploadedAt,
            data: before.data,
          },
        },
        tx,
      );
      return { deleted: true, ...(await this.summary(result)) };
    });
  }
}
