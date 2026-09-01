import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MetricsPanel } from '../../components/organizations/MetricsPanel';
import { ActionBar } from '../../components/organizations/ActionBar';
import { OrganizationsTable } from '../../components/organizations/OrganizationsTable';
import { fetchCustomers } from '../../features/customers/customersSlice';
import { mapCustomerToOrgRow } from '../../features/customers/mapToOrgRow';
import type { AppDispatch, RootState } from '../../store';

export function List() {
  const dispatch = useDispatch<AppDispatch>();
  const { customers, count, next, previous, isLoading, error } = useSelector(
    (state: RootState) => state.customers
  );
  // Index (0-based) of the first row in the currently-loaded page, for the
  // "Showing X-Y of Z" footer. Tracked from how many rows each fetched page
  // actually contained — not a hardcoded page-size assumption, which would
  // silently drift if the backend's PAGE_SIZE ever changed or a page came
  // back short (e.g. the last one).
  const [offset, setOffset] = useState(0);

  // Search box state: `searchQuery` is what the input shows; `debouncedSearch`
  // is what actually drives the fetch, updated 300ms after typing stops so a
  // request isn't fired per keystroke.
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    const url = debouncedSearch ? `/customers/?search=${encodeURIComponent(debouncedSearch)}` : undefined;
    dispatch(fetchCustomers(url))
      .unwrap()
      .then(() => {
        // Guards against a slower, now-stale request (e.g. an earlier
        // keystroke's fetch) resetting the offset after a newer one already
        // has — this effect re-runs on every debouncedSearch change.
        if (!cancelled) setOffset(0);
      })
      .catch(() => {
        // Failure is already surfaced via redux `error` state into the table.
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, debouncedSearch]);

  const rows = useMemo(() => customers.map(mapCustomerToOrgRow), [customers]);

  const handleNext = async () => {
    if (!next) return;
    const currentPageSize = customers.length;
    try {
      await dispatch(fetchCustomers(next)).unwrap();
      setOffset((o) => o + currentPageSize);
    } catch {
      // Failure is already surfaced via redux `error` state into the table.
    }
  };

  const handlePrevious = async () => {
    if (!previous) return;
    try {
      const result = await dispatch(fetchCustomers(previous)).unwrap();
      setOffset((o) => o - result.results.length);
    } catch {
      // Failure is already surfaced via redux `error` state into the table.
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-surface text-ink">
      {/* Glass Metrics Banner */}
      <div className="px-6 pt-5 pb-4">
        <MetricsPanel />
      </div>

      {/* Search and Table Area */}
      <div className="flex flex-col flex-1 overflow-hidden px-6">
        <ActionBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <div className="flex-1 overflow-hidden mt-3 relative">
          <OrganizationsTable
            rows={rows}
            isLoading={isLoading}
            error={error}
            offset={offset}
            count={count}
            hasNext={next !== null}
            hasPrevious={previous !== null}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        </div>
      </div>
    </div>
  );
}
