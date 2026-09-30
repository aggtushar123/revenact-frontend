import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useOrgCurrency } from '../../hooks';
import { SM, useMediaQuery } from '../../lib/useMediaQuery';
import { ACCOUNT_LIFECYCLE_TARGETS } from '../../features/accounts/accountFields';
import { bulkUpdateAccounts, exportAccountPortfolio } from '../../features/accounts/portfolioApi';
import type { AccountBulkAction, AccountFilterOptions, AccountPortfolioRow } from '../../features/accounts/portfolioTypes';
import { useMembers } from '../../features/knowledge/useMembers';
import { ownerTargets } from '../../features/organizations/bulkTargets';
import { hasFilters, toApiQuery, type PortfolioParams } from '../../features/organizations/portfolioParams';
import { AccountPanels } from '../../components/accounts/portfolio/AccountPanels';
import { ACCOUNT_KIND } from '../../components/accounts/portfolio/accountKind';
import { AccountRow } from '../../components/organizations/portfolio/AccountRow';
import { AccountSheet } from '../../components/organizations/portfolio/AccountSheet';
import { FilterChips } from '../../components/organizations/portfolio/FilterChips';
import { PortfolioKindContext } from '../../components/organizations/portfolio/portfolioKind';
import { PortfolioSections, type PortfolioRowRenderer } from '../../components/organizations/portfolio/PortfolioSections';
import { PortfolioToolbar } from '../../components/organizations/portfolio/PortfolioToolbar';
import { SelectionBar, type BulkReport } from '../../components/organizations/portfolio/SelectionBar';
import { SummaryTiles } from '../../components/organizations/portfolio/SummaryTiles';
import { FOCUS } from '../../components/organizations/portfolio/styles';
import { errorMessage, usePortfolio } from '../../components/organizations/portfolio/usePortfolio';
import { usePortfolioParams } from '../../components/organizations/portfolio/usePortfolioParams';
import { useSelection } from '../../components/organizations/portfolio/useSelection';
import { AccountFormModal } from '../organizations/AccountFormModal';
import { OrganizationsFrame } from '../organizations/OrganizationsFrame';
import { useReportAccountsOptions } from './ask/accountsNames';
import { useAccountEditing } from './useAccountEditing';

const DISMISS = `inline-flex w-11 h-11 sm:w-8 sm:h-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-subtle active:bg-line-subtle ${FOCUS}`;

/** /accounts/list: the Accounts portfolio (spec 2026-09-29 §1), the
 *  Organizations list's components with ACCOUNT_KIND. Rows, groups, tiles
 *  and totals come from GET /accounts/portfolio/; every filter, sort and
 *  group is URL state; bulk owner and lifecycle go to POST /accounts/bulk/.
 *  No archive or churn: Churn is an ordinary stage. */
export function List() {
  return (
    <PortfolioKindContext.Provider value={ACCOUNT_KIND}>
      <AccountsList />
    </PortfolioKindContext.Provider>
  );
}

function AccountsList() {
  const { params, update, clearFilters } = usePortfolioParams();
  const isSm = useMediaQuery(SM);
  const orgCurrency = useOrgCurrency();

  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const [notice, setNotice] = useState<string | null>(null);
  const forms = useAccountEditing(setNotice);
  const { remember, nameOf } = forms;

  const [openRow, setOpenRow] = useState<AccountPortfolioRow | null>(null);
  // Every page that lands (the flat list's, or any section's): remember the
  // rows, and swap the opened row for its fresh copy.
  const onRowsLoaded = useCallback(
    (rows: AccountPortfolioRow[]) => {
      remember(rows);
      setOpenRow((current) => (current && rows.find((row) => row.id === current.id)) || current);
    },
    [remember],
  );

  const portfolio = usePortfolio<AccountPortfolioRow, AccountFilterOptions>(params, version, onRowsLoaded);
  const members = useMembers();
  const selection = useSelection();
  const { prune, clear: clearSelection } = selection;
  const searchRef = useRef<HTMLInputElement>(null);
  const grouped = params.group !== '';

  // The Organizations list's selection rule: a different list landing
  // (`loadedQuery` changed) clears it when grouped and prunes it to page one
  // when flat; a reload of the same query keeps it, so failed ids stay
  // selected for a retry. Adjusted during render, not in an effect.
  const { loadedQuery } = portfolio;
  const [seenQuery, setSeenQuery] = useState(loadedQuery);
  const [report, setReport] = useState<BulkReport | null>(null);
  if (seenQuery !== loadedQuery) {
    setSeenQuery(loadedQuery);
    if (grouped) clearSelection();
    else prune(portfolio.rows.map((row) => row.id));
    setReport(null);
  }
  // Read by runBulk after its await: the query that is loaded by then.
  const loadedQueryRef = useRef(loadedQuery);
  useLayoutEffect(() => {
    loadedQueryRef.current = loadedQuery;
  });

  const [exporting, setExporting] = useState(false);
  const [actionRunning, setActionRunning] = useState(false);
  // Phones: the toolbar's Select toggle shows the checkboxes without a long press.
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

  const currency = portfolio.data?.currency ?? orgCurrency;
  const options = portfolio.data?.filters ?? null;
  // Ask Revenact (spec §3): the chip names owners and organisations from
  // this read's options. Opening a row narrows nothing: the server drops a
  // focus on the List (plan Decision 3).
  useReportAccountsOptions(options);
  const failed = !portfolio.data && portfolio.error !== null;

  const toggleOpen = useCallback(
    (row: AccountPortfolioRow) => setOpenRow((current) => (current?.id === row.id ? null : row)),
    [],
  );
  const closeSheet = useCallback(() => setOpenRow(null), []);

  const runExport = async (query: string) => {
    setExporting(true);
    setNotice(null);
    try {
      await exportAccountPortfolio(query);
    } catch (err) {
      setNotice(errorMessage(err, 'Could not export accounts.'));
    } finally {
      setExporting(false);
    }
  };

  const runBulk = async (action: AccountBulkAction, value: number | string | null) => {
    const ids = [...selection.selected];
    const startQuery = loadedQueryRef.current;
    setActionRunning(true);
    setReport(null);
    try {
      const result = await bulkUpdateAccounts({ ids, action, value });
      setReport({
        updated: result.updated.length,
        failed: result.failed.map((failure) => ({ ...failure, name: nameOf(failure.id) })),
      });
      // Failures stay selected for a retry, unless a different list landed meanwhile.
      if (loadedQueryRef.current === startQuery) selection.replace(result.failed.map((failure) => failure.id));
      else selection.clear();
    } catch (err) {
      setReport({ updated: 0, failed: [], error: errorMessage(err, 'Could not update these accounts.') });
    } finally {
      setActionRunning(false);
      reload();
    }
  };

  const applyFilter = (patch: Partial<PortfolioParams>) => {
    update(patch);
    searchRef.current?.focus();
  };

  const renderRow: PortfolioRowRenderer<AccountPortfolioRow> = (row, { loading }) => {
    const open = openRow?.id === row.id;
    return (
      <AccountRow
        key={row.id}
        row={row}
        currency={currency}
        pins={[]}
        isSm={isSm}
        selecting={selecting}
        selected={selection.selected.has(row.id)}
        selectDisabled={loading || portfolio.loading || actionRunning}
        atLimit={selection.atLimit}
        open={open}
        onToggleSelect={selection.toggle}
        onLongPress={selection.toggle}
        onToggleOpen={toggleOpen}
      >
        {open && isSm ? (
          <AccountPanels
            id={`account-${row.id}-details`}
            row={row}
            currency={currency}
            onEdit={ACCOUNT_KIND.editable(row) ? forms.openEdit : undefined}
          />
        ) : null}
      </AccountRow>
    );
  };

  return (
    <OrganizationsFrame>
      <div className="flex flex-col gap-4 pb-6">
        {/* Containers: the tiles and rows follow this column, which the Ask
            rail narrows, not the window. */}
        <div className="@container">
          <SummaryTiles
            summary={portfolio.data?.summary ?? null}
            failed={failed}
            currency={currency}
            params={params}
            onFilter={update}
          />
        </div>
        <PortfolioToolbar
          params={params}
          update={update}
          options={options}
          isSm={isSm}
          onExport={() => void runExport(toApiQuery(params))}
          exporting={exporting}
          onAdd={() => forms.openAdd()}
          searchRef={searchRef}
          selectMode={selecting}
          onToggleSelectMode={toggleSelectMode}
        />
        <FilterChips
          params={params}
          options={options}
          count={portfolio.data?.count ?? null}
          total={portfolio.total}
          failed={failed}
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
          <PortfolioSections
            params={params}
            version={version}
            portfolio={portfolio}
            currency={currency}
            filtered={hasFilters(params)}
            renderRow={renderRow}
            onRowsLoaded={onRowsLoaded}
            onClearFilters={clearFilters}
            onAdd={() => forms.openAdd()}
          />
        </div>
        <SelectionBar
          count={selection.selected.size}
          owners={ownerTargets(members)}
          lifecycles={ACCOUNT_LIFECYCLE_TARGETS}
          keepChurn
          activity={actionRunning ? 'applying' : exporting ? 'exporting' : null}
          loading={portfolio.loading}
          report={report}
          onSetOwner={(id) => void runBulk('set_owner', id)}
          onSetLifecycle={(stage) => void runBulk('set_lifecycle', stage)}
          onExport={() => void runExport(new URLSearchParams({ ids: [...selection.selected].join(',') }).toString())}
          onClose={endSelection}
        />
      </div>

      {!isSm && openRow ? <AccountSheet row={openRow} currency={currency} onClose={closeSheet} onEdit={forms.openEdit} /> : null}

      {forms.adding ? (
        <AccountFormModal
          companies={forms.companies}
          defaultLifecycleStage={forms.adding.stage}
          onSaved={reload}
          onClose={forms.closeAdd}
        />
      ) : null}
      {forms.editing ? (
        <AccountFormModal
          account={forms.editing}
          onClose={() => {
            forms.closeEdit();
            reload();
          }}
        />
      ) : null}
    </OrganizationsFrame>
  );
}
