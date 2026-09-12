import { useMemo, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAppSelector } from '../../../hooks';
import { FilterSelect } from '../../../components/shared/FilterSelect';
import type { UsageOverviewContext } from './usage-overview/ControlsView';

interface FilterState {
  owner: string;
  lifecycle: string;
  customer: string;
}

const EMPTY: FilterState = { owner: '', lifecycle: '', customer: '' };

/**
 * The Usage Overview shell and its filter bar.
 *
 * Same three filters as the Health bar and the same reasons — owner, lifecycle
 * stage, one account — but applied server-side here, because this screen asks
 * the server for rollups rather than for rows. That difference is the only one:
 * the chips read the same, and the options come back alongside the numbers so
 * the bar needs no fetch of its own and can't offer a company the numbers
 * don't cover.
 */
export function UsageOverviewContainer() {
  const [filters, setFilters] = useState<FilterState>(EMPTY);
  const options = useAppSelector((state) => state.usage.stats?.filters);
  const accounts = useAppSelector((state) => state.usage.stats?.kpis.accounts ?? 0);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.owner) params.set('owner', filters.owner);
    if (filters.lifecycle) params.set('lifecycle', filters.lifecycle);
    if (filters.customer) params.set('customer', filters.customer);
    return params.toString();
  }, [filters]);

  const context: UsageOverviewContext = { query };
  const activeCount = Object.values(filters).filter(Boolean).length;

  const named = (list: { value: string; name: string }[] | undefined, value: string) =>
    list?.find((option) => option.value === value)?.name ?? 'All';

  const choices = (list: { value: string; name: string }[] | undefined) => [
    { value: '', label: 'All' },
    ...(list ?? []).map((option) => ({ value: option.value, label: option.name })),
  ];

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center px-4 bg-surface border-b border-line-subtle shrink-0 overflow-x-auto scrollbar-none shadow-[0_2px_4px_rgba(0,0,0,0.01)] mb-4 rounded-lg">
        <div className="flex items-center min-w-max h-[40px]">
          {/* One view, so this is a label rather than a row of tabs — but it
              stays a NavLink so the tab reads and behaves like its siblings. */}
          <NavLink
            to="controls"
            className={({ isActive }) => `
              h-full flex items-center px-2 text-[12.5px] font-bold transition-all whitespace-nowrap border-b-[2px]
              ${isActive
                ? 'border-accent text-accent bg-accent-dim'
                : 'border-transparent text-ink-muted hover:text-ink hover:bg-subtle'
              }
            `}
          >
            Controls
          </NavLink>

          <div className="w-px h-3.5 mx-2 bg-line" />

          <FilterSelect
            label="Primary Owner"
            value={named(options?.owners, filters.owner)}
            selected={filters.owner}
            onChange={(value) => setFilters((f) => ({ ...f, owner: value }))}
            options={choices(options?.owners)}
          />

          <FilterSelect
            label="Lifecycle Stage"
            value={named(options?.lifecycles, filters.lifecycle)}
            selected={filters.lifecycle}
            onChange={(value) => setFilters((f) => ({ ...f, lifecycle: value }))}
            options={choices(options?.lifecycles)}
          />

          <FilterSelect
            label="Account"
            value={named(options?.customers, filters.customer)}
            selected={filters.customer}
            onChange={(value) => setFilters((f) => ({ ...f, customer: value }))}
            options={choices(options?.customers)}
          />

          {activeCount > 0 && (
            <>
              <span className="ml-2 text-[11px] text-ink-faint whitespace-nowrap">
                {accounts} {accounts === 1 ? 'account' : 'accounts'}
              </span>
              <button
                type="button"
                onClick={() => setFilters(EMPTY)}
                className="ml-2 text-[12px] font-bold text-accent hover:text-accent-hover transition-colors px-2 whitespace-nowrap"
              >
                Clear {activeCount}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 w-full h-full">
        <Outlet context={context} />
      </div>
    </div>
  );
}
