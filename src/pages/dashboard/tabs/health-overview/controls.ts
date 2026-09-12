import type { HealthDataRow, HealthStatus } from '../../../../features/health/types';

/** One owner's book, counted by health band. */
export interface OwnerHealth {
  owner: string;
  Poor: number;
  Average: number;
  Good: number;
  total: number;
}

/** Stacked worst-first, so the red always sits against the axis and the red
 *  lengths can be compared without hunting for them. */
export const HEALTH_ORDER: HealthStatus[] = ['Poor', 'Average', 'Good'];

/**
 * Each owner's book, counted by health band, worst book first.
 *
 * **Counts, not percentages.** The chart this feeds used to divide each
 * owner's rows by their share of a fixed book, which made an owner with one
 * poor account out of one look exactly like an owner with one poor account out
 * of twenty — and only the second needs help, while the first needs a
 * conversation. Counts carry the size of the book and how much of it is sick
 * in the same bar.
 *
 * Owners come from the rows handed in, so a filtered view lists exactly the
 * owners in it. Order: most poor accounts, then most average, then biggest
 * book — the owner who needs help is the first bar.
 */
export function healthByOwner(rows: HealthDataRow[]): OwnerHealth[] {
  const byOwner = new Map<string, OwnerHealth>();

  for (const row of rows) {
    let entry = byOwner.get(row.owner);
    if (!entry) {
      entry = { owner: row.owner, Poor: 0, Average: 0, Good: 0, total: 0 };
      byOwner.set(row.owner, entry);
    }
    entry[row.healthStatus] += 1;
    entry.total += 1;
  }

  return [...byOwner.values()].sort(
    (a, b) => b.Poor - a.Poor || b.Average - a.Average || b.total - a.total || a.owner.localeCompare(b.owner),
  );
}
