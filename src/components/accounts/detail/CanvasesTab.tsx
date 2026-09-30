import { useLayoutEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { fetchCanvasesForAccount } from '../../../features/customers/customersSlice';
import { CanvasListTab } from '../../shared/CanvasListTab';

/** Canvases on the account page: read through GET /accounts/<id>/canvases/
 *  (backend #75) into the store's canvas list, which edits and deletes
 *  anywhere patch. Read before paint, so another page's canvases never show. */
export function CanvasesTab({ accountId }: { accountId: number }) {
  const dispatch = useAppDispatch();
  const { entityCanvases, entityCanvasesLoading, entityCanvasesError } = useAppSelector((state) => state.customers);
  const [attempt, setAttempt] = useState(0);

  useLayoutEffect(() => {
    void dispatch(fetchCanvasesForAccount({ accountId }));
  }, [dispatch, accountId, attempt]);

  return (
    <CanvasListTab
      canvases={entityCanvases}
      isLoading={entityCanvasesLoading}
      error={entityCanvasesError}
      accountId={accountId}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}
