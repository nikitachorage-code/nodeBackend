import { describe, expect, it } from 'vitest';
import {
  addYears,
  cycleWindows,
  evaluate,
  explain,
  pastCycles,
  shouldWarn,
  startCycle,
  yearOfCycle,
  yearTiles,
  type CycleState,
  type EngineCert,
  type Evaluation,
} from './cycle-engine.js';

const d = (iso: string) => new Date(iso);
const REQUIRED = 6;

/** Applies an evaluation to in-memory records the way the sync service will. */
class Sim {
  state: CycleState = { cycleNo: 0, start: null };
  certs: EngineCert[] = [];
  private seq = 0;

  onboard(at: string) {
    this.state = startCycle(this.state, d(at));
  }

  sync(now: string): Evaluation {
    const result = evaluate({
      state: this.state,
      certs: this.certs,
      requiredPerCycle: REQUIRED,
      now: d(now),
    });
    this.state = result.state;
    const lapsed = new Set(result.lapses.flatMap((l) => l.lapsedCertIds));
    const assigned = new Map(
      result.assignments.map((a) => [a.certId, a.cycleNo]),
    );
    this.certs = this.certs.map((c) => ({
      ...c,
      status: lapsed.has(c.id) ? 'LAPSED' : c.status,
      cycleNo: assigned.get(c.id) ?? c.cycleNo,
    }));
    return result;
  }

  /** Upload flow: sync first, insert at `at`, sync again. */
  upload(at: string): string {
    this.sync(at);
    const id = `c${++this.seq}`;
    this.certs.push({ id, uploadedAt: d(at), status: 'ACTIVE', cycleNo: 0 });
    this.sync(at);
    return id;
  }

  remove(id: string, now: string): Evaluation {
    this.certs = this.certs.filter((c) => c.id !== id);
    return this.sync(now);
  }

  get(id: string) {
    return this.certs.find((c) => c.id === id)!;
  }
}

describe('addYears', () => {
  it('keeps the same month/day and time in UTC', () => {
    expect(addYears(d('2016-05-10T13:45:12.123Z'), 2).toISOString()).toBe(
      '2018-05-10T13:45:12.123Z',
    );
  });

  it('rolls Feb 29 to Feb 28 in a non-leap year', () => {
    expect(addYears(d('2016-02-29T00:00:00Z'), 1).toISOString()).toBe(
      '2017-02-28T00:00:00.000Z',
    );
  });

  it('keeps Feb 29 when the target year is a leap year', () => {
    expect(addYears(d('2016-02-29T00:00:00Z'), 4).toISOString()).toBe(
      '2020-02-29T00:00:00.000Z',
    );
  });
});

describe('cycleWindows / yearOfCycle (year boundaries)', () => {
  const start = d('2016-03-15T10:00:00Z');

  it('builds three 12-month periods ending when the 4th year begins', () => {
    const w = cycleWindows(start);
    expect(w.year1.start.toISOString()).toBe('2016-03-15T10:00:00.000Z');
    expect(w.year2.start.toISOString()).toBe('2017-03-15T10:00:00.000Z');
    expect(w.year3.start.toISOString()).toBe('2018-03-15T10:00:00.000Z');
    expect(w.end.toISOString()).toBe('2019-03-15T10:00:00.000Z');
  });

  it('classifies instants either side of each boundary', () => {
    const w = cycleWindows(start);
    expect(yearOfCycle(start, new Date(start.getTime() - 1))).toBeNull();
    expect(yearOfCycle(start, start)).toBe(1);
    expect(yearOfCycle(start, new Date(w.year2.start.getTime() - 1))).toBe(1);
    expect(yearOfCycle(start, w.year2.start)).toBe(2);
    expect(yearOfCycle(start, new Date(w.year3.start.getTime() - 1))).toBe(2);
    expect(yearOfCycle(start, w.year3.start)).toBe(3);
    expect(yearOfCycle(start, new Date(w.end.getTime() - 1))).toBe(3);
    expect(yearOfCycle(start, w.end)).toBeNull();
  });

  it('leap-day start: periods roll to Feb 28 without drifting', () => {
    const w = cycleWindows(d('2016-02-29T08:00:00Z'));
    expect(w.year2.start.toISOString()).toBe('2017-02-28T08:00:00.000Z');
    expect(w.year3.start.toISOString()).toBe('2018-02-28T08:00:00.000Z');
    expect(w.end.toISOString()).toBe('2019-02-28T08:00:00.000Z');
  });

  it('leap-day start in a leap year keeps Feb 29 where it exists', () => {
    const w = cycleWindows(d('2020-02-29T00:00:00Z'));
    expect(w.year2.start.toISOString()).toBe('2021-02-28T00:00:00.000Z');
    expect(w.end.toISOString()).toBe('2023-02-28T00:00:00.000Z');
    const w4 = cycleWindows(d('2024-02-29T00:00:00Z'));
    expect(w4.year3.start.toISOString()).toBe('2026-02-28T00:00:00.000Z');
  });
});

describe('lapse rule', () => {
  it('lapses on the first instant of Year 3 with no Year 1/2 upload', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    const before = s.sync('2017-12-31T23:59:59.999Z');
    expect(before.lapses).toHaveLength(0);
    expect(before.atRisk).toBe(true);

    const at = s.sync('2018-01-01T00:00:00Z');
    expect(at.lapses).toHaveLength(1);
    expect(at.lapses[0].ruleInstant.toISOString()).toBe(
      '2018-01-01T00:00:00.000Z',
    );
    expect(at.state.start).toBeNull();
    expect(at.status).toBe('CANDIDATE');
  });

  it('one upload in Year 1 is enough to avoid lapsing', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    s.upload('2016-12-31T23:59:59.999Z');
    const r = s.sync('2018-06-01T00:00:00Z');
    expect(r.lapses).toHaveLength(0);
    expect(r.status).toBe('DIPLOMATE');
  });

  it('upload at the very last instant of Year 2 saves the cycle', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    const id = s.upload('2017-12-31T23:59:59.999Z');
    const r = s.sync('2018-01-01T00:00:00Z');
    expect(r.lapses).toHaveLength(0);
    expect(s.get(id).cycleNo).toBe(1);
    expect(s.get(id).status).toBe('ACTIVE');
  });

  it('upload at the first instant of Year 3 does not save the cycle', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    const old = s.upload('2016-06-01T00:00:00Z');
    s.remove(old, '2016-06-02T00:00:00Z'); // nothing left in Year 1/2
    const id = s.upload('2018-01-01T00:00:00Z');
    // The lapse fired first, so the new upload starts a fresh cycle instead of rescuing cycle 1.
    expect(s.state.cycleNo).toBe(2);
    expect(s.state.start!.toISOString()).toBe('2018-01-01T00:00:00.000Z');
    expect(s.get(id).cycleNo).toBe(2);
    expect(s.get(id).status).toBe('ACTIVE');
  });

  it('Year 3 upload after a lapse cannot back-fill the lapsed cycle', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    const lapse = s.sync('2018-01-01T00:00:00Z');
    expect(lapse.lapses).toHaveLength(1);
    const id = s.upload('2018-07-01T00:00:00Z');
    expect(s.state.cycleNo).toBe(2);
    expect(s.get(id).cycleNo).toBe(2);
    expect(s.sync('2018-07-02T00:00:00Z').status).toBe('DIPLOMATE');
  });
});

describe('catching up after years with no job run', () => {
  it('replays several cycles in one evaluation', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    const kept = s.upload('2016-05-01T00:00:00Z'); // cycle 1 survives
    // Nothing ever uploaded in cycle 2 (2019-2021); the job first runs in 2030.
    const r = s.sync('2030-01-01T00:00:00Z');
    expect(r.lapses).toHaveLength(1);
    expect(r.lapses[0].cycleNo).toBe(2);
    expect(r.lapses[0].ruleInstant.toISOString()).toBe(
      '2021-01-01T00:00:00.000Z',
    );
    expect(r.lapses[0].lapsedCertIds).toEqual([kept]);
    expect(r.status).toBe('CANDIDATE');
    expect(r.state.start).toBeNull();
    expect(s.get(kept).status).toBe('LAPSED');
  });

  it('a cycle with uploads rolls forward to the next cycle without lapsing', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    s.upload('2016-05-01T00:00:00Z');
    const r = s.sync('2019-06-01T00:00:00Z');
    expect(r.lapses).toHaveLength(0);
    expect(r.state.cycleNo).toBe(2);
    expect(r.state.start!.toISOString()).toBe('2019-01-01T00:00:00.000Z');
    expect(r.progressCount).toBe(0); // old cert belongs to cycle 1
    expect(r.status).toBe('DIPLOMATE'); // still holds an active cert
  });

  it('is idempotent: re-evaluating changes nothing', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    s.upload('2016-05-01T00:00:00Z');
    s.sync('2030-01-01T00:00:00Z');
    const stateAfter = { ...s.state };
    const second = s.sync('2030-01-01T00:00:00Z');
    expect(second.lapses).toHaveLength(0);
    expect(second.assignments).toHaveLength(0);
    expect(s.state).toEqual(stateAfter);
  });
});

describe('deleting certifications', () => {
  it('deleting the last certification makes the user a Candidate without ending the cycle', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    const id = s.upload('2016-05-01T00:00:00Z');
    expect(s.sync('2016-05-02T00:00:00Z').status).toBe('DIPLOMATE');
    const r = s.remove(id, '2016-06-01T00:00:00Z');
    expect(r.status).toBe('CANDIDATE');
    expect(r.progressCount).toBe(0);
    expect(r.lapses).toHaveLength(0);
    expect(r.state.start).not.toBeNull();
  });

  it('deleting the only Year 1-2 upload during Year 3 lapses immediately', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    const early = s.upload('2016-05-01T00:00:00Z');
    const y3 = s.upload('2018-03-01T00:00:00Z');
    expect(s.sync('2018-03-02T00:00:00Z').lapses).toHaveLength(0);
    const r = s.remove(early, '2018-03-03T00:00:00Z');
    expect(r.lapses).toHaveLength(1);
    expect(r.lapses[0].lapsedCertIds).toEqual([y3]);
    expect(r.status).toBe('CANDIDATE');
  });

  it('deleting a certification from a completed cycle never lapses it retroactively', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    const old = s.upload('2016-05-01T00:00:00Z');
    s.upload('2019-02-01T00:00:00Z'); // cycle 2 survives
    expect(s.state.cycleNo).toBe(2);
    const r = s.remove(old, '2019-03-01T00:00:00Z');
    expect(r.lapses).toHaveLength(0);
    expect(r.state.cycleNo).toBe(2);
    expect(r.status).toBe('DIPLOMATE');
    expect(r.progressCount).toBe(1);
  });
});

describe('lapse then new upload', () => {
  it('starts a new cycle at the upload instant and applies the rules again', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    s.sync('2018-01-01T00:00:00Z'); // lapsed, candidate
    const id = s.upload('2019-04-10T12:00:00Z');
    expect(s.state.cycleNo).toBe(2);
    expect(s.state.start!.toISOString()).toBe('2019-04-10T12:00:00.000Z');
    expect(s.get(id).cycleNo).toBe(2);
    // new cycle is subject to the same rule: its Year 3 starts 2021-04-10T12:00Z
    expect(s.sync('2021-04-10T11:59:59.999Z').lapses).toHaveLength(0);
  });

  it('a lapsed cycle’s certifications stay archived, not deleted', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    const id = s.upload('2016-05-01T00:00:00Z');
    s.sync('2019-01-01T00:00:00Z'); // cycle 2 begins
    s.sync('2021-01-01T00:00:00Z'); // cycle 2 lapses, taking the old cert with it
    expect(s.get(id).status).toBe('LAPSED');
    expect(s.certs).toHaveLength(1);
  });
});

describe('progress, risk and tiles', () => {
  it('counts only active certifications of the current cycle', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    s.upload('2016-02-01T00:00:00Z');
    s.upload('2017-02-01T00:00:00Z');
    s.upload('2018-02-01T00:00:00Z');
    const r = s.sync('2018-03-01T00:00:00Z');
    expect(r.progressCount).toBe(3);
    expect(r.required).toBe(REQUIRED);
  });

  it('flags at-risk in Year 2 with no upload yet, and clears it after an upload', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    expect(s.sync('2016-06-01T00:00:00Z').atRisk).toBe(false); // Year 1
    expect(s.sync('2017-06-01T00:00:00Z').atRisk).toBe(true); // Year 2, nothing
    s.upload('2017-06-02T00:00:00Z');
    expect(s.sync('2017-06-03T00:00:00Z').atRisk).toBe(false);
  });

  it('shouldWarn is true only inside the lead window before Year 3 with no early upload', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    expect(shouldWarn(s.state, s.certs, d('2017-11-30T00:00:00Z'), 30)).toBe(
      false,
    );
    expect(shouldWarn(s.state, s.certs, d('2017-12-05T00:00:00Z'), 30)).toBe(
      true,
    );
    expect(shouldWarn(s.state, s.certs, d('2018-01-01T00:00:00Z'), 30)).toBe(
      false,
    );
    s.upload('2016-03-01T00:00:00Z');
    expect(shouldWarn(s.state, s.certs, d('2017-12-05T00:00:00Z'), 30)).toBe(
      false,
    );
  });

  it('builds year tiles with calendar years and statuses', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    s.upload('2016-05-01T00:00:00Z');
    const tiles = yearTiles(s.state, s.certs, d('2017-06-01T00:00:00Z'));
    expect(tiles.map((t) => [t.calendarYear, t.status])).toEqual([
      [2016, 'HAS_CERTIFICATION'],
      [2017, 'CURRENT'],
      [2018, 'UPCOMING'],
    ]);
    const later = yearTiles(s.state, s.certs, d('2018-06-01T00:00:00Z'));
    expect(later[1].status).toBe('MISSING');
  });

  it('summarises past cycles from certification records', () => {
    const s = new Sim();
    s.onboard('2016-01-01T00:00:00Z');
    s.upload('2016-05-01T00:00:00Z');
    s.upload('2016-06-01T00:00:00Z');
    s.sync('2019-06-01T00:00:00Z');
    const past = pastCycles(s.state, s.certs);
    expect(past).toHaveLength(1);
    expect(past[0]).toMatchObject({
      cycleNo: 1,
      totalCertifications: 2,
      activeCertifications: 2,
      lapsed: false,
    });
  });
});

describe('explain', () => {
  const run = (s: Sim, now: string, lapses: Evaluation['lapses'] = []) =>
    explain({
      onboarded: true,
      state: s.state,
      certs: s.certs,
      requiredPerCycle: REQUIRED,
      now: d(now),
      lapses: lapses.map((l) => ({
        cycleNo: l.cycleNo,
        ruleInstant: l.ruleInstant,
        certCount: l.lapsedCertIds.length,
      })),
    });

  it('explains a not-yet-onboarded user', () => {
    const e = explain({
      onboarded: false,
      state: { cycleNo: 0, start: null },
      certs: [],
      requiredPerCycle: REQUIRED,
      now: d('2026-01-01T00:00:00Z'),
      lapses: [],
    });
    expect(e.summary).toContain('Onboarding is not complete');
  });

  it('explains progress, years and the lapse check for an active cycle', () => {
    const s = new Sim();
    s.onboard('2026-01-01T00:00:00Z');
    s.upload('2026-03-01T00:00:00Z');
    s.upload('2027-03-01T00:00:00Z');
    const e = run(s, '2027-06-01T00:00:00Z');
    expect(e.summary).toBe(
      'Diplomate in cycle 1, 2/6 certifications this cycle.',
    );
    const text = e.lines.join('\n');
    expect(text).toContain('Uploads this cycle: Year 1 1, Year 2 1, Year 3 0.');
    expect(text).toContain('Progress: 2 of 6 required');
    expect(text).toContain('Lapse check on 2028-01-01 will pass');
  });

  it('explains a lapse and that the next upload starts a new cycle', () => {
    const s = new Sim();
    s.onboard('2026-01-01T00:00:00Z');
    s.upload('2026-03-01T00:00:00Z');
    const ev = s.sync('2031-01-02T00:00:00Z');
    const e = run(s, '2031-01-02T00:00:00Z', ev.lapses);
    const text = e.lines.join('\n');
    expect(e.summary).toBe('Candidate with no active cycle.');
    expect(text).toContain('Cycle 2 lapsed on 2031-01-01');
    expect(text).toContain('1 certification was archived');
    expect(text).toContain('The next certification upload starts a new cycle');
  });

  it('warns when nothing was uploaded in Years 1-2', () => {
    const s = new Sim();
    s.onboard('2026-01-01T00:00:00Z');
    const e = run(s, '2027-06-01T00:00:00Z');
    expect(e.summary).toContain('at risk of lapsing');
    expect(e.lines.join('\n')).toContain(
      'all certifications lapse on that day',
    );
  });
});
