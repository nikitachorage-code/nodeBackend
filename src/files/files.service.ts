import { Injectable, OnModuleInit, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { AuthUser } from '../common/decorators/decorators.js';
import { badRequest, notFound } from '../common/errors/api-exception.js';
import type { Env } from '../config/env.validation.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface DetectedType {
  mime: string;
  ext: string;
}

/** Identifies PDF, PNG, JPEG and WEBP by their magic bytes. Never trusts the client's type. */
export function detectFileType(buf: Buffer): DetectedType | null {
  if (buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') {
    return { mime: 'application/pdf', ext: 'pdf' };
  }
  if (
    buf.length >= 8 &&
    buf
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (
    buf.length >= 3 &&
    buf[0] === 0xff &&
    buf[1] === 0xd8 &&
    buf[2] === 0xff
  ) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buf.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly dir: string;
  private readonly maxBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.dir = resolve(config.get('UPLOAD_DIR', { infer: true }));
    this.maxBytes = config.get('MAX_UPLOAD_BYTES', { infer: true });
  }

  async onModuleInit() {
    await mkdir(this.dir, { recursive: true });
  }

  async upload(owner: AuthUser, file: Express.Multer.File | undefined) {
    if (!file) {
      throw badRequest(
        'FILE_REQUIRED',
        'Send the file in the "file" form field',
      );
    }
    if (file.size > this.maxBytes) {
      throw badRequest(
        'FILE_TOO_LARGE',
        `Files may be at most ${this.maxBytes} bytes`,
      );
    }
    const type = detectFileType(file.buffer);
    if (!type) {
      throw badRequest(
        'UNSUPPORTED_FILE_TYPE',
        'Only PDF, PNG, JPEG and WEBP files are accepted',
      );
    }
    const storedName = `${randomUUID()}.${type.ext}`;
    await writeFile(join(this.dir, storedName), file.buffer);
    const row = await this.prisma.storedFile.create({
      data: {
        ownerId: owner.id,
        storedName,
        originalName: file.originalname.slice(0, 255),
        mime: type.mime,
        size: file.size,
      },
    });
    return {
      id: row.id,
      originalName: row.originalName,
      mime: row.mime,
      size: row.size,
    };
  }

  /** True when the file exists and belongs to `userId` (used to validate file fields). */
  async isOwnedBy(fileId: string, userId: string): Promise<boolean> {
    const row = await this.prisma.storedFile.findUnique({
      where: { id: fileId },
      select: { ownerId: true },
    });
    return row?.ownerId === userId;
  }

  /** Streams a file to its owner or to an admin. Others get a 404 so file ids stay private. */
  async open(fileId: string, requester: AuthUser) {
    const row = await this.prisma.storedFile.findUnique({
      where: { id: fileId },
    });
    if (!row || (row.ownerId !== requester.id && requester.role !== 'ADMIN')) {
      throw notFound('FILE_NOT_FOUND', 'File not found');
    }
    const safeName = row.originalName.replace(/[^\w.\- ]+/g, '_');
    return new StreamableFile(
      createReadStream(join(this.dir, row.storedName)),
      {
        type: row.mime,
        disposition: `attachment; filename="${safeName}"`,
        length: row.size,
      },
    );
  }
}
