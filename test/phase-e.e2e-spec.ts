import { ConfigService } from '@nestjs/config';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  addCert,
  certData,
  uploadFile,
  adminToken,
  at,
  auth,
  login,
  onboardedUser,
  registerUser,
  resetDb,
  type TestApp,
  createTestApp,
} from './helpers/app.js';

let t: TestApp;
let admin: string;

beforeAll(async () => {
  t = await createTestApp();
});
afterAll(async () => {
  await t.app.close();
});
beforeEach(async () => {
  await resetDb(t.prisma);
  t.clock.reset();
  admin = (await adminToken(t)).token;
});
afterEach(() => {
  vi.restoreAllMocks();
  t.clock.reset();
});

const get = (path: string) => t.http().get(path).set(auth(admin));

async function rename(id: string, name: string) {
  await t.prisma.user.update({ where: { id }, data: { name } });
}

/** alice: diplomate (CERT-ALPHA-1), bob: onboarded candidate, carol: not onboarded. */
async function seedPeople() {
  const alice = await onboardedUser(t, 'alice@test.dev', 'PA111');
  await rename(alice.id, 'Alice Adams');
  const fileId = await uploadFile(t, alice.token);
  const cert = await t
    .http()
    .post('/api/me/certifications')
    .set(auth(alice.token))
    .send({
      data: certData(fileId, 1, { certification_number: 'CERT-ALPHA-1' }),
    });
  const bob = await onboardedUser(t, 'bob@test.dev', 'PB222');
  await rename(bob.id, 'Bob Brown');
  const carol = await registerUser(t, 'carol@test.dev');
  await rename(carol.id, 'Carol Clark');
  return { alice, bob, carol };
}

describe('access', () => {
  it('users cannot reach any admin users, settings, audit or clock route', async () => {
    const u = await registerUser(t, 'plain@test.dev');
    const paths = [
      ['get', '/api/admin/users'],
      ['get', '/api/admin/users/export.csv'],
      ['get', '/api/admin/stats'],
      ['get', '/api/admin/settings'],
      ['get', '/api/admin/audit-logs'],
      ['get', '/api/admin/clock'],
    ] as const;
    for (const [, p] of paths) {
      const res = await t.http().get(p).set(auth(u.token));
      expect(res.status, p).toBe(403);
    }
    const post = await t
      .http()
      .post('/api/admin/admins')
      .set(auth(u.token))
      .send({ email: 'x@test.dev', name: 'X', password: 'Password123' });
    expect(post.status).toBe(403);
    expect((await t.http().get('/api/admin/users')).status).toBe(401);
  });
});

describe('users table', () => {
  it('lists users only (not admins), with progress, status and meta', async () => {
    await seedPeople();
    const res = await get('/api/admin/users?sort=name&order=asc');
    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({
      page: 1,
      pageSize: 20,
      total: 3,
      totalPages: 1,
    });
    expect(res.body.data.map((r: { name: string }) => r.name)).toEqual([
      'Alice Adams',
      'Bob Brown',
      'Carol Clark',
    ]);
    const alice = res.body.data[0];
    expect(alice).toMatchObject({
      email: 'alice@test.dev',
      passportNo: 'PA111',
      status: 'DIPLOMATE',
      progress: { completed: 1, required: 6, label: '1/6' },
      onboarded: true,
    });
    expect(res.body.data[2].onboarded).toBe(false);
    expect(res.body.columns.base.map((c: { key: string }) => c.key)).toContain(
      'passportNo',
    );
  });

  it('filters by status', async () => {
    await seedPeople();
    const dip = await get('/api/admin/users?status=DIPLOMATE');
    expect(dip.body.data.map((r: { email: string }) => r.email)).toEqual([
      'alice@test.dev',
    ]);
    const cand = await get(
      '/api/admin/users?status=CANDIDATE&sort=name&order=asc',
    );
    expect(cand.body.meta.total).toBe(2);
    expect((await get('/api/admin/users?status=ALL')).body.meta.total).toBe(3);
    expect((await get('/api/admin/users?status=NOPE')).status).toBe(400);
  });

  it('searches name, email, passport and certification number, case-insensitively', async () => {
    await seedPeople();
    const emails = async (q: string) =>
      (
        await get(`/api/admin/users?search=${encodeURIComponent(q)}`)
      ).body.data.map((r: { email: string }) => r.email);
    expect(await emails('alice adams')).toEqual(['alice@test.dev']);
    expect(await emails('BOB@TEST')).toEqual(['bob@test.dev']);
    expect(await emails('pb222')).toEqual(['bob@test.dev']);
    expect(await emails('cert-alpha')).toEqual(['alice@test.dev']);
    expect(await emails('nobody-matches')).toEqual([]);
    // wildcard characters are treated literally
    expect(await emails('%')).toEqual([]);
    expect(await emails('_')).toEqual([]);
    expect(await emails('a_ice')).toEqual([]);
  });

  it('sorts and paginates', async () => {
    await seedPeople();
    const page1 = await get(
      '/api/admin/users?sort=name&order=desc&pageSize=2&page=1',
    );
    expect(page1.body.data.map((r: { name: string }) => r.name)).toEqual([
      'Carol Clark',
      'Bob Brown',
    ]);
    expect(page1.body.meta).toMatchObject({ total: 3, totalPages: 2 });
    const page2 = await get(
      '/api/admin/users?sort=name&order=desc&pageSize=2&page=2',
    );
    expect(page2.body.data.map((r: { name: string }) => r.name)).toEqual([
      'Alice Adams',
    ]);

    const byProgress = await get('/api/admin/users?sort=progress&order=desc');
    expect(byProgress.body.data[0].email).toBe('alice@test.dev');
    const byPassport = await get('/api/admin/users?sort=passport&order=asc');
    expect(byPassport.body.data[0].passportNo).toBe('PA111');
    expect((await get('/api/admin/users?pageSize=1000')).status).toBe(400);
    expect((await get('/api/admin/users?sort=password')).status).toBe(400);
  });

  it('adds columns for configured fields and rejects unknown ones', async () => {
    const { alice } = await seedPeople();
    const res = await get(
      '/api/admin/users?fields=personal_information.phone,education.specialty&sort=name&order=asc',
    );
    expect(res.status).toBe(200);
    expect(
      res.body.columns.selected.map((c: { key: string }) => c.key),
    ).toEqual(['personal_information.phone', 'education.specialty']);
    expect(res.body.columns.available.length).toBeGreaterThan(15);
    expect(res.body.data[0].answers).toEqual({
      'personal_information.phone': '+911234567890',
      'education.specialty': 'Cardiology',
    });
    // carol never filled anything in
    expect(res.body.data[2].answers['personal_information.phone']).toBeNull();

    const bad = await get('/api/admin/users?fields=personal_information.nope');
    expect(bad.status).toBe(400);
    expect(bad.body.code).toBe('UNKNOWN_COLUMN');

    // archived fields disappear from the available columns
    const steps = await get('/api/admin/steps');
    const phone = steps.body[0].fields.find(
      (f: { key: string }) => f.key === 'phone',
    );
    await t.http().delete(`/api/admin/fields/${phone.id}`).set(auth(admin));
    const after = await get('/api/admin/users');
    expect(
      after.body.columns.available.map((c: { key: string }) => c.key),
    ).not.toContain('personal_information.phone');
    expect(alice.id).toBeDefined();
  });

  it('excludes soft-deleted users', async () => {
    const { bob } = await seedPeople();
    await t.http().delete(`/api/admin/users/${bob.id}`).set(auth(admin));
    const res = await get('/api/admin/users');
    expect(res.body.data.map((r: { email: string }) => r.email)).not.toContain(
      'bob@test.dev',
    );
    expect(res.body.meta.total).toBe(2);
  });

  it('filters at-risk users (Year 2 with no uploads yet)', async () => {
    at(t, '2026-01-01T00:00:00Z');
    const risky = await onboardedUser(t, 'risky@test.dev');
    at(t, '2027-06-01T00:00:00Z');
    await t.app
      .get((await import('../src/jobs/jobs.service.js')).JobsService)
      .runDaily();
    const res = await get('/api/admin/users?atRisk=true');
    expect(res.body.data.map((r: { email: string }) => r.email)).toEqual([
      'risky@test.dev',
    ]);
    expect(res.body.data[0].atRisk).toBe(true);
    expect((await get('/api/admin/stats')).body.atRisk).toBe(1);
    expect(risky.id).toBeDefined();
  });
});

describe('CSV export', () => {
  it('exports with the same filters and escapes formula injection', async () => {
    const { alice, bob } = await seedPeople();
    await rename(alice.id, '=HYPERLINK("http://evil","x")');
    await rename(bob.id, '@SUM(1,2), "quoted"');
    const res = await get('/api/admin/users/export.csv?sort=email&order=asc');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    const text = res.text.replace(/^﻿/, '');
    const lines = text.trim().split('\r\n');
    expect(lines[0]).toBe(
      'Name,Email,Passport no.,Status,Certifications,At risk,Registered',
    );
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain(`"'=HYPERLINK(""http://evil"",""x"")"`);
    expect(lines[2]).toContain(`"'@SUM(1,2), ""quoted"""`);
    expect(lines[1]).toContain(',DIPLOMATE,1/6,');

    const filtered = await get('/api/admin/users/export.csv?status=DIPLOMATE');
    expect(filtered.text.trim().split('\r\n')).toHaveLength(2);

    const withCols = await get(
      '/api/admin/users/export.csv?status=DIPLOMATE&fields=education.specialty',
    );
    const [header, row] = withCols.text.replace(/^﻿/, '').trim().split('\r\n');
    expect(header.endsWith('Education: Specialty')).toBe(true);
    expect(row.endsWith('Cardiology')).toBe(true);
  });

  it('escapes formulas stored in dynamic profile answers', async () => {
    const { alice } = await seedPeople();
    const res = await t
      .http()
      .patch(`/api/admin/users/${alice.id}`)
      .set(auth(admin))
      .send({ answers: { education: { specialty: '=cmd|calc' } } });
    expect(res.status).toBe(200);
    const csv = await get(
      '/api/admin/users/export.csv?status=DIPLOMATE&fields=education.specialty',
    );
    expect(csv.text).toContain(",'=cmd|calc");
  });
});

describe('stats', () => {
  it('counts candidates, diplomates and onboarding', async () => {
    await seedPeople();
    const res = await get('/api/admin/stats');
    expect(res.body).toMatchObject({
      totalUsers: 3,
      candidates: 2,
      diplomates: 1,
      onboarded: 2,
      notOnboarded: 1,
      atRisk: 0,
      lapsedCandidates: 0,
    });
  });
});

describe('user detail and certification history', () => {
  it('returns profile, dashboard and syncs stale cached values', async () => {
    const { alice } = await seedPeople();
    await t.prisma.user.update({
      where: { id: alice.id },
      data: { status: 'CANDIDATE', progressCount: 0 },
    });
    const res = await get(`/api/admin/users/${alice.id}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: 'alice@test.dev',
      status: 'DIPLOMATE',
      onboarded: true,
    });
    expect(res.body.dashboard.progress.label).toBe('1/6');
    expect(res.body.profile.profileComplete).toBe(true);
    expect(res.body.profile.steps.length).toBe(3);
  });

  it('404s for admins, missing users and invalid ids', async () => {
    const a = await t.prisma.user.findFirstOrThrow({
      where: { role: 'ADMIN' },
    });
    expect((await get(`/api/admin/users/${a.id}`)).status).toBe(404);
    expect(
      (await get('/api/admin/users/6f1b6e1e-8c3a-4f5d-9d0e-0a1b2c3d4e5f'))
        .status,
    ).toBe(404);
    expect((await get('/api/admin/users/not-a-uuid')).status).toBe(400);
  });

  it('explains how the numbers were calculated, including lapsed and deleted history', async () => {
    at(t, '2026-01-01T00:00:00Z');
    const u = await onboardedUser(t, 'hist@test.dev');
    at(t, '2026-03-01T00:00:00Z');
    const first = await addCert(t, u.token, 1);
    const second = await addCert(t, u.token, 2);
    await t
      .http()
      .delete(`/api/me/certifications/${second.body.certification.id}`)
      .set(auth(u.token));

    at(t, '2027-01-01T00:00:00Z');
    let res = await get(`/api/admin/users/${u.id}/certifications`);
    expect(res.body.explanation.summary).toBe(
      'Diplomate in cycle 1, 1/6 certifications this cycle.',
    );
    expect(res.body.explanation.lines.join(' ')).toContain(
      'Uploads this cycle: Year 1 1, Year 2 0, Year 3 0.',
    );
    expect(res.body.certifications).toHaveLength(2);
    expect(
      res.body.certifications.find((c: { deleted: boolean }) => c.deleted),
    ).toBeDefined();

    at(t, '2031-06-01T00:00:00Z');
    res = await get(`/api/admin/users/${u.id}/certifications`);
    expect(res.body.explanation.summary).toBe(
      'Candidate with no active cycle.',
    );
    const text = res.body.explanation.lines.join(' ');
    expect(text).toMatch(/Cycle 2 lapsed on 2031-01-0\d/);
    expect(text).toContain('1 certification was archived');
    expect(text).toContain('The next certification upload starts a new cycle');
    const lapsed = res.body.certifications.find(
      (c: { id: string }) => c.id === first.body.certification.id,
    );
    expect(lapsed).toMatchObject({ status: 'LAPSED', readOnly: true });
  });
});

describe('editing and deleting users', () => {
  it('edits name, email and profile answers, with audit entries', async () => {
    const { alice } = await seedPeople();
    const res = await t
      .http()
      .patch(`/api/admin/users/${alice.id}`)
      .set(auth(admin))
      .send({
        name: 'Alice Updated',
        email: 'Alice.New@Test.dev',
        answers: {
          personal_information: { phone: '+44 20 7946 0000' },
          education: { sub_specialty: 'EP' },
        },
      });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      name: 'Alice Updated',
      email: 'alice.new@test.dev',
    });
    const phone = res.body.profile.steps[0].fields.find(
      (f: { key: string }) => f.key === 'phone',
    );
    expect(phone.value).toBe('+44 20 7946 0000');

    const logs = await t.prisma.auditLog.findMany({
      where: { entityId: alice.id },
      orderBy: { createdAt: 'asc' },
    });
    const update = logs.find((l) => l.action === 'user.update')!;
    expect(update.before).toEqual({
      name: 'Alice Adams',
      email: 'alice@test.dev',
    });
    expect(update.after).toEqual({
      name: 'Alice Updated',
      email: 'alice.new@test.dev',
    });
    expect(update.actorId).not.toBeNull();
    const profileLog = logs.find((l) => l.action === 'user.profile.update')!;
    expect((profileLog.before as Record<string, unknown>).phone).toBe(
      '+911234567890',
    );
    expect((profileLog.after as Record<string, unknown>).phone).toBe(
      '+44 20 7946 0000',
    );
  });

  it('validates admin edits and rejects duplicate emails', async () => {
    const { alice } = await seedPeople();
    const dup = await t
      .http()
      .patch(`/api/admin/users/${alice.id}`)
      .set(auth(admin))
      .send({ email: 'bob@test.dev' });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe('EMAIL_TAKEN');
    const bad = await t
      .http()
      .patch(`/api/admin/users/${alice.id}`)
      .set(auth(admin))
      .send({ answers: { personal_information: { gender: 'Robot' } } });
    expect(bad.status).toBe(400);
    const blank = await t
      .http()
      .patch(`/api/admin/users/${alice.id}`)
      .set(auth(admin))
      .send({ answers: { personal_information: { phone: null } } });
    expect(blank.status).toBe(400);
  });

  it('admins cannot edit certifications through the user endpoint', async () => {
    const { alice } = await seedPeople();
    const res = await t
      .http()
      .patch(`/api/admin/users/${alice.id}`)
      .set(auth(admin))
      .send({ certifications: [{ id: 'x' }] });
    expect(res.status).toBe(400);
    const cert = await t.prisma.certification.findFirstOrThrow({
      where: { userId: alice.id },
    });
    for (const method of ['post', 'patch', 'delete'] as const) {
      const r = await t
        .http()
        [method](`/api/admin/users/${alice.id}/certifications/${cert.id}`)
        .set(auth(admin))
        .send({});
      expect(r.status, method).toBe(404);
    }
    expect(
      (
        await t
          .http()
          .post('/api/me/certifications')
          .set(auth(admin))
          .send({ data: {} })
      ).status,
    ).toBe(403);
  });

  it('soft-deletes: access ends immediately, data is kept, action is audited', async () => {
    const { alice } = await seedPeople();
    const del = await t
      .http()
      .delete(`/api/admin/users/${alice.id}`)
      .set(auth(admin));
    expect(del.status).toBe(200);
    expect(del.body).toEqual({ deleted: true });
    expect((await t.http().get('/api/me').set(auth(alice.token))).status).toBe(
      401,
    );
    expect((await login(t, 'alice@test.dev', alice.password)).status).toBe(401);
    const row = await t.prisma.user.findUniqueOrThrow({
      where: { id: alice.id },
    });
    expect(row.deletedAt).not.toBeNull();
    expect(
      await t.prisma.certification.count({ where: { userId: alice.id } }),
    ).toBe(1);
    expect(
      (await t.http().delete(`/api/admin/users/${alice.id}`).set(auth(admin)))
        .status,
    ).toBe(404);
    const log = await t.prisma.auditLog.findFirstOrThrow({
      where: { action: 'user.delete' },
    });
    expect(log.entityId).toBe(alice.id);
  });

  it('re-syncs a user on demand', async () => {
    const { alice } = await seedPeople();
    await t.prisma.user.update({
      where: { id: alice.id },
      data: { progressCount: 5 },
    });
    const res = await t
      .http()
      .post(`/api/admin/users/${alice.id}/sync`)
      .set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.progress.completed).toBe(1);
    expect(
      (await t.prisma.user.findUniqueOrThrow({ where: { id: alice.id } }))
        .progressCount,
    ).toBe(1);
  });
});

describe('admin accounts', () => {
  it('lets an admin create another admin, who can log in and use admin routes', async () => {
    const res = await t.http().post('/api/admin/admins').set(auth(admin)).send({
      email: 'Second@Test.dev',
      name: 'Second Admin',
      password: 'SecondPass123',
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: 'second@test.dev', role: 'ADMIN' });
    const l = await login(t, 'second@test.dev', 'SecondPass123');
    expect(l.status).toBe(200);
    expect(
      (await t.http().get('/api/admin/stats').set(auth(l.body.accessToken)))
        .status,
    ).toBe(200);
    const dup = await t.http().post('/api/admin/admins').set(auth(admin)).send({
      email: 'second@test.dev',
      name: 'Dup',
      password: 'SecondPass123',
    });
    expect(dup.status).toBe(409);
    expect(
      await t.prisma.auditLog.count({ where: { action: 'admin.create' } }),
    ).toBe(1);
  });

  it('public registration never creates admins', async () => {
    const res = await t.http().post('/api/auth/register').send({
      email: 'sneaky@test.dev',
      password: 'Password123',
      name: 'S',
      role: 'ADMIN',
    });
    expect(res.status).toBe(400);
  });
});

describe('settings', () => {
  it('reads and updates required certifications per cycle, audited', async () => {
    expect((await get('/api/admin/settings')).body).toEqual({
      required_certifications_per_cycle: 6,
    });
    const { alice } = await seedPeople();
    const res = await t
      .http()
      .patch('/api/admin/settings')
      .set(auth(admin))
      .send({ required_certifications_per_cycle: 3 });
    expect(res.body).toEqual({ required_certifications_per_cycle: 3 });
    const table = await get('/api/admin/users?status=DIPLOMATE');
    expect(table.body.data[0].progress.label).toBe('1/3');
    const dash = await t.http().get('/api/me/dashboard').set(auth(alice.token));
    expect(dash.body.progress.label).toBe('1/3');
    const log = await t.prisma.auditLog.findFirstOrThrow({
      where: { action: 'settings.update' },
    });
    expect(log.before).toEqual({ required_certifications_per_cycle: 6 });
    expect(log.after).toEqual({ required_certifications_per_cycle: 3 });
  });

  it('rejects invalid values and unknown keys', async () => {
    for (const body of [
      { required_certifications_per_cycle: 0 },
      { required_certifications_per_cycle: 1.5 },
      { required_certifications_per_cycle: '6' },
      { something_else: 1 },
    ]) {
      const res = await t
        .http()
        .patch('/api/admin/settings')
        .set(auth(admin))
        .send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
  });
});

describe('audit log', () => {
  it('lists entries newest first with actors, filters and pagination', async () => {
    await t
      .http()
      .post('/api/admin/steps')
      .set(auth(admin))
      .send({ title: 'One' });
    await t
      .http()
      .post('/api/admin/steps')
      .set(auth(admin))
      .send({ title: 'Two' });
    await t
      .http()
      .patch('/api/admin/settings')
      .set(auth(admin))
      .send({ required_certifications_per_cycle: 4 });
    const all = await get('/api/admin/audit-logs');
    expect(all.body.meta.total).toBe(3);
    expect(all.body.data[0].action).toBe('settings.update');
    expect(all.body.data[0].actor).toMatchObject({ email: 'admin@test.dev' });

    const steps = await get(
      '/api/admin/audit-logs?action=step.create&pageSize=1&page=2',
    );
    expect(steps.body.meta).toMatchObject({ total: 2, totalPages: 2, page: 2 });
    expect(steps.body.data).toHaveLength(1);
    expect(
      (await get('/api/admin/audit-logs?entity=setting')).body.meta.total,
    ).toBe(1);
    const future = await get(
      `/api/admin/audit-logs?from=${encodeURIComponent('2999-01-01T00:00:00Z')}`,
    );
    expect(future.body.meta.total).toBe(0);
  });
});

describe('clock (time travel)', () => {
  it('sets and resets the server clock', async () => {
    const set = await t
      .http()
      .post('/api/admin/clock')
      .set(auth(admin))
      .send({ now: '2030-05-05T10:00:00Z' });
    expect(set.status).toBe(200);
    expect(set.body.now.slice(0, 15)).toBe('2030-05-05T10:0');
    expect(set.body.shifted).toBe(true);
    expect((await get('/api/admin/clock')).body.now.slice(0, 4)).toBe('2030');
    expect(t.clock.now().getUTCFullYear()).toBe(2030);

    const reset = await t
      .http()
      .post('/api/admin/clock')
      .set(auth(admin))
      .send({ reset: true });
    expect(reset.body.shifted).toBe(false);
    expect(t.clock.now().getUTCFullYear()).toBeGreaterThanOrEqual(2026);
    const empty = await t
      .http()
      .post('/api/admin/clock')
      .set(auth(admin))
      .send({});
    expect(empty.body.code).toBe('CLOCK_INPUT_REQUIRED');
    expect(
      await t.prisma.auditLog.count({ where: { action: 'clock.set' } }),
    ).toBe(2);
  });

  it('is unavailable when ALLOW_TIME_TRAVEL is off or NODE_ENV is production', async () => {
    const cfg = t.app.get(ConfigService);
    const real = cfg.get.bind(cfg) as (k: string, o?: unknown) => unknown;
    const spy = vi.spyOn(cfg, 'get');

    spy.mockImplementation(((k: string, o?: unknown) =>
      k === 'ALLOW_TIME_TRAVEL' ? false : real(k, o)) as never);
    let res = await t
      .http()
      .post('/api/admin/clock')
      .set(auth(admin))
      .send({ now: '2030-01-01T00:00:00Z' });
    expect(res.status).toBe(404);
    expect((await get('/api/admin/clock')).status).toBe(404);

    spy.mockImplementation(((k: string, o?: unknown) =>
      k === 'NODE_ENV' ? 'production' : real(k, o)) as never);
    res = await t
      .http()
      .post('/api/admin/clock')
      .set(auth(admin))
      .send({ now: '2030-01-01T00:00:00Z' });
    expect(res.status).toBe(404);
    expect(t.clock.isShifted()).toBe(false);
  });
});
