import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../lib/apiClient';
import { toApiQuery, type PortfolioParams } from '../../../features/organizations/portfolioParams';
import type {
  FilterOptions,
  OrganizationFilters,
  PortfolioPage,
  PortfolioRow,
  PortfolioRowBase,
} from '../../../features/organizations/portfolioTypes';
import { usePortfolioKind } from './portfolioKind';

export const PAGE_SIZE = 50;
export const SECTION_PAGE_SIZE = 25;

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

type Loaded<R extends PortfolioRowBase, F extends FilterOptions> =
  | { key: string; query: string; data: PortfolioPage<R, F>; rows: R[]; next: string | null }
  | { key: string; error: string };

type MoreState = { key: string; token: number; loading: boolean; error: string | null };

export interface PagedState<R extends PortfolioRowBase = PortfolioRow, F extends FilterOptions = OrganizationFilters> {
  /** The latest response. While a new query loads, the previous one stays so
   *  the list does not flash empty. `loading` says it is stale. */
  data: PortfolioPage<R, F> | null;
  rows: R[];
  next: string | null;
  loading: boolean;
  error: string | null;
  loadingMore: boolean;
  moreError: string | null;
  loadMore: () => Promise<void>;
  retry: () => void;
  /** The key of the data currently shown (null before any page has landed).
   *  Unlike `rows`, it does not change on a `loadMore` append — only when a
   *  fresh page one lands, including a reload of the same query. */
  loadedKey: string | null;
  /** The query of the data currently shown (null before any page has
   *  landed). Unlike `loadedKey` it ignores the version and retry counters,
   *  so a reload of the same query leaves it unchanged: the signal for
   *  "a different list landed" (the page clears or prunes the selection on it). */
  loadedQuery: string | null;
}

/** One cursor-paged read of the kind's portfolio endpoint (`kind.fetch`).
 *  The frame, each grouped section and each board column is one of these.
 *  Loading is derived from which query the stored answer belongs to, so no
 *  state is set synchronously inside the effect. */
export function usePagedPortfolio<R extends PortfolioRowBase = PortfolioRow, F extends FilterOptions = OrganizationFilters>(
  query: string,
  enabled: boolean,
  version: number,
  onLoaded?: (rows: R[]) => void,
): PagedState<R, F> {
  const kind = usePortfolioKind();
  const [attempt, setAttempt] = useState(0);
  const key = `${query}#${version}#${attempt}`;
  const [loaded, setLoaded] = useState<Loaded<R, F> | null>(null);
  const [moreState, setMoreState] = useState<MoreState | null>(null);
  // A generation counter, bumped every time the fetch effect's cleanup runs
  // (a params/version change, or unmount) — never reset, so it never repeats.
  // The `key` string, by contrast, CAN repeat (a filter changed away and back
  // reproduces the same string) — guarding a `loadMore` by key alone lets an
  // answer abandoned under the first occurrence of that key be mistaken for
  // current when the key recurs (an ABA race). `loadMoreCallRef` holds the
  // generation a `loadMore` call was issued under, or null when none is in
  // flight: a second concurrent call sees it already set and backs off, and
  // a call whose generation no longer matches `generationRef` knows its
  // answer is stale and drops it — never appended, never surfaced as an
  // error, and never able to clear a different (later) call's own guard.
  const generationRef = useRef(0);
  const loadMoreCallRef = useRef<number | null>(null);
  // The latest callback, so a caller passing an inline function does not
  // refetch on every render.
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (kind.fetch(query) as Promise<PortfolioPage<R, F>>).then(
      (data) => {
        if (cancelled) return;
        setLoaded({ key, query, data, rows: data.results, next: data.next_cursor });
        onLoadedRef.current?.(data.results);
      },
      (err: unknown) => {
        if (!cancelled) setLoaded({ key, error: errorMessage(err, `Could not load ${kind.noun.many}.`) });
      },
    );
    return () => {
      cancelled = true;
      generationRef.current += 1;
      loadMoreCallRef.current = null;
      // Any in-flight (or just-finished) load-more belonged to the
      // generation that's ending — its answer, whenever it lands, is
      // dropped anyway (below), but the spinner must not wait for that to
      // clear it: nothing about the new generation has asked for a page two
      // yet.
      setMoreState(null);
    };
  }, [enabled, key, query, kind]);

  const current = loaded && 'data' in loaded ? loaded : null;

  const loadMore = useCallback(async () => {
    if (!current || current.key !== key || !current.next || loadMoreCallRef.current !== null) return;
    const token = generationRef.current;
    loadMoreCallRef.current = token;
    const cursor = current.next;
    setMoreState({ key, token, loading: true, error: null });
    try {
      const page = (await kind.fetch(`${query}&cursor=${encodeURIComponent(cursor)}`)) as PortfolioPage<R, F>;
      if (generationRef.current !== token) {
        // Superseded — drop the answer. Never clear a newer call's own
        // moreState; only clear if it's still (somehow) this stale one's.
        setMoreState((prev) => (prev && prev.token === token ? null : prev));
        return;
      }
      setLoaded((prev) =>
        prev && 'data' in prev && prev.key === key
          ? { ...prev, rows: [...prev.rows, ...page.results], next: page.next_cursor }
          : prev,
      );
      onLoadedRef.current?.(page.results);
      setMoreState({ key, token, loading: false, error: null });
    } catch (err) {
      if (generationRef.current !== token) {
        // Superseded — never surface a stale error.
        setMoreState((prev) => (prev && prev.token === token ? null : prev));
        return;
      }
      setMoreState({ key, token, loading: false, error: errorMessage(err, `Could not load more ${kind.noun.many}.`) });
    } finally {
      if (loadMoreCallRef.current === token) loadMoreCallRef.current = null;
    }
  }, [current, key, query, kind]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    data: current?.data ?? null,
    rows: current?.rows ?? [],
    next: current?.next ?? null,
    loading: enabled && loaded?.key !== key,
    error: loaded && 'error' in loaded && loaded.key === key ? loaded.error : null,
    loadingMore: moreState?.key === key ? moreState.loading : false,
    moreError: moreState?.key === key ? moreState.error : null,
    loadMore,
    retry,
    loadedKey: current?.key ?? null,
    loadedQuery: current?.query ?? null,
  };
}

export interface PortfolioState<R extends PortfolioRowBase = PortfolioRow, F extends FilterOptions = OrganizationFilters>
  extends PagedState<R, F> {
  /** M in "N of M": the whole visible book, in the view's scope (the kind's
   *  `totalQuery`). Null when no filter is active (the page then says
   *  "N organizations"). Never less than N (the frame's own filtered count)
   *  even if the probe's answer is momentarily stale. */
  total: number | null;
}

/** `totalVersion` reloads the M probe (default: `version`). The Board passes
 *  a smaller one that skips its lifecycle moves, which can't change M. */
export function usePortfolio<R extends PortfolioRowBase = PortfolioRow, F extends FilterOptions = OrganizationFilters>(
  params: PortfolioParams,
  version: number,
  onLoaded?: (rows: R[]) => void,
  totalVersion: number = version,
): PortfolioState<R, F> {
  const kind = usePortfolioKind();
  const grouped = params.group !== '';
  // Grouped, the frame only needs summary, groups, filters, count and
  // currency; each section reads its own rows (plan pre-flight #6). Its own
  // limit=1 read is never paged from here — grouped paging happens per
  // section — so `next`/`loadMore` are suppressed below regardless of what
  // the frame response implies.
  const frame = usePagedPortfolio<R, F>(
    toApiQuery(params, { limit: String(grouped ? 1 : PAGE_SIZE) }),
    true,
    version,
    grouped ? undefined : onLoaded,
  );
  const noopLoadMore = useCallback(async () => {}, []);

  const probeQuery = kind.totalQuery(params);
  const probeKey = probeQuery ? `${probeQuery}#${totalVersion}` : null;
  const [probe, setProbe] = useState<{ key: string; count: number } | null>(null);

  useEffect(() => {
    if (!probeQuery || !probeKey) return;
    let cancelled = false;
    kind.fetch(probeQuery).then(
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
  }, [probeQuery, probeKey, kind]);

  const rawTotal = probeKey && probe?.key === probeKey ? probe.count : null;

  return {
    ...frame,
    rows: grouped ? [] : frame.rows,
    next: grouped ? null : frame.next,
    loadMore: grouped ? noopLoadMore : frame.loadMore,
    total: rawTotal === null ? null : Math.max(rawTotal, frame.data?.count ?? 0),
  };
}
