import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSelector, useOrgCurrency } from '../../hooks';
import { apiFetch } from '../../lib/apiClient';
import { SM, useMediaQuery } from '../../lib/useMediaQuery';
import type { Customer } from '../../features/customers/customersSlice';
import { bulkUpdate, exportPortfolio } from '../../features/organizations/portfolioApi';
import { hasFilters, toApiQuery, type PortfolioParams } from '../../features/organizations/portfolioParams';
import type { BulkAction, PortfolioRow } from '../../features/organizations/portfolioTypes';
import { OrganizationFormModal } from '../../components/organizations/OrganizationFormModal';
import { ChurnOrganizationModal } from '../../components/organizations/ChurnOrganizationModal';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { AccountDetails } from '../../components/organizations/portfolio/AccountDetails';
import { AccountRow } from '../../components/organizations/portfolio/AccountRow';
import { AccountSheet } from '../../components/organizations/portfolio/AccountSheet';
import { FilterChips } from '../../components/organizations/portfolio/FilterChips';
import { PortfolioSections } from '../../components/organizations/portfolio/PortfolioSections';
import { PortfolioToolbar } from '../../components/organizations/portfolio/PortfolioToolbar';
import { SelectionBar, type BulkReport } from '../../components/organizations/portfolio/SelectionBar';
import { SummaryTiles } from '../../components/organizations/portfolio/SummaryTiles';
import { usePins } from '../../components/organizations/portfolio/usePins';
import type { PortfolioRowRenderer } from '../../components/organizations/portfolio/PortfolioSections';
import { errorMessage, usePortfolio } from '../../components/organizations/portfolio/usePortfolio';
import { usePortfolioParams } from '../../components/organizations/portfolio/usePortfolioParams';
import { useSelection } from '../../components/organizations/portfolio/useSelection';
import { OrganizationsFrame } from './OrganizationsFrame';

type Targets = { ids: number[]; names: string[] };

/** /organizations/list: the portfolio (spec 2026-09-25 §1). Every filter,
 *  sort and group is URL state. Rows, groups, tiles and totals come from
 *  GET /organizations/portfolio/. Bulk edits go to /organizations/bulk/.
 *  Churn keeps its own modal, one account at a time. */
export function List() {
  const { params, update, clearFilters } = usePortfolioParams();
  const isSm = useMediaQuery(SM);
  const orgCurrency = useOrgCurrency();
  const defaultLifecycleStage = useAppSelector(
    (state) => state.auth.user?.organisation.default_lifecycle_stage || undefined,
  ) as Customer['lifecycle_stage'] | undefined;

  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  // Names of every row loaded so far, for bulk results and the churn and
  // archive dialogs. Written in fetch callbacks, read in event handlers.
  const names = useRef(new Map<number, string>());
  const rememberNames = useCallback((rows: PortfolioRow[]) => {
    for (const row of rows) names.current.set(row.id, row.name);
  }, []);
  const nameOf = useCallback((id: number) => names.current.get(id) ?? `Organization ${id}`, []);

  const portfolio = usePortfolio(params, version, rememberNames);
  const { pins, toggle: togglePin } = usePins();
  const selection = useSelection();
  const { prune, clear: clearSelection } = selection;
  const searchRef = useRef<HTMLInputElement>(null);
  const grouped = params.group !== '';

  // Selection resets (the T8 contract). Ungrouped, once a fresh page one
  // lands, drop selected ids that are no longer listed. `loadedKey` changes
  // only then, not on a Show-more append, so the rows are read from a ref.
  const rowsRef = useRef(portfolio.rows);
  useEffect(() => {
    rowsRef.current = portfolio.rows;
  });
  useEffect(() => {
    if (!grouped) prune(rowsRef.current.map((row) => row.id));
  }, [grouped, portfolio.loadedKey, prune]);
  // Grouped, there is no one full row set to prune against, so a new frame
  // clears the selection. Only a new query does: a reload of the same query
  // (the version bump after a bulk action, or Try again) keeps it, so the
  // ids a bulk action failed on stay selected for a retry.
  const loadedQuery = portfolio.loadedKey?.split('#')[0] ?? null;
  useEffect(() => {
    if (grouped) clearSelection();
  }, [grouped, loadedQuery, clearSelection]);

  const [openRow, setOpenRow] = useState<PortfolioRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [churning, setChurning] = useState<Targets | null>(null);
  const [archiving, setArchiving] = useState<Targets | null>(null);
  const [exporting, setExporting] = useState(false);
  const [actionRunning, setActionRunning] = useState(false);
  const [report, setReport] = useState<BulkReport | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const currency = portfolio.data?.currency ?? orgCurrency;
  const options = portfolio.data?.filters ?? null;

  const toggleOpen = useCallback((row: PortfolioRow) => setOpenRow((current) => (current?.id === row.id ? null : row)), []);
  const closeSheet = useCallback(() => setOpenRow(null), []);

  const openEdit = useCallback(async (id: number) => {
    setNotice(null);
    try {
      setEditing(await apiFetch<Customer>(`/customers/${id}/`));
    } catch (err) {
      setNotice(errorMessage(err, 'Could not open this organization for editing.'));
    }
  }, []);

  const runExport = async (query: string) => {
    setExporting(true);
    setNotice(null);
    try {
      await exportPortfolio(query);
    } catch (err) {
      setNotice(errorMessage(err, 'Could not export organizations.'));
    } finally {
      setExporting(false);
    }
  };

  const runBulk = async (action: BulkAction, value: number | string | null) => {
    const ids = [...selection.selected];
    setActionRunning(true);
    setReport(null);
    try {
      const result = await bulkUpdate({ ids, action, value });
      setReport({
        updated: result.updated.length,
        failed: result.failed.map((failure) => ({ ...failure, name: nameOf(failure.id) })),
      });
      // Failures stay selected, so they can be retried.
      selection.replace(result.failed.map((failure) => failure.id));
    } catch (err) {
      setReport({ updated: 0, failed: [], error: errorMessage(err, 'Could not update these organizations.') });
    } finally {
      setActionRunning(false);
      reload();
    }
  };

  const targets = (): Targets => {
    const ids = [...selection.selected];
    return { ids, names: ids.map(nameOf) };
  };

  const applyFilter = (patch: Partial<PortfolioParams>) => {
    update(patch);
    searchRef.current?.focus();
  };

  const renderRow: PortfolioRowRenderer = (row, { loading }) => {
    const open = openRow?.id === row.id;
    return (
      <AccountRow
        key={row.id}
        row={row}
        currency={currency}
        pins={pins}
        selecting={selection.selecting}
        selected={selection.selected.has(row.id)}
        selectDisabled={loading || actionRunning}
        atLimit={selection.atLimit}
        open={open}
        onToggleSelect={selection.toggle}
        onLongPress={selection.toggle}
        onToggleOpen={toggleOpen}
      >
        {open && isSm ? <AccountDetails id={`account-${row.id}-details`} row={row} onEdit={openEdit} /> : null}
      </AccountRow>
    );
  };

  return (
    <OrganizationsFrame>
      <div className="flex flex-col gap-4 pb-6">
        <SummaryTiles summary={portfolio.data?.summary ?? null} currency={currency} params={params} onFilter={update} />
        <PortfolioToolbar
          params={params}
          update={update}
          options={options}
          isSm={isSm}
          pins={pins}
          onTogglePin={togglePin}
          onExport={() => void runExport(toApiQuery(params))}
          exporting={exporting}
          onAdd={() => setAdding(true)}
          searchRef={searchRef}
        />
        <FilterChips
          params={params}
          options={options}
          count={portfolio.data?.count ?? null}
          total={portfolio.total}
          onChange={applyFilter}
          onClearAll={() => {
            clearFilters();
            searchRef.current?.focus();
          }}
        />
        {notice ? (
          <p role="alert" className="text-[13px] text-danger">
            {notice}
          </p>
        ) : null}
        <PortfolioSections
          params={params}
          version={version}
          portfolio={portfolio}
          currency={currency}
          filtered={hasFilters(params)}
          renderRow={renderRow}
          onRowsLoaded={rememberNames}
          onClearFilters={clearFilters}
          onAdd={() => setAdding(true)}
        />
        <SelectionBar
          count={selection.selected.size}
          owners={options?.owners ?? []}
          lifecycles={options?.lifecycles ?? []}
          busy={actionRunning || portfolio.loading}
          report={report}
          onSetOwner={(id) => void runBulk('set_owner', id)}
          onSetLifecycle={(stage) => void runBulk('set_lifecycle', stage)}
          onExport={() =>
            void runExport(new URLSearchParams({ ids: [...selection.selected].join(','), include_churned: '1' }).toString())
          }
          onArchive={() => setArchiving(targets())}
          onChurn={() => setChurning(targets())}
          onClose={() => {
            selection.clear();
            setReport(null);
          }}
        />
      </div>

      {!isSm && openRow ? <AccountSheet row={openRow} currency={currency} onClose={closeSheet} onEdit={openEdit} /> : null}

      {adding ? (
        <OrganizationFormModal
          defaultLifecycleStage={defaultLifecycleStage}
          onClose={() => {
            setAdding(false);
            reload();
          }}
        />
      ) : null}
      {editing ? (
        <OrganizationFormModal
          customer={editing}
          onClose={() => {
            setEditing(null);
            reload();
          }}
        />
      ) : null}
      {churning ? (
        <ChurnOrganizationModal
          customerIds={churning.ids}
          customerNames={churning.names}
          onClose={() => {
            setChurning(null);
            selection.clear();
            reload();
          }}
        />
      ) : null}
      {archiving ? (
        <ConfirmDialog
          title={archiving.ids.length === 1 ? `Archive ${archiving.names[0]}?` : `Archive ${archiving.ids.length} organizations?`}
          message="Hidden from this list and the summary, but not deleted. You can unarchive later."
          confirmLabel="Archive"
          danger
          onConfirm={() => runBulk('archive', null)}
          onClose={() => setArchiving(null)}
        />
      ) : null}
    </OrganizationsFrame>
  );
}
