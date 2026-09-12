import { useMemo, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAppSelector } from '../../../hooks';
import { FilterSelect } from '../../../components/shared/FilterSelect';
import type { ForecastContext } from './forecast/ControlsView';

interface FilterState {
  owner: string;
  lifecycle: string;
  customer: string;
  horizon: string;
}

/** Windows the forecast offers. A quarter is what a sales team commits to, a
 *  year is what a board asks for, and two is as far as renewal dates are worth
 *  planning against. */
const HORIZONS = [
  { value: '90', label: 'Next quarter' },
  { value: '365', label: 'Next 12 months' },
  { value: '730', label: 'Next 24 months' },
];

const EMPTY: FilterState = { owner: '', lifecycle: '', customer: '', horizon: '365' };

/**
 * The Revenue Forecast shell and its bar.
 *
 * The same three filters as every other dashboard, plus the one control this
 * screen needs that the others don't: the horizon. A forecast without a stated
 * window is a number nobody can check, and changing it is the first thing
 * anyone does with one.
 */
export function ForecastContainer() {
  const [filters, setFilters] = useState<FilterState>(EMPTY);
  const options = useAppSelector((state) => state.forecast.stats?.filters);
  const accounts = useAppSelector((state) => state.forecast.stats?.accounts ?? 0);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.owner) params.set('owner', filters.owner);
    if (filters.lifecycle) params.set('lifecycle', filters.lifecycle);
    if (filters.customer) params.set('customer', filters.customer);
    // Always sent, so the number on screen and the window it covers can never
    // come from different requests.
    params.set('horizon_days', filters.horizon);
    return params.toString();
  }, [filters]);

  const context: ForecastContext = { query };
  // The horizon always has a value, so it doesn't count as a filter to clear.
  const activeCount = [filters.owner, filters.lifecycle, filters.customer].filter(Boolean).length;

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
            label="Horizon"
            value={HORIZONS.find((h) => h.value === filters.horizon)?.label ?? 'Next 12 months'}
            selected={filters.horizon}
            onChange={(value) => setFilters((f) => ({ ...f, horizon: value }))}
            options={HORIZONS}
          />

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
                onClick={() => setFilters((f) => ({ ...EMPTY, horizon: f.horizon }))}
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
