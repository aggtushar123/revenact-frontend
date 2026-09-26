import { useCallback, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useAppSelector, useOrgCurrency } from '../../hooks';
import { apiFetch } from '../../lib/apiClient';
import { SM, useMediaQuery } from '../../lib/useMediaQuery';
import type { Customer } from '../../features/customers/customersSlice';
import { exportPortfolio } from '../../features/organizations/portfolioApi';
import { BOARD_GROUP, boardParams, hasFilters, toApiQuery } from '../../features/organizations/portfolioParams';
import type { LifecycleValue, PortfolioRow } from '../../features/organizations/portfolioTypes';
import { OrganizationFormModal } from '../../components/organizations/OrganizationFormModal';
import { ChurnOrganizationModal } from '../../components/organizations/ChurnOrganizationModal';
import { AccountSheet } from '../../components/organizations/portfolio/AccountSheet';
import { AccountSidePanel } from '../../components/organizations/portfolio/AccountSidePanel';
import type { BoardMove } from '../../components/organizations/portfolio/boardMove';
import { BOARD_GROUP_OPTIONS } from '../../components/organizations/portfolio/FiltersPanel';
import { FilterChips } from '../../components/organizations/portfolio/FilterChips';
import { PortfolioBoard } from '../../components/organizations/portfolio/PortfolioBoard';
import { PortfolioToolbar } from '../../components/organizations/portfolio/PortfolioToolbar';
import { SummaryTiles } from '../../components/organizations/portfolio/SummaryTiles';
import { useBoardMove } from '../../components/organizations/portfolio/useBoardMove';
import { errorMessage, usePortfolio } from '../../components/organizations/portfolio/usePortfolio';
import { usePortfolioParams } from '../../components/organizations/portfolio/usePortfolioParams';
import { FOCUS } from '../../components/organizations/portfolio/styles';
import { OrganizationsFrame } from './OrganizationsFrame';

/** /organizations/board: the portfolio as columns (spec 2026-09-25 §1
 *  "Board", owner decisions 2026-09-26). The top half is the List's: tiles,
 *  toolbar, chips and "N of M", on the same URL params, so switching tabs
 *  keeps the filters. Group defaults to lifecycle here. Each column pages
 *  itself. A card moves by drag or Move to…, and the move PATCHes that one
 *  customer. No selection mode: bulk work stays on the List. */
export function Board() {
  const { params: urlParams, update, clearFilters } = usePortfolioParams(BOARD_GROUP);
  const params = useMemo(() => boardParams(urlParams), [urlParams]);
  const isSm = useMediaQuery(SM);
  const orgCurrency = useOrgCurrency();
  const defaultLifecycleStage = useAppSelector(
    (state) => state.auth.user?.organisation.default_lifecycle_stage || undefined,
  ) as Customer['lifecycle_stage'] | undefined;

  // `version` reloads everything (Add, Edit details, Churn). A saved move
  // reloads only the frame and the two columns it touched.
  const [version, setVersion] = useState(0);
  const [frameBump, setFrameBump] = useState(0);
  const [columnBumps, setColumnBumps] = useState<Record<string, number>>({});
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const portfolio = usePortfolio(params, version + frameBump);

  const [openRow, setOpenRow] = useState<PortfolioRow | null>(null);
  // Any column's page landing swaps the opened card for its fresh copy, so
  // the side panel or sheet shows what a reload brought back.
  const onRowsLoaded = useCallback((rows: PortfolioRow[]) => {
    setOpenRow((current) => (current && rows.find((row) => row.id === current.id)) || current);
  }, []);

  const [churning, setChurning] = useState<PortfolioRow | null>(null);
  const onSaved = useCallback((move: BoardMove) => {
    setFrameBump((n) => n + 1);
    setColumnBumps((bumps) => ({
      ...bumps,
      [move.from]: (bumps[move.from] ?? 0) + 1,
      [move.to]: (bumps[move.to] ?? 0) + 1,
    }));
  }, []);
  const board = useBoardMove({ onSaved, onChurn: setChurning });

  // A different list landing (a filter, sort or group change) forgets the
  // last move, so a column mounting later never replays it. Adjusted during
  // render, not in an effect.
  const { loadedQuery } = portfolio;
  const [seenQuery, setSeenQuery] = useState(loadedQuery);
  if (seenQuery !== loadedQuery) {
    setSeenQuery(loadedQuery);
    board.reset();
  }

  // Add: the toolbar's opens with the org's default stage; a column's "+"
  // (ruling R2) opens with that column's stage prefilled.
  const [adding, setAdding] = useState<{ stage?: LifecycleValue } | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const currency = portfolio.data?.currency ?? orgCurrency;
  const options = portfolio.data?.filters ?? null;
  const failed = !portfolio.data && portfolio.error !== null;

  const toggleOpen = useCallback((row: PortfolioRow) => setOpenRow((current) => (current?.id === row.id ? null : row)), []);
  const closeOpen = useCallback(() => setOpenRow(null), []);

  const openEdit = useCallback(async (id: number) => {
    setNotice(null);
    try {
      setEditing(await apiFetch<Customer>(`/customers/${id}/`));
    } catch (err) {
      setNotice(errorMessage(err, 'Could not open this organization for editing.'));
    }
  }, []);

  const runExport = async () => {
    setExporting(true);
    setNotice(null);
    try {
      await exportPortfolio(toApiQuery(params));
    } catch (err) {
      setNotice(errorMessage(err, 'Could not export organizations.'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <OrganizationsFrame>
      <div className="flex h-full min-h-0 flex-col gap-4 pb-4">
        <div className="flex shrink-0 flex-col gap-4">
          <SummaryTiles
            summary={portfolio.data?.summary ?? null}
            failed={failed}
            currency={currency}
            params={params}
            onFilter={update}
          />
          <PortfolioToolbar
            params={params}
            update={update}
            options={options}
            isSm={isSm}
            onExport={() => void runExport()}
            exporting={exporting}
            onAdd={() => setAdding({})}
            searchRef={searchRef}
            groupOptions={BOARD_GROUP_OPTIONS}
          />
          <FilterChips
            params={params}
            options={options}
            count={portfolio.data?.count ?? null}
            total={portfolio.total}
            failed={failed}
            onChange={(patch) => {
              update(patch);
              searchRef.current?.focus();
            }}
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
          {board.error ? (
            <p role="alert" className="flex items-center gap-2 text-[13px] text-danger">
              {board.error}
              <button
                type="button"
                onClick={board.dismissError}
                aria-label="Dismiss"
                className={`inline-flex w-11 h-11 sm:w-8 sm:h-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-subtle active:bg-line-subtle ${FOCUS}`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </p>
          ) : null}
          <p role="status" aria-live="polite" className="sr-only">
            {board.notice ?? ''}
          </p>
        </div>
        <div className="flex min-h-[24rem] flex-1 gap-3">
          <PortfolioBoard
            params={params}
            portfolio={portfolio}
            version={version}
            columnBumps={columnBumps}
            currency={currency}
            isSm={isSm}
            filtered={hasFilters(params)}
            move={board.move}
            saving={board.saving}
            openId={openRow?.id ?? null}
            onOpen={toggleOpen}
            onMove={board.moveTo}
            onRowsLoaded={onRowsLoaded}
            onClearFilters={clearFilters}
            onAdd={(stage) => setAdding({ stage })}
            onShowChurned={() => update({ include_churned: true })}
          />
          {isSm && openRow ? <AccountSidePanel row={openRow} currency={currency} onClose={closeOpen} onEdit={openEdit} /> : null}
        </div>
      </div>

      {!isSm && openRow ? <AccountSheet row={openRow} currency={currency} onClose={closeOpen} onEdit={openEdit} /> : null}

      {adding ? (
        <OrganizationFormModal
          defaultLifecycleStage={adding.stage ?? defaultLifecycleStage}
          onClose={() => {
            setAdding(null);
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
          customerIds={[churning.id]}
          customerNames={[churning.name]}
          onChurned={reload}
          onClose={() => setChurning(null)}
        />
      ) : null}
    </OrganizationsFrame>
  );
}
