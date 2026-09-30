// This module intentionally exports both the section components and the
// pure `sectionStartsOpen` helper the brief's interface and tests share
// (Task 13). Fast refresh doesn't apply to this module, same precedent as
// rowParts.tsx and AccountDetails.tsx.
/* eslint-disable react-refresh/only-export-components */
import { useId, useState, type ReactNode } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import { formatCompactMoney } from '../../../features/customers/formatters';
import { capitalise } from '../../../features/organizations/portfolioLabels';
import { toApiQuery, type PortfolioParams } from '../../../features/organizations/portfolioParams';
import type { FilterOptions, PortfolioGroup, PortfolioRow, PortfolioRowBase } from '../../../features/organizations/portfolioTypes';
import { ErrorState } from '../../../pages/dashboard/shared/DataState';
import { usePortfolioKind } from './portfolioKind';
import { SECTION_PAGE_SIZE, usePagedPortfolio, type PortfolioState } from './usePortfolio';
import { FOCUS, QUIET } from './styles';

export function sectionStartsOpen(index: number, total: number): boolean {
  return total <= 4 || index === 0;
}

/** A row renderer that also gets its own section's (or the flat list's)
 *  `loading`, so it can disable that row's checkbox while a fetch for it is
 *  in flight (spec §1's "disabled while loading" rule). */
export type PortfolioRowRenderer<R extends PortfolioRowBase = PortfolioRow> = (row: R, state: { loading: boolean }) => ReactNode;

export function RowSkeleton({ count, label }: { count: number; label?: string }) {
  const kind = usePortfolioKind();
  return (
    <div role="status" aria-label={label ?? `Loading ${kind.noun.many}`}>
      <ul aria-hidden="true" className="flex flex-col gap-1.5">
        {Array.from({ length: Math.max(1, count) }, (_, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5">
            <span className="h-10 w-10 animate-pulse rounded-full bg-subtle" />
            <span className="flex flex-1 flex-col gap-1.5">
              <span className="block h-3 w-40 animate-pulse rounded bg-subtle" />
              <span className="block h-2.5 w-28 animate-pulse rounded bg-subtle" />
            </span>
            <span className="hidden h-3 w-16 animate-pulse rounded bg-subtle sm:block" />
            <span className="hidden h-3 w-20 animate-pulse rounded bg-subtle sm:block" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Retry renders only when `onRetry` is given — some callers (a shared tab
 *  mounted by a page that doesn't own that fetch's retry) have none. */
export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl bg-surface">
      <ErrorState message={message} detail="Nothing is shown rather than a partial list." />
      {onRetry ? (
        <div className="flex justify-center pb-6">
          <button type="button" onClick={onRetry} className={`${QUIET} border border-line`}>
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-surface px-4 py-12 text-center">
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      <p className="text-[13px] text-ink-muted">{detail}</p>
      {action}
    </div>
  );
}

export function MoreButton({
  next,
  loading,
  error,
  label,
  onClick,
}: {
  next: string | null;
  loading: boolean;
  error: string | null;
  label: string;
  onClick: () => void;
}) {
  if (!next) return null;
  return (
    <div className="mt-1.5 flex flex-col items-center gap-1">
      <button type="button" onClick={onClick} disabled={loading} className={`${QUIET} w-full`}>
        {loading ? 'Loading…' : label}
      </button>
      {error ? <p role="alert" className="text-[11px] text-danger">{error}</p> : null}
    </div>
  );
}

function Section<R extends PortfolioRowBase>({
  group,
  groupsKey,
  params,
  version,
  currency,
  defaultOpen,
  renderRow,
  onRowsLoaded,
}: {
  group: PortfolioGroup;
  /** The joined keys of every group currently shown, so this section's
   *  `open` state can be reset below when the *set* of groups changes (a
   *  filter change can shift which index this group sits at, or shift the
   *  total across the "4 or fewer" line) even though React reuses this same
   *  component instance (its own `key` — this group's key alone — didn't
   *  change). Merely opening/closing this one section does not change it. */
  groupsKey: string;
  params: PortfolioParams;
  version: number;
  currency: CurrencyCode;
  defaultOpen: boolean;
  renderRow: PortfolioRowRenderer<R>;
  onRowsLoaded: (rows: R[]) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  // Re-applies the start-open rule whenever the group set changes, adjusted
  // during render (no effect). A section this flips from closed to open was
  // never fetched (it was disabled), so it fetches page one below — accepted,
  // since the group set changing already means the list moved under the user.
  const [seenGroups, setSeenGroups] = useState(groupsKey);
  if (seenGroups !== groupsKey) {
    setSeenGroups(groupsKey);
    setOpen(defaultOpen);
  }
  const bodyId = useId();
  const page = usePagedPortfolio<R, FilterOptions>(
    toApiQuery(params, { group_value: group.key, limit: String(SECTION_PAGE_SIZE) }),
    open,
    version,
    onRowsLoaded,
  );
  return (
    <section>
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((value) => !value)}
          className={`flex w-full min-h-11 sm:min-h-9 items-center gap-2 rounded-lg px-1 text-left text-[13px] font-semibold text-ink hover:bg-subtle ${FOCUS}`}
        >
          <ChevronRight
            className={`w-4 h-4 text-ink-muted transition-transform duration-[var(--dur-fast)] ${open ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
          {group.label}{' '}
          <span className="font-normal text-ink-muted">
            {' · '}
            <span className="font-mono-brand tabular-nums">{group.count}</span>
            {' · '}
            <span className="font-mono-brand tabular-nums">{formatCompactMoney(group.arr, currency)}</span>
          </span>
        </button>
      </h2>
      {open ? (
        <div id={bodyId} className="mt-1.5">
          {page.error && page.rows.length === 0 ? (
            <p role="alert" className="flex items-center gap-2 px-1 text-[13px] text-danger">
              {page.error}
              <button type="button" onClick={page.retry} className={QUIET}>
                Try again
              </button>
            </p>
          ) : page.loading && page.rows.length === 0 ? (
            <RowSkeleton count={Math.min(3, group.count)} />
          ) : (
            <ul className="flex flex-col gap-1.5" aria-busy={page.loading}>
              {page.rows.map((row) => renderRow(row, { loading: page.loading }))}
            </ul>
          )}
          <MoreButton
            next={page.next}
            loading={page.loadingMore}
            error={page.moreError}
            label={`Show more ${group.label}`}
            onClick={() => void page.loadMore()}
          />
        </div>
      ) : null}
    </section>
  );
}

/** The list body: grouped sections (each with its own pages) or one flat
 *  list, plus the loading, empty and error states spec §1 asks for. */
export function PortfolioSections<R extends PortfolioRowBase>({
  params,
  version,
  portfolio,
  currency,
  filtered,
  renderRow,
  onRowsLoaded,
  onClearFilters,
  onAdd,
}: {
  params: PortfolioParams;
  version: number;
  portfolio: PortfolioState<R, FilterOptions>;
  currency: CurrencyCode;
  filtered: boolean;
  renderRow: PortfolioRowRenderer<R>;
  /** Rows that just landed (a page one or a `loadMore` append), for a
   *  pinned-fields cache or the like. It only ever *adds* — it must never be
   *  used to prune the selection against these rows (grouped mode has no one
   *  full row set to prune against, and flat mode prunes only when
   *  `portfolio.loadedQuery` changes, not on every append this callback
   *  also sees). */
  onRowsLoaded: (rows: R[]) => void;
  onClearFilters: () => void;
  onAdd: () => void;
}) {
  const kind = usePortfolioKind();
  const { data, error } = portfolio;
  if (!data && error) return <ErrorBlock message={error} onRetry={portfolio.retry} />;
  if (!data) return <RowSkeleton count={6} />;

  if (data.count === 0) {
    return filtered ? (
      <EmptyState
        title={`No ${kind.noun.many} match these filters`}
        detail="Remove a filter, or clear them all."
        action={
          <button type="button" onClick={onClearFilters} className={`${QUIET} border border-line`}>
            Clear filters
          </button>
        }
      />
    ) : (
      <EmptyState
        title={`No ${kind.noun.many} yet`}
        detail={`Add an ${kind.noun.one} to start your portfolio.`}
        action={
          <button type="button" onClick={onAdd} className={`${QUIET} bg-accent text-on-accent hover:bg-accent-hover`}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            {`Add ${kind.noun.one}`}
          </button>
        }
      />
    );
  }

  // `error` is a stale-but-still-shown re-fetch failure (spec §1: keep the
  // last good list rather than blank it) and already ends in its own period
  // (e.g. "Could not load organizations."), so appending a sentence needs
  // its own leading capital, not a second period run on from the first.
  const staleError = error ? (
    <p role="alert" className="flex items-center gap-2 text-[13px] text-danger">
      {error} Showing the last result.
      <button type="button" onClick={portfolio.retry} className={QUIET}>
        Try again
      </button>
    </p>
  ) : null;

  if (params.group === '') {
    return (
      <div aria-busy={portfolio.loading}>
        {/* The flat list's own heading, so an opened row's panels (h3) sit
            under it rather than under the last summary tile's. */}
        <h2 className="sr-only">{`${capitalise(kind.noun.many)} list`}</h2>
        {staleError}
        <ul className="flex flex-col gap-1.5">
          {portfolio.rows.map((row) => renderRow(row, { loading: portfolio.loading }))}
        </ul>
        <MoreButton
          next={portfolio.next}
          loading={portfolio.loadingMore}
          error={portfolio.moreError}
          label={`Show more ${kind.noun.many}`}
          onClick={() => void portfolio.loadMore()}
        />
      </div>
    );
  }

  const groupsKey = data.groups.map((group) => group.key).join('|');

  return (
    <div className="flex flex-col gap-4" aria-busy={portfolio.loading}>
      {staleError}
      {data.groups.map((group, index) => (
        <Section
          key={group.key}
          group={group}
          groupsKey={groupsKey}
          params={params}
          version={version}
          currency={currency}
          defaultOpen={sectionStartsOpen(index, data.groups.length)}
          renderRow={renderRow}
          onRowsLoaded={onRowsLoaded}
        />
      ))}
    </div>
  );
}
