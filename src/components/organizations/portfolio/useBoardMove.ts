import { useCallback, useRef, useState } from 'react';
import { useAppDispatch } from '../../../hooks';
import { updateCustomer } from '../../../features/customers/customersSlice';
import { LIFECYCLE_LABELS } from '../../../features/customers/formatters';
import type { LifecycleValue, PortfolioRow } from '../../../features/organizations/portfolioTypes';
import type { BoardMove } from './boardMove';

export interface BoardMoveState {
  /** The current move. It shows at once, is marked `saved` when the PATCH
   *  succeeds, and stays until the board reports that every reload it
   *  triggered has landed (`settle`), so a column that remounts later never
   *  replays it. Null after a failure, so the card goes back. */
  move: BoardMove | null;
  /** The PATCH is in flight. */
  saving: boolean;
  /** A move is saving or settling. Moving is off until it clears: one at a
   *  time, so a second move can't drop the first card's guess before its
   *  fresh pages land. */
  busy: boolean;
  /** "Moved Pizza Hut to Adoption.", for a polite live region. */
  notice: string | null;
  /** The failure, ending with the server's reason. */
  error: string | null;
  moveTo: (row: PortfolioRow, to: LifecycleValue) => void;
  dismissError: () => void;
  /** The move `token`'s reloads have all landed: forget it. */
  settle: (token: number) => void;
  /** Forget the move whatever it is (a different list landed). */
  reset: () => void;
}

/** Moving one account between lifecycle columns (owner decisions
 *  2026-09-26). The move is optimistic and one at a time. It saves through
 *  the single-customer PATCH, which applies the archive gate, the
 *  inactive-owner rule and every other update rule, and it rolls back with
 *  the server's reason. Churn is never PATCHed from here: the row goes to
 *  `onChurn`, whose ChurnOrganizationModal records the date and reason. */
export function useBoardMove({
  onSaved,
  onChurn,
}: {
  onSaved: (move: BoardMove) => void;
  onChurn: (row: PortfolioRow) => void;
}): BoardMoveState {
  const dispatch = useAppDispatch();
  const [move, setMove] = useState<BoardMove | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef(0);

  const moveTo = useCallback(
    (row: PortfolioRow, to: LifecycleValue) => {
      const from = row.lifecycle.value;
      if (to === from || saving || move !== null) return;
      setError(null);
      setNotice(null);
      if (to === 'churn') {
        onChurn(row);
        return;
      }
      tokenRef.current += 1;
      const next: BoardMove = { token: tokenRef.current, row, from, to };
      setMove(next);
      setSaving(true);
      dispatch(updateCustomer({ id: row.id, lifecycle_stage: to }))
        .unwrap()
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
            const why = typeof reason === 'string' ? reason : 'Could not update organization.';
            setError(`Couldn't move ${row.name} to ${LIFECYCLE_LABELS[to]}. ${why}`);
          },
        )
        .finally(() => setSaving(false));
    },
    [dispatch, move, onChurn, onSaved, saving],
  );

  const dismissError = useCallback(() => setError(null), []);
  const settle = useCallback((token: number) => setMove((current) => (current?.token === token ? null : current)), []);
  const reset = useCallback(() => setMove(null), []);

  return { move, saving, busy: saving || move !== null, notice, error, moveTo, dismissError, settle, reset };
}
