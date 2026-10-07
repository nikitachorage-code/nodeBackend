/**
 * Cycle / lapse / progress rules. Pure: no DB, no Nest, no Date.now().
 * Every function that depends on time takes `now` as a parameter.
 *
 * Model
 * - A cycle is three 12-month periods (Year 1..3) anchored on the cycle start,
 *   computed in UTC. Each period start is derived from the cycle start (never
 *   from the previous period) so a Feb 29 start does not drift.
 * - Lapse rule: at the first instant of Year 3, if no active certification of
 *   the cycle was uploaded in Year 1 or Year 2, every active certification
 *   becomes LAPSED and the user has no active cycle.
 * - A cycle that survives its Year 3 check ends at start + 3 years and the next
 *   cycle starts at that instant.
 * - After a lapse the next active certification starts a new cycle at its
 *   upload time.
 * - Completed cycles are frozen: only the current cycle is re-evaluated, so
 *   deleting a certification of a past cycle never lapses it retroactively.
 */

export type CertStatus = 'ACTIVE' | 'LAPSED';

/** Certification as the engine sees it. Deleted certifications are excluded by the caller. */
export interface EngineCert {
  id: string;
  uploadedAt: Date;
  status: CertStatus;
  /** 0 means "not yet assigned to a cycle"; evaluate() assigns it. */
  cycleNo: number;
}

/** Cycle state cached on the user. start === null means no active cycle. */
export interface CycleState {
  /** Number of the current cycle, or of the last cycle when start is null. 0 = never started. */
  cycleNo: number;
  start: Date | null;
}

export interface LapseEvent {
  cycleNo: number;
  /** The instant the rule fires: first instant of Year 3 of the lapsed cycle. */
  ruleInstant: Date;
  lapsedCertIds: string[];
}

export interface CycleAssignment {
  certId: string;
  cycleNo: number;
}

export interface EvaluateInput {
  state: CycleState;
  certs: EngineCert[];
  requiredPerCycle: number;
  now: Date;
}

export type UserStatusValue = 'CANDIDATE' | 'DIPLOMATE';

export interface Evaluation {
  state: CycleState;
  lapses: LapseEvent[];
  /** Certs whose cycleNo must be written (new assignments only). */
  assignments: CycleAssignment[];
  status: UserStatusValue;
  /** Active certs uploaded in the current cycle. */
  progressCount: number;
  required: number;
  /** In Year 2 of a cycle with no active upload yet in Year 1 or 2. */
  atRisk: boolean;
  /** Which year of the current cycle `now` falls in; null without an active cycle. */
  currentYear: 1 | 2 | 3 | null;
}

const MAX_STEPS = 10_000;

/** Adds whole years in UTC. Feb 29 rolls to Feb 28 in non-leap years. */
export function addYears(date: Date, years: number): Date {
  const year = date.getUTCFullYear() + years;
  const month = date.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const d = new Date(date.getTime());
  d.setUTCFullYear(year, month, Math.min(date.getUTCDate(), daysInMonth));
  return d;
}

export interface CycleWindows {
  year1: { start: Date; end: Date };
  year2: { start: Date; end: Date };
  year3: { start: Date; end: Date };
  /** Exclusive end of the cycle; also the start of the next one. */
  end: Date;
}

export function cycleWindows(start: Date): CycleWindows {
  const s1 = start;
  const s2 = addYears(start, 1);
  const s3 = addYears(start, 2);
  const end = addYears(start, 3);
  return {
    year1: { start: s1, end: s2 },
    year2: { start: s2, end: s3 },
    year3: { start: s3, end },
    end,
  };
}

/** Which year of the cycle an instant falls in. null if before the start or at/after the end. */
export function yearOfCycle(start: Date, at: Date): 1 | 2 | 3 | null {
  const w = cycleWindows(start);
  const t = at.getTime();
  if (t < start.getTime() || t >= w.end.getTime()) return null;
  if (t < w.year2.start.getTime()) return 1;
  if (t < w.year3.start.getTime()) return 2;
  return 3;
}

/** Starts the first cycle (called when onboarding is submitted). */
export function startCycle(state: CycleState, at: Date): CycleState {
  return { cycleNo: state.cycleNo + 1, start: at };
}

function hasEarlyCert(certs: EngineCert[], cycleNo: number, start: Date) {
  const y3 = addYears(start, 2).getTime();
  return certs.some(
    (c) =>
      c.status === 'ACTIVE' &&
      c.cycleNo === cycleNo &&
      c.uploadedAt.getTime() >= start.getTime() &&
      c.uploadedAt.getTime() < y3,
  );
}

/**
 * Brings the cycle state up to `now` and derives status, progress and flags.
 * Idempotent: feeding the returned state and updated certs back in with the
 * same `now` yields the same result with no further lapses or assignments.
 */
export function evaluate(input: EvaluateInput): Evaluation {
  const { requiredPerCycle, now } = input;
  let { cycleNo, start } = input.state;
  // Work on a local copy of the active certs; lapsing removes them from it.
  let active = input.certs
    .filter((c) => c.status === 'ACTIVE')
    .map((c) => ({ ...c }));
  const lapses: LapseEvent[] = [];
  const assignmentMap = new Map<string, number>();

  for (let step = 0; step < MAX_STEPS; step++) {
    if (start === null) {
      // No active cycle: the earliest unlapsed certification starts a new one.
      const earliest = [...active].sort(
        (a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime(),
      )[0];
      if (!earliest) break;
      cycleNo += 1;
      start = earliest.uploadedAt;
      continue;
    }

    const w = cycleWindows(start);
    // Assign unassigned certs that fall inside this cycle's window.
    for (const c of active) {
      if (
        c.cycleNo === 0 &&
        c.uploadedAt.getTime() >= start.getTime() &&
        c.uploadedAt.getTime() < w.end.getTime()
      ) {
        c.cycleNo = cycleNo;
        assignmentMap.set(c.id, cycleNo);
      }
    }

    if (now.getTime() < w.year3.start.getTime()) break;

    if (!hasEarlyCert(active, cycleNo, start)) {
      const lapsed = active.filter(
        (c) => c.cycleNo > 0 && c.cycleNo <= cycleNo,
      );
      lapses.push({
        cycleNo,
        ruleInstant: w.year3.start,
        lapsedCertIds: lapsed.map((c) => c.id),
      });
      const lapsedIds = new Set(lapsed.map((c) => c.id));
      active = active.filter((c) => !lapsedIds.has(c.id));
      for (const id of lapsedIds) assignmentMap.delete(id);
      start = null;
      continue;
    }

    if (now.getTime() >= w.end.getTime()) {
      cycleNo += 1;
      start = w.end;
      continue;
    }
    break;
  }

  const lapsedNow = new Set(lapses.flatMap((l) => l.lapsedCertIds));
  const stillActive = input.certs.filter(
    (c) => c.status === 'ACTIVE' && !lapsedNow.has(c.id),
  );
  const progressCount =
    start === null
      ? 0
      : stillActive.filter(
          (c) => c.cycleNo === cycleNo || assignmentMap.get(c.id) === cycleNo,
        ).length;

  let currentYear: 1 | 2 | 3 | null = null;
  let atRisk = false;
  if (start !== null) {
    currentYear = yearOfCycle(start, now);
    if (currentYear === 2) {
      atRisk = !hasEarlyCert(active, cycleNo, start);
    }
  }

  return {
    state: { cycleNo, start },
    lapses,
    assignments: [...assignmentMap].map(([certId, no]) => ({
      certId,
      cycleNo: no,
    })),
    status: stillActive.length > 0 ? 'DIPLOMATE' : 'CANDIDATE',
    progressCount,
    required: requiredPerCycle,
    atRisk,
    currentYear,
  };
}

/** True when `now` is inside the warning window before Year 3 and no early cert exists. */
export function shouldWarn(
  state: CycleState,
  certs: EngineCert[],
  now: Date,
  leadDays: number,
): boolean {
  if (state.start === null) return false;
  const w = cycleWindows(state.start);
  const warnFrom = w.year3.start.getTime() - leadDays * 86_400_000;
  if (now.getTime() < warnFrom || now.getTime() >= w.year3.start.getTime()) {
    return false;
  }
  return !hasEarlyCert(certs, state.cycleNo, state.start);
}

export type TileStatus =
  'HAS_CERTIFICATION' | 'MISSING' | 'CURRENT' | 'UPCOMING';

export interface YearTile {
  year: 1 | 2 | 3;
  /** Calendar year (UTC) in which this period starts, e.g. 2016. */
  calendarYear: number;
  start: Date;
  end: Date;
  status: TileStatus;
  certificationCount: number;
}

export function yearTiles(
  state: CycleState,
  certs: EngineCert[],
  now: Date,
): YearTile[] {
  if (state.start === null) return [];
  const w = cycleWindows(state.start);
  const periods = [w.year1, w.year2, w.year3] as const;
  return periods.map((p, i) => {
    const count = certs.filter(
      (c) =>
        c.status === 'ACTIVE' &&
        c.cycleNo === state.cycleNo &&
        c.uploadedAt.getTime() >= p.start.getTime() &&
        c.uploadedAt.getTime() < p.end.getTime(),
    ).length;
    const t = now.getTime();
    const isCurrent = t >= p.start.getTime() && t < p.end.getTime();
    const isFuture = t < p.start.getTime();
    let status: TileStatus;
    if (count > 0) status = 'HAS_CERTIFICATION';
    else if (isCurrent) status = 'CURRENT';
    else if (isFuture) status = 'UPCOMING';
    else status = 'MISSING';
    return {
      year: (i + 1) as 1 | 2 | 3,
      calendarYear: p.start.getUTCFullYear(),
      start: p.start,
      end: p.end,
      status,
      certificationCount: count,
    };
  });
}

export interface PastCycleSummary {
  cycleNo: number;
  totalCertifications: number;
  activeCertifications: number;
  lapsed: boolean;
  firstUploadedAt: Date | null;
  lastUploadedAt: Date | null;
}

/** Summaries of cycles before the current one, derived from certification records. */
export function pastCycles(
  state: CycleState,
  certs: EngineCert[],
): PastCycleSummary[] {
  const current = state.start === null ? Infinity : state.cycleNo;
  const byCycle = new Map<number, EngineCert[]>();
  for (const c of certs) {
    if (c.cycleNo === 0 || c.cycleNo >= current) continue;
    byCycle.set(c.cycleNo, [...(byCycle.get(c.cycleNo) ?? []), c]);
  }
  return [...byCycle]
    .sort(([a], [b]) => b - a)
    .map(([cycleNo, list]) => {
      const times = list.map((c) => c.uploadedAt.getTime());
      return {
        cycleNo,
        totalCertifications: list.length,
        activeCertifications: list.filter((c) => c.status === 'ACTIVE').length,
        lapsed: list.some((c) => c.status === 'LAPSED'),
        firstUploadedAt: new Date(Math.min(...times)),
        lastUploadedAt: new Date(Math.max(...times)),
      };
    });
}

export interface ExplainInput {
  onboarded: boolean;
  state: CycleState;
  /** Non-deleted certifications, after the latest sync. */
  certs: EngineCert[];
  requiredPerCycle: number;
  now: Date;
  /** Past lapses, e.g. from the audit log. */
  lapses: { cycleNo: number; ruleInstant: Date; certCount: number }[];
}

export interface Explanation {
  summary: string;
  lines: string[];
}

const day = (d: Date) => d.toISOString().slice(0, 10);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Plain-language account of how status and progress were derived. Same rules as evaluate(). */
export function explain(input: ExplainInput): Explanation {
  const { state, certs, now, requiredPerCycle } = input;
  const lines: string[] = [];

  if (!input.onboarded) {
    return {
      summary: 'Onboarding is not complete, so no cycle has started.',
      lines: [
        'A cycle starts when the user submits all required onboarding fields.',
        'Status: Candidate, with no certifications.',
      ],
    };
  }

  const ev = evaluate({ state, certs, requiredPerCycle, now });
  const activeCount = certs.filter((c) => c.status === 'ACTIVE').length;
  lines.push(
    ev.status === 'DIPLOMATE'
      ? `Status: Diplomate, because they hold ${plural(activeCount, 'active certification')}.`
      : 'Status: Candidate, because they hold no active certifications.',
  );

  if (state.start) {
    const w = cycleWindows(state.start);
    const inYear = (p: { start: Date; end: Date }) =>
      certs.filter(
        (c) =>
          c.status === 'ACTIVE' &&
          c.cycleNo === state.cycleNo &&
          c.uploadedAt.getTime() >= p.start.getTime() &&
          c.uploadedAt.getTime() < p.end.getTime(),
      ).length;
    const [y1, y2, y3] = [inYear(w.year1), inYear(w.year2), inYear(w.year3)];
    lines.push(
      `Current cycle ${state.cycleNo} started ${day(w.year1.start)} and ends ${day(w.end)}: ` +
        `Year 1 is ${day(w.year1.start)} to ${day(w.year2.start)}, ` +
        `Year 2 to ${day(w.year3.start)}, Year 3 to ${day(w.end)}.`,
    );
    lines.push(`Uploads this cycle: Year 1 ${y1}, Year 2 ${y2}, Year 3 ${y3}.`);
    lines.push(
      `Progress: ${ev.progressCount} of ${requiredPerCycle} required. Only active certifications uploaded in the current cycle count.`,
    );
    if (y1 + y2 > 0) {
      lines.push(
        now.getTime() >= w.year3.start.getTime()
          ? `Lapse check passed on ${day(w.year3.start)}: at least one active certification was uploaded in Year 1 or Year 2.`
          : `Lapse check on ${day(w.year3.start)} will pass: at least one active certification was uploaded in Year 1 or Year 2.`,
      );
    } else {
      lines.push(
        `No active certification has been uploaded in Year 1 or Year 2. If none is uploaded before ${day(w.year3.start)}, all certifications lapse on that day.`,
      );
    }
  } else {
    lines.push(
      'No cycle is active. The next certification upload starts a new cycle.',
    );
  }

  for (const l of [...input.lapses].sort((a, b) => b.cycleNo - a.cycleNo)) {
    lines.push(
      `Cycle ${l.cycleNo} lapsed on ${day(l.ruleInstant)} (first day of its Year 3) because no active certification was uploaded in its Year 1 or Year 2. ${plural(l.certCount, 'certification')} ${l.certCount === 1 ? 'was' : 'were'} archived.`,
    );
  }
  for (const p of pastCycles(state, certs)) {
    lines.push(
      `Cycle ${p.cycleNo}: ${plural(p.totalCertifications, 'certification')} uploaded, ${p.activeCertifications} still active.`,
    );
  }

  const who = ev.status === 'DIPLOMATE' ? 'Diplomate' : 'Candidate';
  const summary = state.start
    ? `${who} in cycle ${state.cycleNo}, ${ev.progressCount}/${requiredPerCycle} certifications this cycle${ev.atRisk ? ', at risk of lapsing' : ''}.`
    : `${who} with no active cycle.`;
  return { summary, lines };
}
