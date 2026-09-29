import { useCallback, useRef, useState } from 'react';
import { useAppDispatch } from '../../../hooks';
import { LIFECYCLE_LABELS } from '../../../features/customers/formatters';
import type { LifecycleValue, PortfolioRow, PortfolioRowBase } from '../../../features/organizations/portfolioTypes';
import type { BoardMove } from './boardMove';
import { usePortfolioKind } from './portfolioKind';

export interface BoardMoveState<R extends PortfolioRowBase = PortfolioRow> {
  /** The current move. It shows at once, is marked `saved` when the save
   *  succeeds, and stays until the board reports that every reload it
   *  triggered has landed (`settle`), so a column that remounts later never
   *  replays it. Null after a failure, so the card goes back. */
  move: BoardMove<R> | null;
  /** The save is in flight. */
  saving: boolean;
  /** A move is saving or settling. Moving is off until it clears: one at a
   *  time, so a second move can't drop the first card's guess before its
   *  fresh pages land. */
  busy: boolean;
  /** "Moved Pizza Hut to Adoption.", for a polite live region. */
  notice: string | null;
  /** The failure, ending with the server's reason. */
  error: string | null;
  moveTo: (row: R, to: LifecycleValue) => void;
  dismissError: () => void;
  /** The move `token`'s reloads have all landed: forget it. */
  settle: (token: number) => void;
  /** Forget the move whatever it is (a different list landed). */
  reset: () => void;
}

/** Moving one record between lifecycle columns (owner decisions
 *  2026-09-26). The move is optimistic and one at a time. It saves through
 *  the kind's single-record update (`kind.saveStage`: the customer PATCH on
 *  Organizations, which applies the archive gate, the inactive-owner rule
 *  and every other update rule; the account PATCH on Accounts), and it rolls
 *  back with the server's reason. A kind whose churn has its own form
 *  (Organizations) never saves Churn from here: the row goes to `onChurn`,
 *  whose ChurnOrganizationModal records the date and reason. */
export function useBoardMove<R extends PortfolioRowBase = PortfolioRow>({
  onSaved,
  onChurn,
}: {
  onSaved: (move: BoardMove<R>) => void;
  onChurn?: (row: R) => void;
}): BoardMoveState<R> {
  const dispatch = useAppDispatch();
  const kind = usePortfolioKind();
  const [move, setMove] = useState<BoardMove<R> | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef(0);

  const moveTo = useCallback(
    (row: R, to: LifecycleValue) => {
      const from = row.lifecycle.value;
      if (to === from || saving || move !== null) return;
      setError(null);
      setNotice(null);
      if (to === 'churn' && kind.churnByModal && onChurn) {
        onChurn(row);
        return;
      }
      tokenRef.current += 1;
      const next: BoardMove<R> = { token: tokenRef.current, row, from, to };
      setMove(next);
      setSaving(true);
      kind
        .saveStage(row, to, dispatch)
        .then(
          () => {
            // Guarded by token only because a list change may have reset
            // the move meanwhile; a second move can't start while this one
            // is saving or settling.
            setMove((current) => (current?.token === next.token ? { ...current, saved: true } : current));
            setNotice(`Moved ${row.name} to ${LIFECYCLE_LABELS[to]}.`);
            onSaved(next);
          },
          (reason: unknown) => {
            setMove((current) => (current?.token === next.token ? null : current));
            const why = typeof reason === 'string' ? reason : `Could not update ${kind.noun.one}.`;
            setError(`Couldn't move ${row.name} to ${LIFECYCLE_LABELS[to]}. ${why}`);
          },
        )
        .finally(() => setSaving(false));
    },
    [dispatch, kind, move, onChurn, onSaved, saving],
  );

  const dismissError = useCallback(() => setError(null), []);
  const settle = useCallback((token: number) => setMove((current) => (current?.token === token ? null : current)), []);
  const reset = useCallback(() => setMove(null), []);

  return { move, saving, busy: saving || move !== null, notice, error, moveTo, dismissError, settle, reset };
}
