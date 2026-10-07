import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { ClockService } from '../../src/common/clock/clock.service.js';
import { ensureDefaultFormConfig } from '../../src/forms/default-config.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
  clock: ClockService;
  http: () => ReturnType<typeof request>;
}

export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return {
    app,
    prisma: app.get(PrismaService),
    clock: app.get(ClockService),
    http: () => request(app.getHttpServer()),
  };
}

/** Empties every table and re-creates the default steps/fields. */
export async function resetDb(prisma: PrismaService) {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE audit_logs, certifications, files, profile_answers, email_tokens, fields, steps, settings, users RESTART IDENTITY CASCADE`,
  );
  await ensureDefaultFormConfig(prisma);
}

export async function createAdmin(
  prisma: PrismaService,
  email = 'admin@test.dev',
  password = 'AdminPass123!',
) {
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Admin',
      role: 'ADMIN',
      passwordHash: await argon2.hash(password),
      emailVerifiedAt: new Date(),
    },
  });
  return { user, email, password };
}

export async function login(t: TestApp, email: string, password: string) {
  const res = await t.http().post('/api/auth/login').send({ email, password });
  return res;
}

export async function adminToken(t: TestApp) {
  const a = await createAdmin(t.prisma);
  const res = await login(t, a.email, a.password);
  return { token: res.body.accessToken as string, user: a.user };
}

/** Registers, verifies and logs in a regular user. */
export async function registerUser(
  t: TestApp,
  email: string,
  password = 'UserPass123!',
  name = 'Dr Test',
) {
  const reg = await t
    .http()
    .post('/api/auth/register')
    .send({ email, password, name });
  await t
    .http()
    .post('/api/auth/verify-email')
    .send({ token: reg.body.verificationToken });
  const res = await login(t, email, password);
  return {
    token: res.body.accessToken as string,
    id: res.body.user?.id as string,
    email,
    password,
  };
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Valid answers for every required default profile field. */
export function fullProfile(passport = 'P1234567') {
  return {
    personal_information: {
      full_name: 'Jane Doe',
      date_of_birth: '1985-04-12',
      gender: 'Female',
      nationality: 'Indian',
      passport_number: passport,
      passport_expiry: '2032-01-01',
      phone: '+911234567890',
      address: '1 Main Street',
      country: 'India',
    },
    education: {
      medical_school: 'AIIMS',
      degree: 'MD',
      graduation_year: 2010,
      specialty: 'Cardiology',
    },
    professional: {
      license_number: 'L-1',
      license_authority: 'MCI',
      license_expiry: '2030-01-01',
      employer: 'City Hospital',
      years_experience: 12,
    },
  };
}

/** Smallest valid PDF-ish payload (magic bytes are what we check). */
export const PDF_BYTES = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n',
);

export async function uploadFile(t: TestApp, token: string) {
  const res = await t
    .http()
    .post('/api/files')
    .set(auth(token))
    .attach('file', PDF_BYTES, 'certificate.pdf');
  return res.body.id as string;
}

/** Registers a user and completes onboarding at the current (possibly shifted) clock time. */
export async function onboardedUser(
  t: TestApp,
  email: string,
  passport = 'P1234567',
) {
  const u = await registerUser(t, email);
  await t
    .http()
    .put('/api/me/profile')
    .set(auth(u.token))
    .send({ answers: fullProfile(passport) });
  const res = await t
    .http()
    .post('/api/me/onboarding/submit')
    .set(auth(u.token));
  if (res.status !== 200)
    throw new Error(`onboarding failed: ${JSON.stringify(res.body)}`);
  return u;
}

export function certData(
  fileId: string,
  n = 1,
  extra: Record<string, unknown> = {},
) {
  return {
    certification_number: `CERT-${n}`,
    certification_name: 'Board Certification',
    issuing_body: 'Medical Board',
    issue_date: '2026-01-15',
    certificate_file: fileId,
    ...extra,
  };
}

/** Uploads a file and adds a certification for the user at the current clock time. */
export async function addCert(t: TestApp, token: string, n = 1) {
  const fileId = await uploadFile(t, token);
  return t
    .http()
    .post('/api/me/certifications')
    .set(auth(token))
    .send({ data: certData(fileId, n) });
}

export function at(t: TestApp, iso: string) {
  t.clock.set(new Date(iso));
}
