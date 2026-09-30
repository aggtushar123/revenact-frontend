import { useCallback, useRef, useState, type RefObject } from 'react';
import { CheckSquare, Download, Pin, Plus, Search, SlidersHorizontal } from 'lucide-react';
import type { ColumnId } from '../tableData';
import type { PortfolioParams } from '../../../features/organizations/portfolioParams';
import type { FilterOptions } from '../../../features/organizations/portfolioTypes';
import { FiltersPanel, GroupSortControls, type GroupOption } from './FiltersPanel';
import { PinFieldsMenu } from './PinFieldsMenu';
import { usePortfolioKind } from './portfolioKind';
import { BUTTON, FOCUS } from './styles';
import { useSearchText } from './useSearchText';

const LABEL = 'Search by name or Revenact ID';

function activeFilters(p: PortfolioParams): number {
  return (
    [p.owner !== '', p.renews_within !== '', p.nps !== '', p.include_churned, p.ids.length > 0].filter(Boolean).length +
    p.lifecycle.length +
    p.health.length +
    p.product.length +
    (p.organisation?.length ?? 0)
  );
}

export function PortfolioToolbar({
  params,
  update,
  options,
  isSm,
  pins = [],
  onTogglePin,
  onExport,
  exporting,
  onAdd,
  searchRef,
  selectMode = false,
  onToggleSelectMode,
  groupOptions,
}: {
  params: PortfolioParams;
  update: (patch: Partial<PortfolioParams>) => void;
  options: FilterOptions | null;
  isSm: boolean;
  /** Omitted on the Board, whose cards show no pinned chips: no Pin fields then. */
  pins?: ColumnId[];
  onTogglePin?: (id: ColumnId) => void;
  onExport: () => void;
  exporting: boolean;
  onAdd: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
  /** Phones: selection mode is on (checkboxes show without a long press). */
  selectMode?: boolean;
  onToggleSelectMode?: () => void;
  /** The Group choices; the Board passes BOARD_GROUP_OPTIONS (no "None"). */
  groupOptions?: GroupOption[];
}) {
  const kind = usePortfolioKind();
  // The box shows what is typed; the URL gets it 300ms after typing stops.
  const commitSearch = useCallback((search: string) => update({ search }), [update]);
  const [text, setText] = useSearchText(params.search, commitSearch);

  const [open, setOpen] = useState<'filters' | 'pins' | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const count = activeFilters(params);
  const filtersTriggerRef = useRef<HTMLButtonElement>(null);
  const pinsTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <label className="relative min-w-0 flex-1 sm:min-w-[12rem] sm:max-w-sm">
        <span className="sr-only">{LABEL}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={isSm ? LABEL : 'Search'}
          className={`w-full min-h-11 sm:min-h-9 rounded-lg border border-line bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-faint hover:border-line-strong ${FOCUS}`}
        />
      </label>

      {isSm ? <GroupSortControls params={params} update={update} groupOptions={groupOptions} /> : null}

      <button
        ref={filtersTriggerRef}
        type="button"
        aria-expanded={open === 'filters'}
        aria-haspopup="dialog"
        onClick={() => setOpen(open === 'filters' ? null : 'filters')}
        className={BUTTON}
      >
        <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
        Filters
        {count > 0 ? (
          <span className="rounded-full bg-accent px-1.5 font-mono-brand tabular-nums text-[11px] text-on-accent">{count}</span>
        ) : null}
      </button>

      {!isSm && onToggleSelectMode ? (
        <button
          type="button"
          aria-pressed={selectMode}
          onClick={onToggleSelectMode}
          className={`${BUTTON} ${selectMode ? 'bg-accent-dim' : ''}`}
        >
          <CheckSquare className="w-4 h-4" aria-hidden="true" />
          Select
        </button>
      ) : null}

      {isSm ? (
        <>
          {onTogglePin ? (
            <button ref={pinsTriggerRef} type="button" aria-expanded={open === 'pins'} aria-haspopup="dialog" onClick={() => setOpen(open === 'pins' ? null : 'pins')} className={BUTTON}>
              <Pin className="w-4 h-4" aria-hidden="true" />
              Pin fields
            </button>
          ) : null}
          <button type="button" onClick={onExport} disabled={exporting} className={BUTTON}>
            <Download className="w-4 h-4" aria-hidden="true" />
            {exporting ? 'Exporting…' : 'Export'}
          </button>
          <button
            type="button"
            onClick={onAdd}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-[13px] font-semibold text-on-accent hover:bg-accent-hover active:opacity-90 ${FOCUS}`}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            {`Add ${kind.noun.one}`}
          </button>
        </>
      ) : null}

      {open === 'filters' ? (
        <FiltersPanel
          params={params}
          update={update}
          options={options}
          isSm={isSm}
          onClose={close}
          onExport={() => {
            close();
            onExport();
          }}
          exporting={exporting}
          onAdd={() => {
            close();
            onAdd();
          }}
          triggerRef={filtersTriggerRef}
          groupOptions={groupOptions}
        />
      ) : null}
      {open === 'pins' && onTogglePin ? (
        <PinFieldsMenu pins={pins} onToggle={onTogglePin} onClose={close} triggerRef={pinsTriggerRef} />
      ) : null}
    </div>
  );
}
