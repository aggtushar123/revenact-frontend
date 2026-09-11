import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { fetchHealthOverview } from '../../../../features/health/healthSlice';

/**
 * The Health Overview's shared data, fetched once for all four tabs.
 *
 * Each tab calls this; the fetch only runs when there is nothing loaded and
 * nothing already in flight, so switching between Triage, Divergence, Movement
 * and Controls re-reads the same rows instead of re-fetching the book.
 */
export function useHealthOverview() {
  const dispatch = useAppDispatch();
  const { rows, isLoading, error, truncated, loadedAt } = useAppSelector((state) => state.health);

  useEffect(() => {
    if (loadedAt === null && !isLoading) {
      dispatch(fetchHealthOverview());
    }
  }, [dispatch, loadedAt, isLoading]);

  return {
    rows,
    error,
    truncated,
    /** True only on the first load — a refresh keeps the old rows on screen. */
    isInitialLoad: isLoading && loadedAt === null,
    hasLoaded: loadedAt !== null,
  };
}
