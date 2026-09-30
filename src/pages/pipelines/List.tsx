import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useOrgCurrency } from '../../hooks';
import { SM, useMediaQuery } from '../../lib/useMediaQuery';
import { countText } from '../../features/organizations/filterChips';
import { bulkUpdatePipeline, exportPipeline } from '../../features/pipelines/pipelineApi';
import { pipelineChips } from '../../features/pipelines/pipelineChips';
import { DEPARTMENT_CHOICES, NO_DEPARTMENT, PIPELINE_KINDS, PRIORITY_CHOICES, stageTargets } from '../../features/pipelines/pipelineKinds';
import { hasPipelineFilters, pipelineApiQuery, type PipelineParams } from '../../features/pipelines/pipelineParams';
import type { PipelineBulkAction } from '../../features/pipelines/pipelineTypes';
import { ChipRow } from '../../components/organizations/portfolio/FilterChips';
import { CLEAR_DATE, SelectionActionsBar, type BulkReport } from '../../components/organizations/portfolio/SelectionActionsBar';
import { FOCUS } from '../../components/organizations/portfolio/styles';
import { errorMessage } from '../../components/organizations/portfolio/usePagedRead';
import { useSelection } from '../../components/organizations/portfolio/useSelection';
import { PipelineItem } from '../../components/pipelines/portfolio/PipelineItem';
import { PipelineKindSwitch } from '../../components/pipelines/portfolio/PipelineKindSwitch';
import { PipelineModals } from '../../components/pipelines/portfolio/PipelineModals';
import { PipelineSections, type PipelineItemRenderer } from '../../components/pipelines/portfolio/PipelineSections';
import { PipelineTiles } from '../../components/pipelines/portfolio/PipelineTiles';
import { PipelineToolbar } from '../../components/pipelines/portfolio/PipelineToolbar';
import { usePipelineBook } from '../../components/pipelines/portfolio/usePipelineBook';
import { usePipelineForms } from '../../components/pipelines/portfolio/usePipelineForms';
import { usePipelineParams } from '../../components/pipelines/portfolio/usePipelineParams';
import { OrganizationsFrame } from '../organizations/OrganizationsFrame';

const DISMISS = `inline-flex w-11 h-11 sm:w-8 sm:h-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-subtle active:bg-line-subtle ${FOCUS}`;

/** What the bulk endpoint takes for a choice (plan Decision 13): the whole
 *  company is '', a cleared date is null. */
function bulkValue(action: PipelineBulkAction, value: string): string | null {
  if (action === 'set_department' && value === NO_DEPARTMENT) return '';
  if (action === 'set_date' && value === CLEAR_DATE) return null;
  return value;
}

/** /pipelines/list (spec 2026-09-30 §1): one book of opportunities or risks
 *  across organisations and accounts. Items, groups, tiles and totals come
 *  from GET /pipelines/<kind>/; every filter, sort and group is URL state;
 *  bulk edits go to POST /pipelines/<kind>/bulk/. Keyed on the kind, so
 *  nothing (a selection, an open form) crosses from one kind to the other. */
export function List() {
  const { params } = usePipelineParams();
  return <PipelinesList key={params.kind} />;
}

function PipelinesList() {
  const { params, update, clearFilters } = usePipelineParams();
  const kind = PIPELINE_KINDS[params.kind];
  const isSm = useMediaQuery(SM);
  const orgCurrency = useOrgCurrency();

  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const [notice, setNotice] = useState<string | null>(null);
  const forms = usePipelineForms();
  const book = usePipelineBook(kind, params, 'list', version, forms.remember);
  const selection = useSelection();
  const { prune, clear: clearSelection } = selection;
  const searchRef = useRef<HTMLInputElement>(null);
  const grouped = params.group !== '';

  // The portfolios' selection rule: a different list landing clears it when
  // grouped and prunes it to page one when flat; a reload of the same query
  // keeps it, so failed ids stay selected for a retry. Adjusted during render.
  const { loadedQuery } = book;
  const [seenQuery, setSeenQuery] = useState(loadedQuery);
  const [report, setReport] = useState<BulkReport | null>(null);
  if (seenQuery !== loadedQuery) {
    setSeenQuery(loadedQuery);
    if (grouped) clearSelection();
    else prune(book.rows.map((row) => row.id));
    setReport(null);
  }
  // Read by runBulk after its await: the query that is loaded by then.
  const loadedQueryRef = useRef(loadedQuery);
  useLayoutEffect(() => {
    loadedQueryRef.current = loadedQuery;
  });

  const [exporting, setExporting] = useState(false);
  const [actionRunning, setActionRunning] = useState(false);
  // Phones: the toolbar's Select toggle shows the checkboxes.
  const [selectMode, setSelectMode] = useState(false);
  const selecting = selection.selecting || (selectMode && !isSm);
  const endSelection = () => {
    selection.clear();
    setReport(null);
    setSelectMode(false);
  };
  const toggleSelectMode = () => {
    if (selecting) endSelection();
    else setSelectMode(true);
  };

  const currency = book.data?.currency ?? orgCurrency;
  const options = book.data?.filters ?? null;
  const failed = !book.data && book.error !== null;
  const chips = pipelineChips(params, options, kind);

  const runExport = async (query: string) => {
    setExporting(true);
    setNotice(null);
    try {
      await exportPipeline(kind.key, query);
    } catch (err) {
      setNotice(errorMessage(err, `Could not export ${kind.noun.many}.`));
    } finally {
      setExporting(false);
    }
  };

  const runBulk = async (action: PipelineBulkAction, value: string | null) => {
    const ids = [...selection.selected];
    const startQuery = loadedQueryRef.current;
    setActionRunning(true);
    setReport(null);
    try {
      const result = await bulkUpdatePipeline(kind.key, { ids, action, value });
      setReport({
        updated: result.updated.length,
        failed: result.failed.map((failure) => ({ ...failure, name: forms.titleOf(failure.id) })),
      });
      // Failures stay selected for a retry, unless a different list landed meanwhile.
      if (loadedQueryRef.current === startQuery) selection.replace(result.failed.map((failure) => failure.id));
      else selection.clear();
    } catch (err) {
      setReport({ updated: 0, failed: [], error: errorMessage(err, `Could not update these ${kind.noun.many}.`) });
    } finally {
      setActionRunning(false);
      reload();
    }
  };

  const applyFilter = (patch: Partial<PipelineParams>) => {
    update(patch);
    searchRef.current?.focus();
  };

  const renderItem: PipelineItemRenderer = (row, { loading }) => (
    <PipelineItem
      key={row.id}
      row={row}
      kind={kind}
      currency={currency}
      selecting={selecting}
      selected={selection.selected.has(row.id)}
      selectDisabled={loading || book.loading || actionRunning}
      atLimit={selection.atLimit}
      onToggleSelect={selection.toggle}
      onOpen={forms.openEdit}
    />
  );

  return (
    <OrganizationsFrame>
      <div className="flex flex-col gap-4 pb-6">
        {!isSm ? <PipelineKindSwitch variant="page" /> : null}
        {/* Containers: the tiles and items follow this column, not the window. */}
        <div className="@container">
          <PipelineTiles kind={kind} summary={book.data?.summary ?? null} failed={failed} currency={currency} params={params} onFilter={update} />
        </div>
        <PipelineToolbar
          kind={kind}
          view="list"
          params={params}
          update={update}
          options={options}
          isSm={isSm}
          onExport={() => void runExport(pipelineApiQuery(params, 'list'))}
          exporting={exporting}
          onAdd={() => forms.openAdd()}
          searchRef={searchRef}
          selectMode={selecting}
          onToggleSelectMode={toggleSelectMode}
        />
        <ChipRow
          chips={chips}
          status={countText(book.data?.count ?? null, book.total, chips.length > 0, failed, kind.noun)}
          onChange={applyFilter}
          onClearAll={() => {
            clearFilters();
            searchRef.current?.focus();
          }}
        />
        {notice ? (
          <p role="alert" className="flex items-center gap-2 text-[13px] text-danger">
            {notice}
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className={DISMISS}>
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </p>
        ) : null}
        <div className="@container">
          <PipelineSections
            kind={kind}
            params={params}
            version={version}
            book={book}
            currency={currency}
            filtered={hasPipelineFilters(params)}
            renderItem={renderItem}
            onRowsLoaded={forms.remember}
            onClearFilters={clearFilters}
            onAdd={() => forms.openAdd()}
          />
        </div>
        <SelectionActionsBar
          count={selection.selected.size}
          noun={kind.noun}
          choices={[
            { key: 'set_stage', label: 'Set stage', options: stageTargets(kind) },
            { key: 'set_priority', label: 'Set priority', options: PRIORITY_CHOICES },
            { key: 'set_department', label: 'Set department', options: DEPARTMENT_CHOICES },
          ]}
          dateChoice={{ key: 'set_date', label: 'Set date', clearLabel: 'Clear date' }}
          activity={actionRunning ? 'applying' : exporting ? 'exporting' : null}
          loading={book.loading}
          report={report}
          onApply={(key, value) => {
            const action = key as PipelineBulkAction;
            void runBulk(action, bulkValue(action, value));
          }}
          onExport={() => void runExport(new URLSearchParams({ ids: [...selection.selected].join(',') }).toString())}
          onClose={endSelection}
        />
      </div>
      <PipelineModals kind={kind} forms={forms} onSaved={reload} />
    </OrganizationsFrame>
  );
}
