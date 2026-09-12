import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '../../../hooks';
import { setOwnerFilter } from '../../../features/health/healthSlice';
import { FilterSelect } from '../../../components/shared/FilterSelect';
import { useHealthOverview } from './health-overview/useHealthOverview';

/** The five real views. Renewal Date and Primary Owner both used to be chips
 *  reading "All" that routed to a placeholder — the first became a tab, the
 *  second became the filter it always looked like. */
const SUBTABS = [
  { label: 'Triage', path: 'triage' },
  { label: 'Divergence', path: 'divergence' },
  { label: 'Movement', path: 'movement' },
  { label: 'Controls', path: 'controls' },
  { label: 'Renewal Date', path: 'renewal-date' },
];

export function HealthOverviewContainer() {
  const location = useLocation();
  const dispatch = useAppDispatch();

  // The bar reads the same hook the tabs do, so its options and its count come
  // from exactly the book they are rendering — no second fetch, and no way for
  // the chip to describe a different set than the charts below it.
  const { owners, ownerFilter, ownerName, rows, totalCount } = useHealthOverview();

  if (location.pathname === '/dashboard/advance/health') {
    return <Navigate to="triage" replace />;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center px-4 bg-surface border-b border-line-subtle shrink-0 overflow-x-auto scrollbar-none shadow-[0_2px_4px_rgba(0,0,0,0.01)] mb-4 rounded-lg">
        <div className="flex items-center min-w-max h-[40px]">
          {SUBTABS.map((tab, idx) => (
            <div key={tab.path} className="flex items-center h-full">
              {idx > 0 && <div className="w-px h-3.5 mx-2 bg-line" />}
              <NavLink
                to={tab.path}
                className={({ isActive }) => `
                  h-full flex items-center px-2 text-[12.5px] font-bold transition-all whitespace-nowrap border-b-[2px]
                  ${isActive
                    ? 'border-accent text-accent bg-accent-dim'
                    : 'border-transparent text-ink-muted hover:text-ink hover:bg-subtle'
                  }
                `}
              >
                {tab.label}
              </NavLink>
            </div>
          ))}

          <div className="w-px h-3.5 mx-2 bg-line" />

          <FilterSelect
            label="Primary Owner"
            value={ownerName ?? 'All'}
            selected={ownerFilter ?? ''}
            onChange={(value) => dispatch(setOwnerFilter(value === '' ? null : value))}
            options={[
              { value: '', label: 'All' },
              // The count rides in the label: picking an owner with two
              // accounts and picking one with forty are different decisions,
              // and the dropdown is where that is worth knowing.
              ...owners.map((owner) => ({
                value: owner.key,
                label: `${owner.name} (${owner.count})`,
              })),
            ]}
          />

          {ownerFilter !== null && (
            <>
              {/* Said out loud, because every tab under here is now showing a
                  slice. A dashboard that looks whole while showing a third of
                  the book is the failure this screen is built to avoid. */}
              <span className="ml-2 text-[11px] text-ink-faint whitespace-nowrap">
                {rows.length} of {totalCount} accounts
              </span>
              <button
                type="button"
                onClick={() => dispatch(setOwnerFilter(null))}
                className="ml-2 text-[12px] font-bold text-accent hover:text-accent-hover transition-colors px-2 whitespace-nowrap"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 w-full h-full">
        <Outlet />
      </div>
    </div>
  );
}
