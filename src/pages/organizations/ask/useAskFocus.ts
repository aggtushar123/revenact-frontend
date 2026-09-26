import { useEffect } from 'react';
import { useAsk } from '../../dashboard/ask/useAsk';

/** Opening an account (a List row, a Board card's side panel or sheet)
 *  narrows the next question to it (spec §3), as a dashboard drill does: for
 *  one question, dropped by the send, the chip's × or a filter change.
 *  Closing the account keeps it; opening another replaces it. Nothing
 *  happens outside an Ask provider. */
export function useAskFocusOnOpen(openId: number | null): void {
  const focusOn = useAsk()?.focusOn;
  useEffect(() => {
    if (openId !== null) focusOn?.({ kind: 'companies', ids: [openId] });
  }, [openId, focusOn]);
}
