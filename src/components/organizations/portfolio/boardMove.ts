import { useState } from 'react';
import { LIFECYCLE_LABELS } from '../../../features/customers/formatters';
import { LIFECYCLE_VALUES } from '../../../features/organizations/portfolioParams';
import type {
  GroupKey,
  LifecycleValue,
  PortfolioGroup,
  PortfolioRow,
  PortfolioRowBase,
} from '../../../features/organizations/portfolioTypes';

/** One account moving between lifecycle columns. `token` is unique per
 *  move, so an overlay can tell a new move from one it has already seen. */
export interface BoardMove<R extends PortfolioRowBase = PortfolioRow> {
  token: number;
  row: R;
  from: LifecycleValue;
  to: LifecycleValue;
  /** The PATCH has succeeded; the move now waits for its reloads to land. */
  saved?: boolean;
}

export interface BoardColumnSpec {
  /** The group key: the column's `group_value`. */
  key: string;
  label: string;
  count: number;
  arr: number;
  /** The Churn column while churned accounts are hidden: a drop target
   *  with no cards, no count and no read. */
  dropOnly: boolean;
}

/** The Board's columns. Grouped by lifecycle, every stage gets a column
 *  in stage order, empty ones included, so there is always somewhere to
 *  drop (`groups` lists only non-empty groups, so the count and ARR default
 *  to 0 and the label comes from LIFECYCLE_LABELS). Any other grouping shows
 *  the server's groups as they are. */
export function boardColumns(group: GroupKey, groups: PortfolioGroup[], churnVisible: boolean): BoardColumnSpec[] {
  if (group !== 'lifecycle') {
    return groups.map((g) => ({ key: g.key, label: g.label, count: g.count, arr: g.arr, dropOnly: false }));
  }
  return LIFECYCLE_VALUES.map((value) => {
    const found = groups.find((g) => g.key === value);
    const dropOnly = value === 'churn' && !churnVisible;
    return {
      key: value,
      label: found?.label ?? LIFECYCLE_LABELS[value],
      count: dropOnly ? 0 : (found?.count ?? 0),
      arr: dropOnly ? 0 : (found?.arr ?? 0),
      dropOnly,
    };
  });
}

/** A column header's figures with a move applied: one account (and its
 *  ARR) out of `from`, into `to`. */
export function withMove(spec: BoardColumnSpec, move: BoardMove<PortfolioRowBase> | null): BoardColumnSpec {
  if (!move || spec.dropOnly) return spec;
  const arr = move.row.arr ?? 0;
  if (spec.key === move.from) return { ...spec, count: Math.max(0, spec.count - 1), arr: spec.arr - arr };
  if (spec.key === move.to) return { ...spec, count: spec.count + 1, arr: spec.arr + arr };
  return spec;
}

/** A column's cards with a move applied: the moved card leaves every column
 *  but its new one, where it sits on top, once, showing its new stage. */
export function withMovedRow<R extends PortfolioRowBase>(rows: R[], key: string, move: BoardMove<R> | null): R[] {
  if (!move) return rows;
  const others = rows.filter((row) => row.id !== move.row.id);
  if (key !== move.to) return others;
  return [{ ...move.row, lifecycle: { value: move.to, label: LIFECYCLE_LABELS[move.to] } }, ...others];
}

/** Whether a read (the frame, or one column) should still show the move
 *  `token`. It notes the read's `loadedKey` when a move first appears, and it
 *  shows the move until that key changes, which happens only when a fresh
 *  page one lands (a `loadMore` append leaves it alone). So after a save
 *  bumps the reads, each one's own answer replaces the guess exactly when it
 *  arrives, with no flicker back. Adjusted during render, not in an effect. */
export function useOverlayActive(token: number | null, loadedKey: string | null): boolean {
  const [seen, setSeen] = useState<{ token: number; key: string | null } | null>(null);
  if (token === null) return false;
  if (seen?.token !== token) {
    setSeen({ token, key: loadedKey });
    return true;
  }
  return seen.key === loadedKey;
}
