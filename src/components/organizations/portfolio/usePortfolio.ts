import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../lib/apiClient';
import { fetchPortfolio } from '../../../features/organizations/portfolioApi';
import { hasFilters, toApiQuery, type PortfolioParams } from '../../../features/organizations/portfolioParams';
import type { PortfolioResponse, PortfolioRow } from '../../../features/organizations/portfolioTypes';

export const PAGE_SIZE = 50;
export const SECTION_PAGE_SIZE = 25;

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

type Loaded =
  | { key: string; data: PortfolioResponse; rows: PortfolioRow[]; next: string | null }
  | { key: string; error: string };

export interface PagedState {
  /** The latest response. While a new query loads, the previous one stays so
   *  the list does not flash empty. `loading` says it is stale. */
  data: PortfolioResponse | null;
  rows: PortfolioRow[];
  next: string | null;
  loading: boolean;
  error: string | null;
  loadingMore: boolean;
  moreError: string | null;
  loadMore: () => Promise<void>;
  retry: () => void;
}

/** One cursor-paged read of the portfolio endpoint. The frame, each grouped
 *  section and (delivery 2) each board column is one of these. Loading is
 *  derived from which query the stored answer belongs to, so no state is
 *  set synchronously inside the effect. */
export function usePagedPortfolio(
  query: string,
  enabled: boolean,
  version: number,
  onLoaded?: (rows: PortfolioRow[]) => void,
): PagedState {
  const [attempt, setAttempt] = useState(0);
  const key = `${query}#${version}#${attempt}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  // The latest callback, so a caller passing an inline function does not
  // refetch on every render.
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchPortfolio(query).then(
      (data) => {
        if (cancelled) return;
        setLoaded({ key, data, rows: data.results, next: data.next_cursor });
        onLoadedRef.current?.(data.results);
      },
      (err: unknown) => {
        if (!cancelled) setLoaded({ key, error: errorMessage(err, 'Could not load organizations.') });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, key, query]);

  const current = loaded && 'data' in loaded ? loaded : null;

  const loadMore = useCallback(async () => {
    if (!current || current.key !== key || !current.next) return;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const page = await fetchPortfolio(`${query}&cursor=${encodeURIComponent(current.next)}`);
      setLoaded((prev) =>
        prev && 'data' in prev && prev.key === key
          ? { ...prev, rows: [...prev.rows, ...page.results], next: page.next_cursor }
          : prev,
      );
      onLoadedRef.current?.(page.results);
    } catch (err) {
      setMoreError(errorMessage(err, 'Could not load more organizations.'));
    } finally {
      setLoadingMore(false);
    }
  }, [current, key, query]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    data: current?.data ?? null,
    rows: current?.rows ?? [],
    next: current?.next ?? null,
    loading: enabled && loaded?.key !== key,
    error: loaded && 'error' in loaded && loaded.key === key ? loaded.error : null,
    loadingMore,
    moreError,
    loadMore,
    retry,
  };
}

export interface PortfolioState extends PagedState {
  /** M in "N of M": the whole visible book, in the view's churn scope.
   *  Null when no filter is active (the page then says "N organizations"). */
  total: number | null;
}

export function usePortfolio(
  params: PortfolioParams,
  version: number,
  onLoaded?: (rows: PortfolioRow[]) => void,
): PortfolioState {
  const grouped = params.group !== '';
  // Grouped, the frame only needs summary, groups, filters, count and
  // currency; each section reads its own rows (plan pre-flight #6).
  const frame = usePagedPortfolio(
    toApiQuery(params, { limit: String(grouped ? 1 : PAGE_SIZE) }),
    true,
    version,
    grouped ? undefined : onLoaded,
  );

  const withChurn = params.include_churned || params.lifecycle.includes('churn') || params.ids.length > 0;
  const probeQuery = hasFilters(params) ? (withChurn ? 'include_churned=1&limit=1' : 'limit=1') : null;
  const probeKey = probeQuery ? `${probeQuery}#${version}` : null;
  const [probe, setProbe] = useState<{ key: string; count: number } | null>(null);

  useEffect(() => {
    if (!probeQuery || !probeKey) return;
    let cancelled = false;
    fetchPortfolio(probeQuery).then(
      (data) => {
        if (!cancelled) setProbe({ key: probeKey, count: data.count });
      },
      () => {
        // M stays unknown; the page says "N organizations" instead of a guess.
      },
    );
    return () => {
      cancelled = true;
    };
  }, [probeQuery, probeKey]);

  return {
    ...frame,
    rows: grouped ? [] : frame.rows,
    total: probeKey && probe?.key === probeKey ? probe.count : null,
  };
}
