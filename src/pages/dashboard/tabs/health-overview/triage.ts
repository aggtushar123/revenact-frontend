import { differenceInCalendarDays, isValid, parse } from 'date-fns';
import type { HealthDataRow, HealthStatus } from '../../../../features/health/types';

/** The shape `HealthDataRow.renewalDate` is written in, e.g. "Dec 31, 2026". */
export const RENEWAL_DATE_FORMAT = 'MMM d, yyyy';

/** At or above this score an account is called out as needing action now. */
export const ACTION_THRESHOLD = 40;

/** Renewals inside this window carry the full renewal weighting. */
export const RENEWAL_URGENT_DAYS = 90;
/** Renewals inside this wider window carry a reduced weighting. */
export const RENEWAL_NEAR_DAYS = 180;

/**
 * How many months of history triage judges direction over.
 *
 * Accounts carry a year, but triage is a "who do I call today" list: an account
 * that slipped last quarter and has since held is not the same problem as one
 * that dropped a grade this month. The Movement tab reads the full year.
 */
export const TRAJECTORY_WINDOW_MONTHS = 3;

/** How much worse each state is than Good. Drives both the base score and
 *  the trajectory delta, so a Good→Poor fall counts for more than Good→Average. */
const SEVERITY: Record<HealthStatus, number> = { Good: 0, Average: 1, Poor: 3 };

const WEIGHT = {
  severity: 22,
  pulseGap: 11,
  renewalUrgent: 18,
  renewalNear: 8,
  decline: 9,
  pilot: 6,
} as const;

export type TrajectoryDirection = 'declining' | 'improving' | 'flat' | 'unknown';

export interface RiskFactor {
  /** Shown to the user as the reason this account scored where it did. */
  label: string;
  points: number;
}

export interface TriageRow {
  row: HealthDataRow;
  score: number;
  /** Every factor that contributed points, largest first. Never empty for a
   *  scored account; an account with no risk at all scores 0 with no factors. */
  factors: RiskFactor[];
  /** Null when `renewalDate` is absent or not in RENEWAL_DATE_FORMAT. */
  daysToRenewal: number | null;
  /** csmPulseScore − aiPulseScore, or **null when either side hasn't rated
   *  this account**. Positive means the AI reads it colder than the CSM does —
   *  the blind-spot direction. Null is not zero: an unrated account is not one
   *  the two sides agree on. */
  pulseGap: number | null;
  direction: TrajectoryDirection;
  /** Health states oldest → newest, as recorded in `history`. */
  trail: HealthStatus[];
}

/**
 * Days from `now` until the account renews.
 *
 * `renewalDate` is a display string rather than a timestamp, and at least one
 * row in MOCK_HEALTH_DATA is hand-written, so this returns null rather than
 * NaN when the string doesn't parse — callers render "—" for that.
 */
export function daysToRenewal(row: HealthDataRow, now: Date = new Date()): number | null {
  const parsed = renewalDateOf(row, now);
  return parsed === null ? null : differenceInCalendarDays(parsed, now);
}

/**
 * The account's renewal date as a Date, or null if it isn't readable.
 *
 * `renewalDate` is a display string, so anything that needs to group by month
 * rather than count days down has to go through the same tolerant parse.
 */
export function renewalDateOf(row: HealthDataRow, now: Date = new Date()): Date | null {
  if (!row.renewalDate) return null;
  const parsed = parse(row.renewalDate, RENEWAL_DATE_FORMAT, now);
  return isValid(parsed) ? parsed : null;
}

/**
 * Which way the account has moved over the last `months` entries in `history`.
 *
 * `history` is empty on at least one seeded row, and nothing guarantees it is
 * sorted, so this reads it in the order given and treats fewer than two
 * entries as 'unknown' rather than inventing a direction. The returned trail
 * is the window actually judged, which is also what the row glyph draws.
 */
export function trajectoryOf(
  row: HealthDataRow,
  months: number = TRAJECTORY_WINDOW_MONTHS,
): {
  direction: TrajectoryDirection;
  trail: HealthStatus[];
} {
  const full = (row.history ?? []).map((h) => h.status);
  const trail = months > 0 ? full.slice(-months) : full;
  if (trail.length < 2) return { direction: 'unknown', trail };

  const delta = SEVERITY[trail[trail.length - 1]] - SEVERITY[trail[0]];
  if (delta > 0) return { direction: 'declining', trail };
  if (delta < 0) return { direction: 'improving', trail };
  return { direction: 'flat', trail };
}

/**
 * Score one account for triage.
 *
 * The weighting is deliberately flat and readable rather than learned: this
 * has to be arguable in a QBR, so every point an account carries is traceable
 * back to a named factor in `factors`.
 */
export function scoreRow(row: HealthDataRow, now: Date = new Date()): TriageRow {
  const factors: RiskFactor[] = [];

  const severity = SEVERITY[row.healthStatus] ?? 0;
  if (severity > 0) {
    factors.push({
      label: `Health is ${row.healthStatus}`,
      points: severity * WEIGHT.severity,
    });
  }

  // Only a *colder* AI read counts. The reverse (CSM below AI) is worth
  // surfacing too, but it isn't risk — it's the CSM catching something first.
  // An unrated account has no gap at all, which is different from a gap of 0.
  const pulseGap =
    row.csmPulseScore === null || row.aiPulseScore === null
      ? null
      : row.csmPulseScore - row.aiPulseScore;
  if (pulseGap !== null && pulseGap > 0) {
    factors.push({
      label: `AI Pulse ${pulseGap} below CSM's`,
      points: pulseGap * WEIGHT.pulseGap,
    });
  }

  const days = daysToRenewal(row, now);
  if (days !== null && days <= RENEWAL_URGENT_DAYS) {
    factors.push({ label: `Renews in ${days}d`, points: WEIGHT.renewalUrgent });
  } else if (days !== null && days <= RENEWAL_NEAR_DAYS) {
    factors.push({ label: `Renews in ${days}d`, points: WEIGHT.renewalNear });
  }

  const { direction, trail } = trajectoryOf(row);
  if (direction === 'declining') {
    const drop = SEVERITY[trail[trail.length - 1]] - SEVERITY[trail[0]];
    factors.push({
      label: `Fell ${trail[0]} → ${trail[trail.length - 1]}`,
      points: drop * WEIGHT.decline,
    });
  }

  if (row.lifecycleStage === 'Pilot') {
    factors.push({ label: 'Still in pilot', points: WEIGHT.pilot });
  }

  factors.sort((a, b) => b.points - a.points);
  const score = factors.reduce((sum, f) => sum + f.points, 0);

  return { row, score, factors, daysToRenewal: days, pulseGap, direction, trail };
}

/**
 * Score and rank a book of accounts, worst first.
 *
 * Ties break on account name so the order is stable between renders — without
 * it, equal-scoring rows reshuffle on every filter change and the list is
 * impossible to read down.
 */
export function triage(rows: HealthDataRow[], now: Date = new Date()): TriageRow[] {
  return rows
    .map((row) => scoreRow(row, now))
    .sort((a, b) => b.score - a.score || a.row.account.localeCompare(b.row.account));
}

export interface TriageSummary {
  total: number;
  /** Accounts at or above ACTION_THRESHOLD. */
  needsAction: number;
  /** Of those, how many also renew inside RENEWAL_URGENT_DAYS. */
  needsActionRenewingSoon: number;
  /** Accounts whose history ends worse than it started. */
  declining: number;
  /** Accounts where the AI reads 2+ points colder than the CSM. */
  blindSpots: number;
  atGood: number;
  /** Accounts that were Good in the month before the latest one, for a
   *  month-on-month read. Null when no account carries two months of history. */
  atGoodPreviousMonth: number | null;
}

export interface TriageDrillSets {
  /** Accounts at or above ACTION_THRESHOLD — behind the "Needs action now" tile. */
  needsAction: TriageRow[];
  /** Accounts whose history ends worse than it started — behind "Declining". */
  declining: TriageRow[];
  /** Accounts currently at Good — behind "Book at Good". */
  atGood: TriageRow[];
}

/**
 * The three account sets behind Triage's headline figures.
 *
 * `summarise`'s counts and the Triage tiles' drills both read this — one
 * predicate per figure, defined once, so a tile's number and the accounts a
 * click on it opens can never quietly diverge (they used to be two separate
 * `scored.filter(...)` calls, one in this file and one in `TriageTiles.tsx`).
 */
export function triageDrillSets(scored: TriageRow[]): TriageDrillSets {
  return {
    needsAction: scored.filter((t) => t.score >= ACTION_THRESHOLD),
    declining: scored.filter((t) => t.direction === 'declining'),
    atGood: scored.filter((t) => t.row.healthStatus === 'Good'),
  };
}

export function summarise(scored: TriageRow[]): TriageSummary {
  const withTwoMonths = scored.filter((t) => t.trail.length >= 2);
  const { needsAction, declining, atGood } = triageDrillSets(scored);

  return {
    total: scored.length,
    atGoodPreviousMonth: withTwoMonths.length
      ? withTwoMonths.filter((t) => t.trail[t.trail.length - 2] === 'Good').length
      : null,
    needsAction: needsAction.length,
    needsActionRenewingSoon: needsAction.filter(
      (t) => t.daysToRenewal !== null && t.daysToRenewal <= RENEWAL_URGENT_DAYS,
    ).length,
    declining: declining.length,
    blindSpots: scored.filter((t) => t.pulseGap !== null && t.pulseGap >= 2).length,
    atGood: atGood.length,
  };
}
