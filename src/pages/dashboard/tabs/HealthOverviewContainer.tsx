import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppDispatch } from '../../../hooks';
import { clearHealthFilters, setHealthFilter } from '../../../features/health/healthSlice';
import { DashboardToolbar } from '../shared/DashboardToolbar';
import { SHARED_KEYS, useDashboardFilters } from '../shared/useDashboardFilters';
import { useSubViews } from '../useSubViews';
import type { FilterOption } from './health-overview/useHealthOverview';
import { useHealthOverview } from './health-overview/useHealthOverview';

/** "All" plus one entry per option, each carrying its own count — picking an
 *  owner with two accounts and one with forty are different decisions, and
 *  the dropdown is where that is worth knowing. */
const choices = (options: FilterOption[]) => [
  { value: '', label: 'All' },
  ...options.map((option) => ({
    value: option.key,
    label: `${option.name} (${option.count})`,
  })),
];

/**
 * Health's five real views (Triage, Divergence, Movement, Renewals,
 * Distribution) share one book and one filter bar. The URL is the only
 * source of truth for the bar's three filters — `DashboardToolbar` reads
 * and writes it — and this container mirrors it into `state.health` on every
 * change, because the views and their tests already read filters from Redux.
 * URL `customer` is Redux `account`: both are a customer id.
 */
export function HealthOverviewContainer() {
  const dispatch = useAppDispatch();
  const subViews = useSubViews();
  const { values } = useDashboardFilters(SHARED_KEYS);
  const { owners, lifecycles, accounts, rows, totalCount } = useHealthOverview();

  useEffect(() => {
    dispatch(setHealthFilter({ key: 'owner', value: values.owner || null }));
    dispatch(setHealthFilter({ key: 'lifecycle', value: values.lifecycle || null }));
    dispatch(setHealthFilter({ key: 'account', value: values.customer || null }));
  }, [dispatch, values.owner, values.lifecycle, values.customer]);

  // The URL stays the only source of truth: without this, leaving Health
  // would leave a stale filter sitting in Redux, narrowing whatever reads
  // `state.health.filters` next even though no URL says so any more.
  useEffect(() => {
    return () => {
      dispatch(clearHealthFilters());
    };
  }, [dispatch]);

  return (
    <div className="flex flex-col h-full w-full">
      <DashboardToolbar
        subViews={subViews}
        count={`${rows.length} of ${totalCount} accounts`}
        filters={[
          { key: 'owner', label: 'Primary Owner', options: choices(owners) },
          { key: 'lifecycle', label: 'Lifecycle Stage', options: choices(lifecycles) },
          { key: 'customer', label: 'Account', options: choices(accounts) },
        ]}
      />
      <div className="flex-1 w-full h-full">
        <Outlet />
      </div>
    </div>
  );
}
