import { useCallback, useRef, useState, type RefObject } from 'react';
import { pipelineChips } from '../../../features/pipelines/pipelineChips';
import type { PipelineKind } from '../../../features/pipelines/pipelineKinds';
import type { PipelineParams, PipelineView } from '../../../features/pipelines/pipelineParams';
import type { PipelineFilterOptions } from '../../../features/pipelines/pipelineTypes';
import { FiltersTrigger, SelectToggle, ToolbarActions, ToolbarSearch } from '../../organizations/portfolio/toolbarParts';
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
      <ToolbarSearch label={LABEL} searchRef={searchRef} value={text} onChange={setText} isSm={isSm} />

      {isSm ? <PipelineGroupSort kind={kind} view={view} params={params} update={update} /> : null}

      <FiltersTrigger triggerRef={triggerRef} open={open} onClick={() => setOpen((was) => !was)} count={count} />

      {!isSm && onToggleSelectMode ? <SelectToggle pressed={selectMode} onClick={onToggleSelectMode} /> : null}

      {isSm ? <ToolbarActions onExport={onExport} exporting={exporting} onAdd={onAdd} addLabel={`Add ${kind.noun.one}`} /> : null}

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
