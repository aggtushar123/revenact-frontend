import { useCallback, useEffect, useState } from 'react';
import { toApiQuery, type PortfolioParams } from '../../../features/organizations/portfolioParams';
import type {
  FilterOptions,
  OrganizationFilters,
  PortfolioPage,
  PortfolioRow,
  PortfolioRowBase,
} from '../../../features/organizations/portfolioTypes';
import { usePortfolioKind } from './portfolioKind';
import { usePagedRead, type PagedRead } from './usePagedRead';

export { errorMessage } from './usePagedRead';

export const PAGE_SIZE = 50;
export const SECTION_PAGE_SIZE = 25;

export type PagedState<R extends PortfolioRowBase = PortfolioRow, F extends FilterOptions = OrganizationFilters> = PagedRead<
  R,
  PortfolioPage<R, F>
>;

/** One cursor-paged read of the kind's portfolio endpoint (`kind.fetch`):
 *  `usePagedRead` with the kind's reader and noun. */
export function usePagedPortfolio<R extends PortfolioRowBase = PortfolioRow, F extends FilterOptions = OrganizationFilters>(
  query: string,
  enabled: boolean,
  version: number,
  onLoaded?: (rows: R[]) => void,
): PagedState<R, F> {
  const kind = usePortfolioKind();
  const read = useCallback((q: string) => kind.fetch(q) as Promise<PortfolioPage<R, F>>, [kind]);
  return usePagedRead<R, PortfolioPage<R, F>>(read, kind.noun, query, enabled, version, onLoaded);
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
