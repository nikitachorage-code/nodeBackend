import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  adminToken,
  auth,
  createTestApp,
  fullProfile,
  login,
  PDF_BYTES,
  registerUser,
  resetDb,
  type TestApp,
} from './helpers/app.js';

let t: TestApp;

beforeAll(async () => {
  t = await createTestApp();
});
afterAll(async () => {
  await t.app.close();
});
beforeEach(async () => {
  await resetDb(t.prisma);
});

describe('error shape', () => {
  it('uses one shape for 401, 404 and validation errors', async () => {
    const unauth = await t.http().get('/api/me');
    expect(unauth.status).toBe(401);
    expect(unauth.body).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
      path: '/api/me',
    });
    expect(typeof unauth.body.timestamp).toBe('string');

    const missing = await t.http().get('/api/nope');
    expect(missing.body).toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });

    const invalid = await t
      .http()
      .post('/api/auth/register')
      .send({ email: 'x' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.code).toBe('VALIDATION_FAILED');
    expect(Array.isArray(invalid.body.details)).toBe(true);
  });
});

describe('auth', () => {
  it('register -> cannot login unverified -> verify -> login -> /me', async () => {
    const reg = await t
      .http()
      .post('/api/auth/register')
      .send({ email: 'A@Test.dev', password: 'Password123', name: 'Ann' });
    expect(reg.status).toBe(201);
    expect(reg.body.verificationToken).toBeDefined();

    const early = await login(t, 'a@test.dev', 'Password123');
    expect(early.status).toBe(403);
    expect(early.body.code).toBe('EMAIL_NOT_VERIFIED');

    const bad = await t
      .http()
      .post('/api/auth/verify-email')
      .send({ token: 'nope' });
    expect(bad.body.code).toBe('INVALID_TOKEN');
    const ok = await t
      .http()
      .post('/api/auth/verify-email')
      .send({ token: reg.body.verificationToken });
    expect(ok.status).toBe(200);
    // tokens are single use
    const again = await t
      .http()
      .post('/api/auth/verify-email')
      .send({ token: reg.body.verificationToken });
    expect(again.status).toBe(400);

    const res = await login(t, 'a@test.dev', 'Password123');
    expect(res.status).toBe(200);
    const me = await t.http().get('/api/me').set(auth(res.body.accessToken));
    expect(me.body).toMatchObject({
      email: 'a@test.dev',
      role: 'USER',
      status: 'CANDIDATE',
      onboarded: false,
    });
  });

  it('rejects duplicate emails and wrong passwords', async () => {
    await registerUser(t, 'dup@test.dev');
    const dup = await t
      .http()
      .post('/api/auth/register')
      .send({ email: 'dup@test.dev', password: 'Password123', name: 'X' });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe('EMAIL_TAKEN');
    const wrong = await login(t, 'dup@test.dev', 'wrong-password');
    expect(wrong.status).toBe(401);
    expect(wrong.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('forgot/reset password flow', async () => {
    await registerUser(t, 'r@test.dev', 'OldPassword1');
    const f = await t
      .http()
      .post('/api/auth/forgot-password')
      .send({ email: 'r@test.dev' });
    expect(f.body.resetToken).toBeDefined();
    const unknown = await t
      .http()
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@test.dev' });
    expect(unknown.status).toBe(200);
    expect(unknown.body.resetToken).toBeUndefined();

    const reset = await t
      .http()
      .post('/api/auth/reset-password')
      .send({ token: f.body.resetToken, password: 'NewPassword1' });
    expect(reset.status).toBe(200);
    expect((await login(t, 'r@test.dev', 'OldPassword1')).status).toBe(401);
    expect((await login(t, 'r@test.dev', 'NewPassword1')).status).toBe(200);
  });

  it('change-password requires the current password', async () => {
    const u = await registerUser(t, 'c@test.dev', 'OldPassword1');
    const bad = await t
      .http()
      .post('/api/auth/change-password')
      .set(auth(u.token))
      .send({ currentPassword: 'nope-nope', newPassword: 'NewPassword1' });
    expect(bad.body.code).toBe('INVALID_CURRENT_PASSWORD');
    const ok = await t
      .http()
      .post('/api/auth/change-password')
      .set(auth(u.token))
      .send({ currentPassword: 'OldPassword1', newPassword: 'NewPassword1' });
    expect(ok.status).toBe(200);
  });

  it('a soft-deleted user loses access immediately', async () => {
    const u = await registerUser(t, 'gone@test.dev');
    await t.prisma.user.update({
      where: { id: u.id },
      data: { deletedAt: new Date() },
    });
    expect((await t.http().get('/api/me').set(auth(u.token))).status).toBe(401);
  });
});

describe('roles', () => {
  it('users cannot reach admin routes; admins can', async () => {
    const u = await registerUser(t, 'u@test.dev');
    const denied = await t.http().get('/api/admin/steps').set(auth(u.token));
    expect(denied.status).toBe(403);
    expect(denied.body.code).toBe('FORBIDDEN');
    const a = await adminToken(t);
    expect(
      (await t.http().get('/api/admin/steps').set(auth(a.token))).status,
    ).toBe(200);
  });
});

describe('forms and profile', () => {
  it('serves the default steps, including the certification step', async () => {
    const u = await registerUser(t, 'f@test.dev');
    const res = await t.http().get('/api/forms').set(auth(u.token));
    expect(res.status).toBe(200);
    expect(res.body.map((s: { key: string }) => s.key)).toEqual([
      'personal_information',
      'education',
      'professional',
      'certification',
    ]);
    const cert = res.body[3];
    const keys = cert.fields.map((f: { key: string }) => f.key);
    expect(keys).toContain('certificate_file');
    expect(
      cert.fields.find((f: { key: string }) => f.key === 'upload_date')
        .readOnly,
    ).toBe(true);
  });

  it('validates answers against field definitions', async () => {
    const u = await registerUser(t, 'v@test.dev');
    const res = await t
      .http()
      .put('/api/me/profile')
      .set(auth(u.token))
      .send({
        answers: {
          personal_information: {
            full_name: 123,
            gender: 'Robot',
            date_of_birth: '1985-13-40',
            made_up: 'x',
          },
          education: { graduation_year: 'abc' },
          nope: { a: 1 },
        },
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    const fields = res.body.details
      .map((d: { field: string }) => d.field)
      .sort();
    expect(fields).toEqual(
      [
        'education.graduation_year',
        'nope',
        'personal_information.date_of_birth',
        'personal_information.full_name',
        'personal_information.gender',
        'personal_information.made_up',
      ].sort(),
    );
  });

  it('saves drafts, then rejects incomplete onboarding with the missing fields', async () => {
    const u = await registerUser(t, 'd@test.dev');
    const draft = await t
      .http()
      .put('/api/me/profile')
      .set(auth(u.token))
      .send({ answers: { personal_information: { full_name: 'Draft Doc' } } });
    expect(draft.status).toBe(200);
    expect(draft.body.profileComplete).toBe(false);

    const submit = await t
      .http()
      .post('/api/me/onboarding/submit')
      .set(auth(u.token));
    expect(submit.status).toBe(400);
    expect(submit.body.code).toBe('ONBOARDING_INCOMPLETE');
    expect(submit.body.details.missing.length).toBeGreaterThan(5);
    const row = await t.prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(row.onboardedAt).toBeNull();
    expect(row.cycleStartDate).toBeNull();
  });

  it('onboarding submit starts the first cycle at the clock time', async () => {
    const u = await registerUser(t, 'o@test.dev');
    t.clock.set(new Date('2026-03-01T09:00:00Z'));
    try {
      await t
        .http()
        .put('/api/me/profile')
        .set(auth(u.token))
        .send({ answers: fullProfile() });
      const submit = await t
        .http()
        .post('/api/me/onboarding/submit')
        .set(auth(u.token));
      expect(submit.status).toBe(200);
      expect(submit.body.onboarded).toBe(true);
      const row = await t.prisma.user.findUniqueOrThrow({
        where: { id: u.id },
      });
      expect(row.cycleNo).toBe(1);
      expect(row.cycleStartDate!.toISOString().slice(0, 13)).toBe(
        '2026-03-01T09',
      );
      expect(row.passportNo).toBe('P1234567');

      const again = await t
        .http()
        .post('/api/me/onboarding/submit')
        .set(auth(u.token));
      expect(again.status).toBe(409);
      expect(again.body.code).toBe('ALREADY_ONBOARDED');
    } finally {
      t.clock.reset();
    }
  });

  it('after onboarding, required fields cannot be blanked', async () => {
    const u = await registerUser(t, 'b@test.dev');
    await t
      .http()
      .put('/api/me/profile')
      .set(auth(u.token))
      .send({ answers: fullProfile() });
    await t.http().post('/api/me/onboarding/submit').set(auth(u.token));
    const blank = await t
      .http()
      .put('/api/me/profile')
      .set(auth(u.token))
      .send({ answers: { personal_information: { phone: null } } });
    expect(blank.status).toBe(400);
    const optional = await t
      .http()
      .put('/api/me/profile')
      .set(auth(u.token))
      .send({ answers: { education: { sub_specialty: 'Electrophysiology' } } });
    expect(optional.status).toBe(200);
  });
});

describe('form configuration (admin)', () => {
  it('creates steps and fields; new fields show up for users', async () => {
    const a = await adminToken(t);
    const u = await registerUser(t, 'cfg@test.dev');
    const step = await t
      .http()
      .post('/api/admin/steps')
      .set(auth(a.token))
      .send({ title: 'Extra Info' });
    expect(step.status).toBe(201);
    expect(step.body.key).toBe('extra_info');
    const field = await t
      .http()
      .post(`/api/admin/steps/${step.body.id}/fields`)
      .set(auth(a.token))
      .send({
        label: 'Favourite colour',
        type: 'DROPDOWN',
        options: ['Red', 'Blue'],
      });
    expect(field.status).toBe(201);
    expect(field.body.key).toBe('favourite_colour');

    const forms = await t.http().get('/api/forms').set(auth(u.token));
    expect(forms.body.map((s: { key: string }) => s.key)).toContain(
      'extra_info',
    );

    const noOptions = await t
      .http()
      .post(`/api/admin/steps/${step.body.id}/fields`)
      .set(auth(a.token))
      .send({ label: 'Broken', type: 'DROPDOWN' });
    expect(noOptions.body.code).toBe('OPTIONS_REQUIRED');
  });

  it('blocks type changes once data exists (FIELD_HAS_DATA) but allows them before', async () => {
    const a = await adminToken(t);
    const u = await registerUser(t, 'data@test.dev');
    await t
      .http()
      .put('/api/me/profile')
      .set(auth(u.token))
      .send({ answers: { personal_information: { phone: '555' } } });
    const steps = await t.http().get('/api/admin/steps').set(auth(a.token));
    const phone = steps.body[0].fields.find(
      (f: { key: string }) => f.key === 'phone',
    );
    const blocked = await t
      .http()
      .patch(`/api/admin/fields/${phone.id}`)
      .set(auth(a.token))
      .send({ type: 'NUMBER' });
    expect(blocked.status).toBe(409);
    expect(blocked.body.code).toBe('FIELD_HAS_DATA');

    const sub = steps.body[1].fields.find(
      (f: { key: string }) => f.key === 'sub_specialty',
    );
    const fine = await t
      .http()
      .patch(`/api/admin/fields/${sub.id}`)
      .set(auth(a.token))
      .send({ type: 'LONG_TEXT', label: 'Sub-specialty (details)' });
    expect(fine.status).toBe(200);
    expect(fine.body.type).toBe('LONG_TEXT');
  });

  it('archiving a field keeps its data and hides it from users', async () => {
    const a = await adminToken(t);
    const u = await registerUser(t, 'arch@test.dev');
    await t
      .http()
      .put('/api/me/profile')
      .set(auth(u.token))
      .send({ answers: { personal_information: { phone: '555' } } });
    const steps = await t.http().get('/api/admin/steps').set(auth(a.token));
    const phone = steps.body[0].fields.find(
      (f: { key: string }) => f.key === 'phone',
    );
    const del = await t
      .http()
      .delete(`/api/admin/fields/${phone.id}`)
      .set(auth(a.token));
    expect(del.status).toBe(200);
    expect(del.body.archived).toBe(true);
    expect(
      await t.prisma.profileAnswer.count({ where: { fieldId: phone.id } }),
    ).toBe(1);

    const profile = await t.http().get('/api/me/profile').set(auth(u.token));
    const keys = profile.body.steps[0].fields.map(
      (f: { key: string }) => f.key,
    );
    expect(keys).not.toContain('phone');
    // archived field no longer blocks onboarding
    expect(
      profile.body.missing.map((m: { field: string }) => m.field),
    ).not.toContain('phone');
  });

  it('protects the certification step and its system fields', async () => {
    const a = await adminToken(t);
    const steps = await t.http().get('/api/admin/steps').set(auth(a.token));
    const cert = steps.body.find(
      (s: { key: string }) => s.key === 'certification',
    );
    const disable = await t
      .http()
      .patch(`/api/admin/steps/${cert.id}`)
      .set(auth(a.token))
      .send({ enabled: false });
    expect(disable.status).toBe(409);
    expect(disable.body.code).toBe('SYSTEM_STEP_PROTECTED');

    const file = cert.fields.find(
      (f: { key: string }) => f.key === 'certificate_file',
    );
    const remove = await t
      .http()
      .delete(`/api/admin/fields/${file.id}`)
      .set(auth(a.token));
    expect(remove.status).toBe(409);
    expect(remove.body.code).toBe('SYSTEM_FIELD_PROTECTED');
    const hide = await t
      .http()
      .patch(`/api/admin/fields/${file.id}`)
      .set(auth(a.token))
      .send({ visible: false });
    expect(hide.body.code).toBe('SYSTEM_FIELD_PROTECTED');
  });

  it('audits configuration changes', async () => {
    const a = await adminToken(t);
    await t
      .http()
      .post('/api/admin/steps')
      .set(auth(a.token))
      .send({ title: 'Audited' });
    const logs = await t.prisma.auditLog.findMany({
      where: { action: 'step.create' },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].actorId).toBe(a.user.id);
  });
});

describe('files', () => {
  const upload = (token: string, buf: Buffer, name = 'cert.pdf') =>
    t.http().post('/api/files').set(auth(token)).attach('file', buf, name);

  it('accepts a PDF and stores it under a random name', async () => {
    const u = await registerUser(t, 'file@test.dev');
    const res = await upload(u.token, PDF_BYTES);
    expect(res.status).toBe(201);
    expect(res.body.mime).toBe('application/pdf');
    const row = await t.prisma.storedFile.findUniqueOrThrow({
      where: { id: res.body.id },
    });
    expect(row.storedName).not.toContain('cert');
    expect(row.storedName.endsWith('.pdf')).toBe(true);
  });

  it('rejects files by magic bytes, ignoring name and claimed type', async () => {
    const u = await registerUser(t, 'evil@test.dev');
    const res = await t
      .http()
      .post('/api/files')
      .set(auth(u.token))
      .attach('file', Buffer.from('<script>alert(1)</script>'), {
        filename: 'cert.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UNSUPPORTED_FILE_TYPE');
    const none = await t.http().post('/api/files').set(auth(u.token));
    expect(none.body.code).toBe('FILE_REQUIRED');
  });

  it('only the owner or an admin can download', async () => {
    const owner = await registerUser(t, 'own@test.dev');
    const other = await registerUser(t, 'other@test.dev');
    const a = await adminToken(t);
    const up = await upload(owner.token, PDF_BYTES);
    const path = `/api/files/${up.body.id}`;

    const ok = await t.http().get(path).set(auth(owner.token));
    expect(ok.status).toBe(200);
    expect(ok.headers['content-type']).toContain('application/pdf');
    expect(ok.headers['content-disposition']).toContain('attachment');
    expect((await t.http().get(path).set(auth(a.token))).status).toBe(200);
    expect((await t.http().get(path).set(auth(other.token))).status).toBe(404);
    expect((await t.http().get(path)).status).toBe(401);
  });

  it('file fields accept only the callers own uploads', async () => {
    const owner = await registerUser(t, 'fo@test.dev');
    const other = await registerUser(t, 'fx@test.dev');
    const a = await adminToken(t);
    const up = await upload(owner.token, PDF_BYTES);
    const step = await t
      .http()
      .post('/api/admin/steps')
      .set(auth(a.token))
      .send({ title: 'Docs' });
    await t
      .http()
      .post(`/api/admin/steps/${step.body.id}/fields`)
      .set(auth(a.token))
      .send({ label: 'CV', type: 'FILE' });
    const theirs = await t
      .http()
      .put('/api/me/profile')
      .set(auth(other.token))
      .send({ answers: { docs: { cv: up.body.id } } });
    expect(theirs.status).toBe(400);
    const mine = await t
      .http()
      .put('/api/me/profile')
      .set(auth(owner.token))
      .send({ answers: { docs: { cv: up.body.id } } });
    expect(mine.status).toBe(200);
  });
});
