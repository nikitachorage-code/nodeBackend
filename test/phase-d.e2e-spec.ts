import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { JobsService } from '../src/jobs/jobs.service.js';
import { MailService } from '../src/common/mail/mail.service.js';
import {
  adminToken,
  addCert,
  at,
  auth,
  certData,
  createTestApp,
  onboardedUser,
  registerUser,
  resetDb,
  uploadFile,
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
  t.clock.reset();
});
afterEach(() => t.clock.reset());

const dashboard = (token: string) =>
  t.http().get('/api/me/dashboard').set(auth(token));

describe('adding certifications', () => {
  it('requires onboarding (403 ONBOARDING_REQUIRED)', async () => {
    const u = await registerUser(t, 'new@test.dev');
    const fileId = await uploadFile(t, u.token);
    const res = await t
      .http()
      .post('/api/me/certifications')
      .set(auth(u.token))
      .send({ data: certData(fileId) });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ONBOARDING_REQUIRED');
  });

  it('admins cannot create certifications', async () => {
    const a = await adminToken(t);
    const res = await t
      .http()
      .post('/api/me/certifications')
      .set(auth(a.token))
      .send({ data: {} });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('creates a certification: Diplomate immediately, year from server time', async () => {
    at(t, '2026-01-10T00:00:00Z');
    const u = await onboardedUser(t, 'dip@test.dev');
    at(t, '2026-05-01T12:00:00Z');
    const res = await addCert(t, u.token);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('DIPLOMATE');
    expect(res.body.progress).toEqual({ completed: 1, required: 6 });
    expect(res.body.certification).toMatchObject({
      cycleNo: 1,
      cycleYear: 1,
      status: 'ACTIVE',
    });
    expect(res.body.certification.uploadedAt.slice(0, 13)).toBe(
      '2026-05-01T12',
    );
    const me = await t.http().get('/api/me').set(auth(u.token));
    expect(me.body.status).toBe('DIPLOMATE');
  });

  it('rejects upload_date, unknown keys, missing required fields and foreign files', async () => {
    const u = await onboardedUser(t, 'val@test.dev');
    const other = await registerUser(t, 'val2@test.dev');
    const fileId = await uploadFile(t, u.token);
    const post = (data: Record<string, unknown>) =>
      t.http().post('/api/me/certifications').set(auth(u.token)).send({ data });

    const withDate = await post(
      certData(fileId, 1, { upload_date: '2020-01-01' }),
    );
    expect(withDate.status).toBe(400);
    expect(withDate.body.details).toContainEqual({
      field: 'upload_date',
      message: 'This field is read-only',
    });
    const topLevel = await t
      .http()
      .post('/api/me/certifications')
      .set(auth(u.token))
      .send({ data: certData(fileId), uploaded_at: '2020-01-01' });
    expect(topLevel.status).toBe(400);

    expect((await post(certData(fileId, 1, { bogus: 1 }))).status).toBe(400);
    const missing = await post({ certification_number: 'X' });
    expect(missing.status).toBe(400);
    expect(missing.body.details.length).toBeGreaterThanOrEqual(4);

    const theirFile = await uploadFile(t, other.token);
    expect((await post(certData(theirFile))).status).toBe(400);
    expect(await t.prisma.certification.count()).toBe(0);
  });

  it('editing never moves a certification to another year', async () => {
    at(t, '2026-01-01T00:00:00Z');
    const u = await onboardedUser(t, 'edit@test.dev');
    at(t, '2026-03-01T00:00:00Z');
    const created = await addCert(t, u.token);
    const id = created.body.certification.id;
    at(t, '2027-06-01T00:00:00Z');
    const res = await t
      .http()
      .patch(`/api/me/certifications/${id}`)
      .set(auth(u.token))
      .send({ data: { issuing_body: 'New Board', expiry_date: '2030-01-01' } });
    expect(res.status).toBe(200);
    expect(res.body.certification.data.issuing_body).toBe('New Board');
    expect(res.body.certification.uploadedAt).toBe(
      created.body.certification.uploadedAt,
    );
    expect(res.body.certification.cycleYear).toBe(1);

    const readOnly = await t
      .http()
      .patch(`/api/me/certifications/${id}`)
      .set(auth(u.token))
      .send({ data: { upload_date: '2027-01-01' } });
    expect(readOnly.status).toBe(400);
    const clear = await t
      .http()
      .patch(`/api/me/certifications/${id}`)
      .set(auth(u.token))
      .send({ data: { certification_number: null } });
    expect(clear.status).toBe(400);
    const logs = await t.prisma.auditLog.findMany({
      where: { action: 'certification.update' },
    });
    expect(logs).toHaveLength(1);
  });

  it('users cannot see or change each other’s certifications', async () => {
    const a = await onboardedUser(t, 'a@test.dev');
    const b = await onboardedUser(t, 'b@test.dev');
    const created = await addCert(t, a.token);
    const id = created.body.certification.id;
    expect(
      (await t.http().get(`/api/me/certifications/${id}`).set(auth(b.token)))
        .status,
    ).toBe(404);
    expect(
      (
        await t
          .http()
          .patch(`/api/me/certifications/${id}`)
          .set(auth(b.token))
          .send({ data: {} })
      ).status,
    ).toBe(404);
    expect(
      (await t.http().delete(`/api/me/certifications/${id}`).set(auth(b.token)))
        .status,
    ).toBe(404);
    expect(
      (await t.http().get('/api/me/certifications').set(auth(b.token))).body,
    ).toEqual([]);
  });
});

describe('dashboard', () => {
  it('shows tiles, progress and status for the current cycle', async () => {
    at(t, '2026-01-01T00:00:00Z');
    const u = await onboardedUser(t, 'tiles@test.dev');
    at(t, '2026-02-01T00:00:00Z');
    await addCert(t, u.token, 1);
    await addCert(t, u.token, 2);
    at(t, '2027-06-01T00:00:00Z');
    const res = await dashboard(u.token);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DIPLOMATE');
    expect(res.body.progress).toEqual({
      completed: 2,
      required: 6,
      label: '2/6',
    });
    expect(res.body.cycle.currentYear).toBe(2);
    expect(
      res.body.cycle.years.map(
        (y: { calendarYear: number; status: string }) => [
          y.calendarYear,
          y.status,
        ],
      ),
    ).toEqual([
      [2026, 'HAS_CERTIFICATION'],
      [2027, 'CURRENT'],
      [2028, 'UPCOMING'],
    ]);
    expect(res.body.atRisk).toBe(false);
    expect(res.body.warning).toBeNull();
  });

  it('before onboarding it explains what to do', async () => {
    const u = await registerUser(t, 'pre@test.dev');
    const res = await dashboard(u.token);
    expect(res.body.onboarded).toBe(false);
    expect(res.body.warning.code).toBe('ONBOARDING_REQUIRED');
  });

  it('uses the required-per-cycle setting for the denominator', async () => {
    const u = await onboardedUser(t, 'req@test.dev');
    await addCert(t, u.token);
    await t.prisma.setting.create({
      data: { key: 'required_certifications_per_cycle', value: 3 },
    });
    expect((await dashboard(u.token)).body.progress.label).toBe('1/3');
  });

  it('is not available to admins', async () => {
    const a = await adminToken(t);
    expect((await dashboard(a.token)).status).toBe(403);
  });
});

describe('lapse flow (time travel)', () => {
  it('warns in Year 2, lapses at Year 3, and a new upload starts a new cycle', async () => {
    at(t, '2026-01-01T00:00:00Z');
    const u = await onboardedUser(t, 'lapse@test.dev');
    // One upload in cycle 1 so there is something to lose later.
    at(t, '2026-02-01T00:00:00Z');
    const first = await addCert(t, u.token);
    const firstId = first.body.certification.id;

    // Cycle 2 starts 2029-01-01 with no uploads in Years 1 and 2.
    at(t, '2030-06-01T00:00:00Z');
    const risk = await dashboard(u.token);
    expect(risk.body.atRisk).toBe(true);
    expect(risk.body.warning.code).toBe('LAPSE_RISK');
    expect(risk.body.warning.deadline.slice(0, 10)).toBe('2031-01-01');
    expect(risk.body.status).toBe('DIPLOMATE');

    // The daily job emails the warning exactly once.
    const mail = t.app.get(MailService);
    const jobs = t.app.get(JobsService);
    at(t, '2030-12-15T00:00:00Z');
    mail.outbox.length = 0;
    await jobs.runDaily();
    await jobs.runDaily();
    expect(mail.outbox.filter((m) => m.kind === 'LAPSE_WARNING')).toHaveLength(
      1,
    );

    // Just before Year 3: still fine. Just after: lapsed. (Exact-instant edges are covered by the engine unit tests; the clock ticks after set().)
    at(t, '2030-12-31T23:59:59.999Z');
    expect((await dashboard(u.token)).body.status).toBe('DIPLOMATE');
    at(t, '2031-01-01T01:00:00Z');
    const lapsed = await dashboard(u.token);
    expect(lapsed.body.status).toBe('CANDIDATE');
    expect(lapsed.body.cycle).toBeNull();
    expect(lapsed.body.warning.code).toBe('NO_ACTIVE_CYCLE');
    expect(lapsed.body.lapsedCertifications).toBe(1);
    expect(mail.outbox.filter((m) => m.kind === 'LAPSE_NOTICE')).toHaveLength(
      1,
    );

    // Archived, not deleted; read-only.
    const row = await t.prisma.certification.findUniqueOrThrow({
      where: { id: firstId },
    });
    expect(row.status).toBe('LAPSED');
    expect(row.deletedAt).toBeNull();
    const edit = await t
      .http()
      .patch(`/api/me/certifications/${firstId}`)
      .set(auth(u.token))
      .send({ data: { issuing_body: 'x' } });
    expect(edit.status).toBe(409);
    expect(edit.body.code).toBe('CERTIFICATION_LAPSED');
    expect(
      (
        await t
          .http()
          .delete(`/api/me/certifications/${firstId}`)
          .set(auth(u.token))
      ).status,
    ).toBe(409);
    const lapsedList = await t
      .http()
      .get('/api/me/certifications?status=LAPSED')
      .set(auth(u.token));
    expect(lapsedList.body).toHaveLength(1);
    expect(
      (
        await t
          .http()
          .get('/api/me/certifications?status=ACTIVE')
          .set(auth(u.token))
      ).body,
    ).toEqual([]);

    // Repeated syncs do not lapse twice or send more mail.
    await dashboard(u.token);
    await jobs.runDaily();
    expect(
      await t.prisma.auditLog.count({
        where: { action: 'certification.lapse' },
      }),
    ).toBe(1);
    expect(mail.outbox.filter((m) => m.kind === 'LAPSE_NOTICE')).toHaveLength(
      1,
    );

    // A new upload starts a new cycle at the upload time.
    at(t, '2031-06-10T08:00:00Z');
    const again = await addCert(t, u.token, 2);
    expect(again.status).toBe(201);
    expect(again.body.certification.cycleNo).toBe(3);
    expect(again.body.certification.cycleYear).toBe(1);
    const dash = await dashboard(u.token);
    expect(dash.body.status).toBe('DIPLOMATE');
    expect(dash.body.cycle.start.slice(0, 13)).toBe('2031-06-10T08');
    expect(dash.body.progress.completed).toBe(1);
    expect(
      dash.body.pastCycles.map((c: { cycleNo: number }) => c.cycleNo),
    ).toEqual([1]);
  });

  it('a Year 2 upload (even at the last instant) saves the cycle', async () => {
    at(t, '2026-01-01T00:00:00Z');
    const u = await onboardedUser(t, 'save@test.dev');
    at(t, '2027-12-31T23:59:59.000Z');
    const res = await addCert(t, u.token);
    expect(res.body.certification.cycleYear).toBe(2);
    at(t, '2028-06-01T00:00:00Z');
    const dash = await dashboard(u.token);
    expect(dash.body.status).toBe('DIPLOMATE');
    expect(dash.body.cycle.currentYear).toBe(3);
  });

  it('a Year 3 upload after a lapse cannot save the lapsed cycle', async () => {
    at(t, '2026-01-01T00:00:00Z');
    const u = await onboardedUser(t, 'late@test.dev');
    at(t, '2028-02-01T00:00:00Z');
    const res = await addCert(t, u.token);
    expect(res.body.certification.cycleNo).toBe(2);
    expect(res.body.certification.cycleYear).toBe(1);
    const audits = await t.prisma.auditLog.count({
      where: { action: 'certification.lapse' },
    });
    expect(audits).toBe(1);
  });

  it('deleting the only Year 1-2 upload during Year 3 lapses immediately', async () => {
    at(t, '2026-01-01T00:00:00Z');
    const u = await onboardedUser(t, 'del3@test.dev');
    at(t, '2026-05-01T00:00:00Z');
    const early = await addCert(t, u.token, 1);
    at(t, '2028-03-01T00:00:00Z');
    await addCert(t, u.token, 2);
    expect((await dashboard(u.token)).body.progress.completed).toBe(2);
    at(t, '2028-03-02T00:00:00Z');
    const del = await t
      .http()
      .delete(`/api/me/certifications/${early.body.certification.id}`)
      .set(auth(u.token));
    expect(del.status).toBe(200);
    expect(del.body).toMatchObject({
      deleted: true,
      lapsed: true,
      status: 'CANDIDATE',
    });
    const certs = await t.prisma.certification.findMany({
      where: { userId: u.id, deletedAt: null },
    });
    expect(certs.map((c) => c.status)).toEqual(['LAPSED']);
  });

  it('deleting a certification from a completed cycle does not lapse anything', async () => {
    at(t, '2026-01-01T00:00:00Z');
    const u = await onboardedUser(t, 'past@test.dev');
    at(t, '2026-05-01T00:00:00Z');
    const old = await addCert(t, u.token, 1);
    at(t, '2029-02-01T00:00:00Z'); // cycle 2, Year 1
    const cur = await addCert(t, u.token, 2);
    expect(cur.body.certification.cycleNo).toBe(2);
    const del = await t
      .http()
      .delete(`/api/me/certifications/${old.body.certification.id}`)
      .set(auth(u.token));
    expect(del.body).toMatchObject({ lapsed: false, status: 'DIPLOMATE' });
    expect(del.body.progress.completed).toBe(1);
  });

  it('deleting the last certification makes the user a Candidate without ending the cycle', async () => {
    at(t, '2026-01-01T00:00:00Z');
    const u = await onboardedUser(t, 'last@test.dev');
    at(t, '2026-05-01T00:00:00Z');
    const c = await addCert(t, u.token);
    const del = await t
      .http()
      .delete(`/api/me/certifications/${c.body.certification.id}`)
      .set(auth(u.token));
    expect(del.body).toMatchObject({ lapsed: false, status: 'CANDIDATE' });
    const dash = await dashboard(u.token);
    expect(dash.body.cycle.cycleNo).toBe(1);
    expect(dash.body.progress.completed).toBe(0);
    expect(
      await t.prisma.auditLog.count({
        where: { action: 'certification.delete' },
      }),
    ).toBe(1);
  });

  it('the daily job catches up after years with no run', async () => {
    at(t, '2026-01-01T00:00:00Z');
    const u = await onboardedUser(t, 'catchup@test.dev');
    at(t, '2026-05-01T00:00:00Z');
    await addCert(t, u.token);
    at(t, '2040-01-01T00:00:00Z');
    const result = await t.app.get(JobsService).runDaily();
    expect(result.lapsedUsers).toBe(1);
    const row = await t.prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(row.status).toBe('CANDIDATE');
    expect(row.cycleStartDate).toBeNull();
    expect(row.progressCount).toBe(0);
  });

  it('keeps cached columns rebuildable: wiping them and re-syncing restores them', async () => {
    at(t, '2026-01-01T00:00:00Z');
    const u = await onboardedUser(t, 'rebuild@test.dev');
    at(t, '2026-05-01T00:00:00Z');
    await addCert(t, u.token, 7);
    const good = await t.prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    await t.prisma.user.update({
      where: { id: u.id },
      data: {
        status: 'CANDIDATE',
        progressCount: 0,
        atRisk: true,
        lastCertNo: null,
      },
    });
    await dashboard(u.token);
    const rebuilt = await t.prisma.user.findUniqueOrThrow({
      where: { id: u.id },
    });
    expect(rebuilt).toMatchObject({
      status: good.status,
      progressCount: good.progressCount,
      atRisk: good.atRisk,
      lastCertNo: 'CERT-7',
    });
  });
});
