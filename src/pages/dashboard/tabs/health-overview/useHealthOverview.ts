import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { fetchHealthOverview } from '../../../../features/health/healthSlice';
import { UNASSIGNED_KEY, UNASSIGNED_LABEL } from '../../../../features/health/toHealthDataRow';
import type { HealthDataRow } from '../../../../features/health/types';

export interface OwnerOption {
  /** `HealthDataRow.ownerKey` — an owner id, or 'unassigned'. */
  key: string;
  name: string;
  count: number;
}

/**
 * Every owner in the book, with how many accounts each holds.
 *
 * Derived from the loaded rows rather than fetched: the filter can only
 * usefully offer owners who actually hold something here, and a CSM with an
 * empty book would otherwise sit in the dropdown returning nothing.
 *
 * Unassigned sorts last however many accounts it holds — it isn't a person,
 * and a book with a lot of unowned accounts shouldn't push the actual owners
 * down the list.
 */
export function ownerOptions(rows: HealthDataRow[]): OwnerOption[] {
  const byKey = new Map<string, OwnerOption>();

  for (const row of rows) {
    const existing = byKey.get(row.ownerKey);
    if (existing) {
      existing.count += 1;
    } else {
      byKey.set(row.ownerKey, { key: row.ownerKey, name: row.owner, count: 1 });
    }
  }

  return [...byKey.values()].sort((a, b) => {
    if (a.key === UNASSIGNED_KEY) return 1;
    if (b.key === UNASSIGNED_KEY) return -1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * The Health Overview's shared data, fetched once for all five tabs.
 *
 * Each tab calls this; the fetch only runs when there is nothing loaded and
 * nothing already in flight, so switching between Triage, Divergence, Movement,
 * Renewal Date and Controls re-reads the same rows instead of re-fetching the
 * book.
 *
 * **The Primary Owner filter is applied here, not in the tabs.** All five read
 * their rows through this hook, so filtering in one place is the only version
 * of this that can't have a tab quietly ignoring the chip above it. `rows` is
 * always what the caller should render; `totalCount` is the unfiltered book, so
 * a tab can say what it is showing a part of.
 */
export function useHealthOverview() {
  const dispatch = useAppDispatch();
  const { rows, isLoading, error, truncated, loadedAt, currency, unconvertedCount, ownerFilter } =
    useAppSelector((state) => state.health);

  useEffect(() => {
    if (loadedAt === null && !isLoading) {
      dispatch(fetchHealthOverview());
    }
  }, [dispatch, loadedAt, isLoading]);

  const visible = useMemo(
    () => (ownerFilter === null ? rows : rows.filter((row) => row.ownerKey === ownerFilter)),
    [rows, ownerFilter]
  );

  const owners = useMemo(() => ownerOptions(rows), [rows]);

  return {
    rows: visible,
    error,
    truncated,
    /** For the Renewal tab's money totals — see the slice's own notes. */
    currency,
    unconvertedCount,
    /** True only on the first load — a refresh keeps the old rows on screen. */
    isInitialLoad: isLoading && loadedAt === null,
    hasLoaded: loadedAt !== null,
    /** The filter bar's own state and options, so it needs no second source. */
    ownerFilter,
    owners,
    /** The whole book, before the owner filter. */
    totalCount: rows.length,
    /** The owner's name when one is selected, for anything that wants to say
     *  whose book is on screen. */
    ownerName:
      ownerFilter === null
        ? null
        : (owners.find((owner) => owner.key === ownerFilter)?.name ?? UNASSIGNED_LABEL),
  };
}
