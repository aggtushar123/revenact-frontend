import { useId, useState, type DragEvent, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import { formatCompactMoney } from '../../../features/customers/formatters';
import type { LifecycleValue, PortfolioRow } from '../../../features/organizations/portfolioTypes';
import { BoardCard } from './BoardCard';
import { useOverlayActive, withMovedRow, type BoardColumnSpec, type BoardMove } from './boardMove';
import { MoreButton } from './PortfolioSections';
import { useEndSentinel } from './useEndSentinel';
import { usePagedPortfolio } from './usePortfolio';
import { FOCUS, QUIET } from './styles';

export interface BoardColumnProps {
  /** The header's figures, already adjusted for an optimistic move. */
  spec: BoardColumnSpec;
  /** This column's read: the view's query plus group_value and limit. */
  query: string;
  /** Whether to read at all: false for a column the server counts empty
   *  and for the drop-only Churn column. */
  enabled: boolean;
  version: number;
  currency: CurrencyCode;
  isSm: boolean;
  canMove: boolean;
  saving: boolean;
  move: BoardMove | null;
  filtered: boolean;
  openId: number | null;
  /** The card being dragged, if any (held by the board, not read back from dataTransfer). */
  dragging: PortfolioRow | null;
  onOpen: (row: PortfolioRow) => void;
  onMove: (row: PortfolioRow, to: LifecycleValue) => void;
  onDragStart: (row: PortfolioRow) => void;
  onDragEnd: () => void;
  onRowsLoaded: (rows: PortfolioRow[]) => void;
  onShowChurned: () => void;
  /** Lifecycle columns other than Churn (ruling R2): the header's "+" adds
   *  an organization already in this stage. Absent, there is no "+". */
  onAdd?: (stage: LifecycleValue) => void;
  /** Phones: the panel the column tabs scroll to. */
  panelRef?: (element: HTMLElement | null) => void;
}

/** Card-shaped loading placeholders. */
export function CardSkeleton({ label, count }: { label: string; count: number }) {
  return (
    <div role="status" aria-label={`Loading ${label}`}>
      <ul aria-hidden="true" className="flex flex-col gap-2">
        {Array.from({ length: Math.max(1, count) }, (_, i) => (
          <li key={i} className="flex flex-col gap-2 rounded-xl bg-surface p-3">
            <span className="flex items-center gap-2.5">
              <span className="h-10 w-10 animate-pulse rounded-full bg-subtle" />
              <span className="flex flex-1 flex-col gap-1.5">
                <span className="block h-3 w-28 animate-pulse rounded bg-subtle" />
                <span className="block h-2.5 w-20 animate-pulse rounded bg-subtle" />
              </span>
            </span>
            <span className="block h-3 w-24 animate-pulse rounded bg-subtle" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One Board column (spec §1 "Board"): its own cursor-paged read
 *  (group_value=<key>) that loads its next page when its end scrolls into
 *  view, with a visible Show more as the fallback. Lifecycle columns are
 *  drop targets. The column has no surface of its own (cards are the items). */
export function BoardColumn({
  spec,
  query,
  enabled,
  version,
  currency,
  isSm,
  canMove,
  saving,
  move,
  filtered,
  openId,
  dragging,
  onOpen,
  onMove,
  onDragStart,
  onDragEnd,
  onRowsLoaded,
  onShowChurned,
  onAdd,
  panelRef,
}: BoardColumnProps) {
  const headingId = useId();
  const [over, setOver] = useState(false);
  const page = usePagedPortfolio(query, enabled, version, onRowsLoaded);
  // The move shows here until this column's own fresh page one lands.
  const overlay = useOverlayActive(move?.token ?? null, page.loadedKey);
  const loaded = enabled ? page.rows : [];
  const rows = overlay ? withMovedRow(loaded, spec.key, move) : loaded;
  const sentinelRef = useEndSentinel(
    () => void page.loadMore(),
    enabled && page.next !== null && !page.loadingMore && page.moreError === null,
  );
  const dropEnabled = canMove && !saving && dragging !== null && dragging.lifecycle.value !== spec.key;

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    if (!dropEnabled) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    if (!over) setOver(true);
  };
  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setOver(false);
  };
  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setOver(false);
    if (dropEnabled && dragging) onMove(dragging, spec.key as LifecycleValue);
  };

  let body: ReactNode;
  if (spec.dropOnly) {
    body = (
      <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-line p-3 text-[13px] text-ink-muted">
        <p>Churned accounts are hidden.</p>
        <p>{isSm ? 'Drop a card here to churn it.' : 'Use a card’s Move to… menu to churn it.'}</p>
        <button type="button" onClick={onShowChurned} className={`${QUIET} border border-line`}>
          Show churned
        </button>
      </div>
    );
  } else if (page.error && rows.length === 0) {
    body = (
      <p role="alert" className="flex flex-wrap items-center gap-2 text-[13px] text-danger">
        {page.error}
        <button type="button" onClick={page.retry} className={QUIET}>
          Try again
        </button>
      </p>
    );
  } else if (enabled && page.loading && rows.length === 0) {
    body = <CardSkeleton label={spec.label} count={Math.min(3, spec.count)} />;
  } else if (rows.length === 0) {
    body = (
      <p className="rounded-xl border border-dashed border-line p-3 text-[13px] text-ink-muted">
        {filtered ? 'None match these filters.' : `No organizations in ${spec.label}.`}
      </p>
    );
  } else {
    body = (
      <ul className="flex flex-col gap-2" aria-busy={page.loading}>
        {rows.map((row) => (
          <BoardCard
            key={row.id}
            row={row}
            currency={currency}
            isSm={isSm}
            open={openId === row.id}
            canMove={canMove}
            moveDisabled={saving}
            onOpen={onOpen}
            onMove={onMove}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        <li ref={sentinelRef} data-sentinel="" aria-hidden="true" className="h-px" />
      </ul>
    );
  }

  return (
    <section
      ref={panelRef}
      data-column={spec.key}
      aria-labelledby={headingId}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex min-h-0 shrink-0 flex-col gap-2 rounded-xl p-1 transition-colors duration-[var(--dur-fast)] ${
        isSm ? 'w-72' : 'w-full snap-start'
      } ${over ? 'bg-accent-dim ring-2 ring-accent' : ''}`}
    >
      <div className="flex items-center gap-1">
        <h2 id={headingId} className="min-w-0 flex-1 truncate px-1 text-[13px] font-semibold text-ink">
          {spec.label}
          {spec.dropOnly ? null : (
            <span className="font-normal text-ink-muted">
              {' · '}
              <span data-part="count" className="font-mono-brand tabular-nums">
                {spec.count}
              </span>
              {' · '}
              <span data-part="arr" className="font-mono-brand tabular-nums">
                {formatCompactMoney(spec.arr, currency)}
              </span>
            </span>
          )}
        </h2>
        {onAdd && spec.key !== 'churn' ? (
          <button
            type="button"
            onClick={() => onAdd(spec.key as LifecycleValue)}
            aria-label={`Add organization to ${spec.label}`}
            className={`inline-flex min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-subtle hover:text-ink active:bg-line-subtle ${FOCUS}`}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className={isSm ? 'min-h-0 flex-1 overflow-y-auto' : ''}>
        {body}
        <MoreButton
          next={enabled ? page.next : null}
          loading={page.loadingMore}
          error={page.moreError}
          label={`Show more ${spec.label}`}
          onClick={() => void page.loadMore()}
        />
      </div>
    </section>
  );
}
