import { useCallback, useRef, useState, type RefObject } from 'react';
import { CheckSquare, Download, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { pipelineChips } from '../../../features/pipelines/pipelineChips';
import type { PipelineKind } from '../../../features/pipelines/pipelineKinds';
import type { PipelineParams, PipelineView } from '../../../features/pipelines/pipelineParams';
import type { PipelineFilterOptions } from '../../../features/pipelines/pipelineTypes';
import { BUTTON, FOCUS, PRIMARY } from '../../organizations/portfolio/styles';
import { useSearchText } from '../../organizations/portfolio/useSearchText';
import { PipelineFilters, PipelineGroupSort } from './PipelineFilters';

const LABEL = 'Search by title, organization or account';

/** Search, group and sort, Filters (with a count of active filters),
 *  Export and Add from `sm`; below `sm` the bar is Search, Filters and the
 *  Select toggle, and the sheet holds the rest (the Organizations toolbar's
 *  shape). */
export function PipelineToolbar({
  kind,
  view,
  params,
  update,
  options,
  isSm,
  onExport,
  exporting,
  onAdd,
  searchRef,
  selectMode = false,
  onToggleSelectMode,
}: {
  kind: PipelineKind;
  view: PipelineView;
  params: PipelineParams;
  update: (patch: Partial<PipelineParams>) => void;
  options: PipelineFilterOptions | null;
  isSm: boolean;
  onExport: () => void;
  exporting: boolean;
  onAdd: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
  /** Phones: selection mode is on (checkboxes show). The List only. */
  selectMode?: boolean;
  onToggleSelectMode?: () => void;
}) {
  const commitSearch = useCallback((search: string) => update({ search }), [update]);
  const [text, setText] = useSearchText(params.search, commitSearch);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const count = pipelineChips(params, null, kind).length;

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

      {isSm ? <PipelineGroupSort kind={kind} view={view} params={params} update={update} /> : null}

      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((was) => !was)}
        className={BUTTON}
      >
        <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
        Filters
        {count > 0 ? <span className="rounded-full bg-accent px-1.5 font-mono-brand tabular-nums text-[11px] text-on-accent">{count}</span> : null}
      </button>

      {!isSm && onToggleSelectMode ? (
        <button type="button" aria-pressed={selectMode} onClick={onToggleSelectMode} className={`${BUTTON} ${selectMode ? 'bg-accent-dim' : ''}`}>
          <CheckSquare className="w-4 h-4" aria-hidden="true" />
          Select
        </button>
      ) : null}

      {isSm ? (
        <>
          <button type="button" onClick={onExport} disabled={exporting} className={BUTTON}>
            <Download className="w-4 h-4" aria-hidden="true" />
            {exporting ? 'Exporting…' : 'Export'}
          </button>
          <button type="button" onClick={onAdd} className={PRIMARY}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            {`Add ${kind.noun.one}`}
          </button>
        </>
      ) : null}

      {open ? (
        <PipelineFilters
          kind={kind}
          view={view}
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
          triggerRef={triggerRef}
        />
      ) : null}
    </div>
  );
}
