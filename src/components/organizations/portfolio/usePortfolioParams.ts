import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EMPTY_FILTERS, parseParams, toUrlSearch, type PortfolioParams } from '../../../features/organizations/portfolioParams';

/** The portfolio's URL state. Updates replace the history entry, like the
 *  dashboard's filters, so Back leaves the page rather than undoing a chip. */
export function usePortfolioParams() {
  const [search, setSearch] = useSearchParams();
  const params = useMemo(() => parseParams(search), [search]);

  const update = useCallback(
    (patch: Partial<PortfolioParams>) => {
      setSearch((prev) => toUrlSearch({ ...parseParams(prev), ...patch }), { replace: true });
    },
    [setSearch],
  );

  const clearFilters = useCallback(() => update(EMPTY_FILTERS), [update]);

  return { params, update, clearFilters };
}
