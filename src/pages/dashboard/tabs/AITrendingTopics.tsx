import { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppSelector } from '../../../hooks';
import { FilterSelect } from '../../../components/shared/FilterSelect';
import type { FilterGroup, FilterOption } from '../../../components/shared/FilterSelect';
import type { InteractionFilterOption } from '../../../features/interactions/interactionsSlice';
import type { AITrendingContext } from './ai-trending/ControlsView';

interface FilterState {
  /** `"customer:7"` or `"account:2"` — one chip offers both, and they are
   *  different query params, so the kind travels with the id. */
  parent: string;
  type: string;
  sentiment: string;
  area: string;
  category: string;
  subcategory: string;
  revenueBracket: string;
}

const EMPTY: FilterState = {
  parent: '',
  type: '',
  sentiment: '',
  area: '',
  category: '',
  subcategory: '',
  revenueBracket: '',
};

/**
 * The AI Trending Topics shell, and its filter bar.
 *
 * These seven controls used to be `NavLink`s to routes that fell through to a
 * "Sub-tab under development" placeholder — so clicking "Sentiment", a control
 * rendering as a filter chip reading "All", unmounted the whole dashboard. They
 * are now the filters they always looked like, the same fix
 * TicketOverviewContainer already made to its own four.
 *
 * The selection is passed to the Controls view as a query string through
 * `Outlet` context rather than each chart filtering client-side — which would
 * mean fetching every interaction in the tenant to the browser and letting seven
 * charts disagree about what "filtered" means.
 */
export function AITrendingTopics() {
  const [filters, setFilters] = useState<FilterState>(EMPTY);

  // The options come back alongside the numbers, so the bar has no fetch of its
  // own — and its choices are scoped exactly as the stats are.
  const options = useAppSelector((state) => state.interactions.stats?.filters);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    const [kind, id] = filters.parent.split(':');
    if (kind && id) params.set(kind, id);
    if (filters.type) params.set('type', filters.type);
    if (filters.sentiment) params.set('sentiment', filters.sentiment);
    if (filters.area) params.set('area', filters.area);
    if (filters.category) params.set('category', filters.category);
    if (filters.subcategory) params.set('subcategory', filters.subcategory);
    if (filters.revenueBracket) params.set('revenue_bracket', filters.revenueBracket);
    return params.toString();
  }, [filters]);

  const context: AITrendingContext = { query };
  const activeCount = Object.values(filters).filter(Boolean).length;

  /** Organisations and their accounts in one chip, grouped — the column this
   *  filters is labelled "Account Name" and shows either kind of parent. */
  const parentOptions: (FilterOption | FilterGroup)[] = [
    { value: '', label: 'All' },
    {
      label: 'Organisations',
      options: (options?.customers ?? []).map((c) => ({
        value: `customer:${c.id}`,
        label: c.name,
      })),
    },
    {
      label: 'Accounts',
      options: (options?.accounts ?? []).map((a) => ({
        value: `account:${a.id}`,
        label: a.name,
      })),
    },
  ];

  const parentLabel = (() => {
    const [kind, id] = filters.parent.split(':');
    if (!kind) return 'All';
    const list = kind === 'customer' ? options?.customers : options?.accounts;
    return list?.find((o) => String(o.id) === id)?.name ?? 'All';
  })();

  /** Subcategories are narrowed to the chosen category, because offering
   *  twenty-five values of which three can match is worse than offering three.
   *  With no category chosen they are all on offer, since picking one on its own
   *  is a legitimate way to find a topic. */
  const subcategoryOptions = (options?.subcategories ?? []).filter(
    (s) => !filters.category || s.category === filters.category
  );

  /** The chip's own suffix: the chosen option's label, or "All". Reads the API's
   *  `{value, name}` options rather than the select's `{value, label}` ones. */
  const named = (list: InteractionFilterOption[] | undefined, value: string) =>
    list?.find((o) => o.value === value)?.name ?? 'All';

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center px-4 bg-surface border-b border-line-subtle shrink-0 overflow-x-auto scrollbar-none shadow-[0_2px_4px_rgba(0,0,0,0.01)] mb-4 rounded-lg mt-1">
        <div className="flex items-center min-w-max h-[40px] gap-2">
          <span className="text-[12.5px] font-bold text-ink px-2">Controls</span>

          <FilterSelect
            label="Account Name"
            value={parentLabel}
            selected={filters.parent}
            onChange={(v) => setFilters((f) => ({ ...f, parent: v }))}
            options={parentOptions}
          />

          <FilterSelect
            label="Activity Type"
            value={named(options?.types, filters.type)}
            selected={filters.type}
            onChange={(v) => setFilters((f) => ({ ...f, type: v }))}
            options={[
              { value: '', label: 'All' },
              ...(options?.types ?? []).map((o) => ({ value: o.value, label: o.name })),
            ]}
          />

          <FilterSelect
            label="Sentiment"
            value={named(options?.sentiments, filters.sentiment)}
            selected={filters.sentiment}
            onChange={(v) => setFilters((f) => ({ ...f, sentiment: v }))}
            options={[
              { value: '', label: 'All' },
              ...(options?.sentiments ?? []).map((o) => ({ value: o.value, label: o.name })),
            ]}
          />

          <FilterSelect
            label="AI Area"
            value={named(options?.areas, filters.area)}
            selected={filters.area}
            onChange={(v) => setFilters((f) => ({ ...f, area: v }))}
            options={[
              { value: '', label: 'All' },
              ...(options?.areas ?? []).map((o) => ({ value: o.value, label: o.name })),
            ]}
          />

          <FilterSelect
            label="AI Category"
            value={named(options?.categories, filters.category)}
            selected={filters.category}
            // Changing category clears a subcategory that no longer belongs to
            // it — otherwise the two filters contradict each other and every
            // chart comes back empty with no visible reason why.
            onChange={(v) =>
              setFilters((f) => ({
                ...f,
                category: v,
                subcategory: (options?.subcategories ?? []).some(
                  (s) => s.value === f.subcategory && s.category === v
                )
                  ? f.subcategory
                  : '',
              }))
            }
            options={[
              { value: '', label: 'All' },
              ...(options?.categories ?? []).map((o) => ({ value: o.value, label: o.name })),
            ]}
          />

          <FilterSelect
            label="AI Subcategory"
            value={named(options?.subcategories, filters.subcategory)}
            selected={filters.subcategory}
            onChange={(v) => setFilters((f) => ({ ...f, subcategory: v }))}
            options={[
              { value: '', label: 'All' },
              ...subcategoryOptions.map((o) => ({ value: o.value, label: o.name })),
            ]}
          />

          <FilterSelect
            label="Revenue Bracket"
            value={named(options?.revenue_brackets, filters.revenueBracket)}
            selected={filters.revenueBracket}
            onChange={(v) => setFilters((f) => ({ ...f, revenueBracket: v }))}
            options={[
              { value: '', label: 'All' },
              ...(options?.revenue_brackets ?? []).map((o) => ({
                value: o.value,
                label: o.name,
              })),
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
