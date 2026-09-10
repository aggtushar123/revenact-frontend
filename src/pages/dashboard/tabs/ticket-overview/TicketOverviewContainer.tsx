import { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppSelector } from '../../../../hooks';
import type { TicketOverviewContext } from './ControlsView';

/** The date presets the "Ticket Date" filter offers. Relative to today
 * rather than fixed dates, so they keep meaning something as time
 * moves — the seeded demo data now runs up to the present for exactly
 * this reason. */
const DATE_PRESETS = [
  { label: 'All', days: null },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 6 months', days: 182 },
  { label: 'Last year', days: 365 },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

interface FilterState {
  days: number | null;
  owner: string;
  priority: string;
  account: string;
}

const EMPTY: FilterState = { days: null, owner: '', priority: '', account: '' };

/**
 * The Ticket Overview shell, and its filter bar.
 *
 * These four controls used to be `NavLink`s to routes that fell
 * through to a "Sub-tab under development" placeholder — so clicking
 * "Ticket Priority", a control that renders as a filter chip reading
 * "All", unmounted the entire dashboard. They are now the filters they
 * always looked like.
 *
 * The selected value is passed to the Controls view as a query string
 * through `Outlet` context, built with `URLSearchParams` the same way
 * the Accounts list builds its own — rather than each chart filtering
 * client-side, which would mean fetching every ticket to the browser
 * and letting six charts disagree about what "filtered" means.
 */
export function TicketOverviewContainer() {
  const [filters, setFilters] = useState<FilterState>(EMPTY);

  // The options come back alongside the numbers, so the bar has no
  // fetch of its own — and its choices are scoped exactly like the
  // stats are.
  const options = useAppSelector((state) => state.tickets.stats?.filters);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.days !== null) params.set('from', isoDaysAgo(filters.days));
    if (filters.owner) params.set('owner', filters.owner);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.account) params.set('account', filters.account);
    return params.toString();
  }, [filters]);

  const context: TicketOverviewContext = { query };
  const activeCount = [
    filters.days !== null,
    !!filters.owner,
    !!filters.priority,
    !!filters.account,
  ].filter(Boolean).length;

  const selectedDate = DATE_PRESETS.find((p) => p.days === filters.days) ?? DATE_PRESETS[0];
  const selectedName = (list: { id: number; name: string }[] | undefined, id: string) =>
    list?.find((o) => String(o.id) === id)?.name ?? 'All';

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center px-4 bg-surface border-b border-line-subtle shrink-0 overflow-x-auto scrollbar-none shadow-[0_2px_4px_rgba(0,0,0,0.01)] mb-4 rounded-lg mt-1">
        <div className="flex items-center min-w-max h-[40px] gap-2">
          <span className="text-[12.5px] font-bold text-ink px-2">Controls</span>

          <FilterSelect
            label="Ticket Date"
            value={selectedDate.label}
            selected={String(filters.days ?? '')}
            onChange={(v) => setFilters((f) => ({ ...f, days: v === '' ? null : Number(v) }))}
            options={DATE_PRESETS.map((p) => ({ value: String(p.days ?? ''), label: p.label }))}
          />

          <FilterSelect
            label="Primary Owner"
            value={selectedName(options?.owners, filters.owner)}
            selected={filters.owner}
            onChange={(v) => setFilters((f) => ({ ...f, owner: v }))}
            options={[
              { value: '', label: 'All' },
              ...(options?.owners ?? []).map((o) => ({ value: String(o.id), label: o.name })),
            ]}
          />

          <FilterSelect
            label="Ticket Priority"
            value={
              options?.priorities.find((p) => p.value === filters.priority)?.name ?? 'All'
            }
            selected={filters.priority}
            onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
            options={[
              { value: '', label: 'All' },
              ...(options?.priorities ?? []).map((p) => ({ value: p.value, label: p.name })),
            ]}
          />

          <FilterSelect
            label="Account"
            value={selectedName(options?.accounts, filters.account)}
            selected={filters.account}
            onChange={(v) => setFilters((f) => ({ ...f, account: v }))}
            options={[
              { value: '', label: 'All' },
              ...(options?.accounts ?? []).map((a) => ({ value: String(a.id), label: a.name })),
            ]}
          />

          {activeCount > 0 && (
            <button
              onClick={() => setFilters(EMPTY)}
              className="text-[12px] font-bold text-accent hover:text-accent-hover transition-colors px-2 whitespace-nowrap"
            >
              Clear {activeCount}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 w-full h-full">
        <Outlet context={context} />
      </div>
    </div>
  );
}

/** A native `<select>` styled as the chip the bar already looked like.
 * Native rather than a custom popover so it stays keyboard-accessible
 * and behaves correctly on touch, and because the value it shows
 * doubles as the "All" suffix the original design called for. */
function FilterSelect({
  label,
  value,
  selected,
  onChange,
  options,
}: {
  label: string;
  value: string;
  selected: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const isActive = value !== 'All';

  return (
    <label className="relative flex items-center h-full group cursor-pointer">
      <span className="sr-only">{label}</span>
      <span
        className={`flex items-center gap-1 px-2 text-[12.5px] font-bold whitespace-nowrap border-b-[2px] h-full transition-all ${
          isActive
            ? 'border-accent text-accent bg-accent-dim/20'
            : 'border-transparent text-ink-muted group-hover:text-ink group-hover:bg-subtle/50'
        }`}
      >
        {label}
        <span
          className={`ml-1 text-[11px] font-normal ${isActive ? 'text-accent' : 'text-ink-faint'}`}
        >
          {value}
        </span>
      </span>
      <select
        aria-label={label}
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
