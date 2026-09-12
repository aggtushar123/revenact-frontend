import { useMemo, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAppSelector } from '../../../hooks';
import { FilterSelect } from '../../../components/shared/FilterSelect';
import type { ProductUsageContext } from './product-usage/ControlsView';

interface FilterState {
  product: string;
  owner: string;
  lifecycle: string;
}

const EMPTY: FilterState = { product: '', owner: '', lifecycle: '' };

/**
 * The Product Usage shell and its bar.
 *
 * Product leads the filters here — it is the axis of the screen, and filtering
 * to one product turns the comparison into a single-product read. The options
 * come from the book rather than a table, because there is no product table;
 * the same gap the attribution note names.
 *
 * No window control, for the same reason as the Customer Overview: the health
 * and seat figures are statements about now, while churn is all-time, and one
 * window across both would mean two different things.
 */
export function ProductUsageContainer() {
  const [filters, setFilters] = useState<FilterState>(EMPTY);
  const options = useAppSelector((state) => state.products.stats?.filters);
  const customers = useAppSelector((state) => state.products.stats?.kpis.customers ?? 0);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.product) params.set('product', filters.product);
    if (filters.owner) params.set('owner', filters.owner);
    if (filters.lifecycle) params.set('lifecycle', filters.lifecycle);
    return params.toString();
  }, [filters]);

  const context: ProductUsageContext = { query };
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
            label="Product"
            value={named(options?.products, filters.product)}
            selected={filters.product}
            onChange={(value) => setFilters((f) => ({ ...f, product: value }))}
            options={choices(options?.products)}
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

          {activeCount > 0 && (
            <>
              <span className="ml-2 text-[11px] text-ink-faint whitespace-nowrap">
                {customers} customers
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
