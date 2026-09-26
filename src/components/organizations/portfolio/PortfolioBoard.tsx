import { useCallback, useEffect, useRef, useState, type UIEvent } from 'react';
import { Plus } from 'lucide-react';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import { includesChurned, toApiQuery, type PortfolioParams } from '../../../features/organizations/portfolioParams';
import type { LifecycleValue, PortfolioRow } from '../../../features/organizations/portfolioTypes';
import { BoardColumn } from './BoardColumn';
import { boardColumns, useOverlayActive, withMove, type BoardMove } from './boardMove';
import { EmptyState, ErrorBlock } from './PortfolioSections';
import { SECTION_PAGE_SIZE, type PortfolioState } from './usePortfolio';
import { FOCUS, QUIET } from './styles';

/** The phone panels' gap (`gap-3`), for reading which panel a swipe rests on. */
const PANEL_GAP = 12;
/** How long a tab's smooth scroll may take before swipes are followed again
 *  even if it never arrived (the user swiped mid-way). */
const JUMP_MS = 1000;
const PAUSED = 'Moving is paused until the board reloads.';

export interface PortfolioBoardProps {
  /** The Board's params (boardParams): `group` is never '' here. */
  params: PortfolioParams;
  /** The frame read: groups (the column headers), count and currency. */
  portfolio: PortfolioState;
  /** Reloads everything when bumped (Add, Edit, Churn). */
  version: number;
  /** Per-column reload counters, bumped for the two columns a move touched. */
  columnBumps: Record<string, number>;
  currency: CurrencyCode;
  isSm: boolean;
  /** The Ask rail is open beside the board (from `sm`): columns are w-64
   *  rather than w-72, so more of them fit beside it. */
  narrow?: boolean;
  filtered: boolean;
  move: BoardMove | null;
  /** A move is saving or settling: moving is off (one at a time). */
  saving: boolean;
  openId: number | null;
  onOpen: (row: PortfolioRow) => void;
  onMove: (row: PortfolioRow, to: LifecycleValue) => void;
  onRowsLoaded: (rows: PortfolioRow[]) => void;
  onClearFilters: () => void;
  /** Add an organization: from the empty state with no stage, or from a
   *  lifecycle column's "+" with that stage (ruling R2). */
  onAdd: (stage?: LifecycleValue) => void;
  onShowChurned: () => void;
  /** A saved move's reloads have all landed (the frame and both columns),
   *  so the page can forget it and allow the next one. */
  onMoveSettled: (token: number) => void;
}

function BoardSkeleton({ isSm, narrow }: { isSm: boolean; narrow: boolean }) {
  return (
    <div role="status" aria-label="Loading the board" className="flex gap-3 overflow-hidden">
      {Array.from({ length: isSm ? 4 : 1 }, (_, i) => (
        <div key={i} aria-hidden="true" className={`flex shrink-0 flex-col gap-2 p-1 ${isSm ? (narrow ? 'w-64' : 'w-72') : 'w-full'}`}>
          <span className="block h-3 w-24 animate-pulse rounded bg-subtle" />
          {[0, 1, 2].map((j) => (
            <span key={j} className="block h-24 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** The Board's body (spec §1 "Board", owner decisions 2026-09-26). Columns
 *  are the groups; grouped by lifecycle every stage is a column and cards
 *  move between them. From `sm` the columns sit in a row that scrolls
 *  sideways, and each column scrolls on its own. Below `sm` they are
 *  full-width panels that snap, with a strip of column tabs. */
export function PortfolioBoard({
  params,
  portfolio,
  version,
  columnBumps,
  currency,
  isSm,
  narrow = false,
  filtered,
  move,
  saving,
  openId,
  onOpen,
  onMove,
  onRowsLoaded,
  onClearFilters,
  onAdd,
  onShowChurned,
  onMoveSettled,
}: PortfolioBoardProps) {
  const [dragging, setDragging] = useState<PortfolioRow | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<number | null>(null);
  const [handed, setHanded] = useState<{ token: number; keys: string[] } | null>(null);
  const panels = useRef(new Map<string, HTMLElement>());
  const jumping = useRef<{ key: string; until: number } | null>(null);
  // The header counts show the move until the frame's own reload lands.
  const countsMoved = useOverlayActive(move?.token ?? null, portfolio.loadedKey);
  const { data, error } = portfolio;

  // The columns belong to the frame on screen. While a new frame loads (a
  // group, filter or sort change, or a reload), `data` is still the old one,
  // so the columns keep the inputs that frame was read with: no column reads
  // `group=<new>&group_value=<old key>`, or enables on a stale count. They
  // move on together once the new frame lands. Adjusted during render.
  const current = { params, version, columnBumps };
  const [frameInputs, setFrameInputs] = useState(current);
  const fresh = !portfolio.loading && !error;
  if (
    fresh &&
    (frameInputs.params !== params || frameInputs.version !== version || frameInputs.columnBumps !== columnBumps)
  ) {
    setFrameInputs(current);
  }
  const inputs = fresh ? current : frameInputs;

  const group = inputs.params.group || 'lifecycle';
  const canMove = group === 'lifecycle';
  const columns = data ? boardColumns(group, data.groups, includesChurned(inputs.params)) : [];
  const reads = (key: string) => columns.some((spec) => spec.key === key && spec.count > 0 && !spec.dropOnly);

  // A saved move settles when the frame's reload has landed and each of its
  // two columns has handed over to its own fresh page (or reads nothing).
  const columnDone = (key: string) => (handed !== null && handed.token === move?.token && handed.keys.includes(key)) || !reads(key);
  const settled =
    move?.saved === true && fresh && !countsMoved && columnDone(move.from) && columnDone(move.to);
  useEffect(() => {
    if (settled && move) onMoveSettled(move.token);
  }, [settled, move, onMoveSettled]);

  const onHandedOver = useCallback((key: string, token: number) => {
    setHanded((was) =>
      was?.token === token ? (was.keys.includes(key) ? was : { token, keys: [...was.keys, key] }) : { token, keys: [key] },
    );
  }, []);

  // Stable, so the memoised cards don't all re-render on every board render.
  const moveCard = useCallback(
    (row: PortfolioRow, to: LifecycleValue, fromMenu = false) => {
      setDragging(null);
      // A Move to… choice (keyboard or touch): the card remounts in its new
      // column and focus follows it there. A mouse drag leaves focus alone,
      // and Churn opens a modal that takes focus itself.
      if (fromMenu && to !== 'churn') setFocusId(row.id);
      onMove(row, to);
    },
    [onMove],
  );
  const endDrag = useCallback(() => setDragging(null), []);

  // Focus is held on the moved card until its move settles (or fails, or is
  // reset): the move is then gone. Adjusted during render.
  const [focusFor, setFocusFor] = useState<number | null>(null);
  if (focusId !== null && move !== null && focusFor !== move.token) setFocusFor(move.token);
  if (focusId !== null && move === null && focusFor !== null) {
    setFocusId(null);
    setFocusFor(null);
  }

  // The user moving focus somewhere else themselves releases it.
  useEffect(() => {
    if (focusId === null) return;
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(`[data-card-id="${focusId}"]`)) setFocusId(null);
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [focusId]);

  // A drag the card never hears the end of (dropped outside the window, or
  // its card unmounted mid-drag by a reload) must not leave `dragging` set.
  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('dragend', endDrag);
    window.addEventListener('drop', endDrag);
    return () => {
      window.removeEventListener('dragend', endDrag);
      window.removeEventListener('drop', endDrag);
    };
  }, [dragging, endDrag]);

  if (!data && error) return <ErrorBlock message={error} onRetry={portfolio.retry} />;
  if (!data) return <BoardSkeleton isSm={isSm} narrow={narrow} />;
  if (data.count === 0) {
    return filtered ? (
      <EmptyState
        title="No organizations match these filters"
        detail="Remove a filter, or clear them all."
        action={
          <button type="button" onClick={onClearFilters} className={`${QUIET} border border-line`}>
            Clear filters
          </button>
        }
      />
    ) : (
      <EmptyState
        title="No organizations yet"
        detail="Add an organization to start your portfolio."
        action={
          <button type="button" onClick={() => onAdd()} className={`${QUIET} bg-accent text-on-accent hover:bg-accent-hover`}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add organization
          </button>
        }
      />
    );
  }

  const shown = columns.map((spec) => (countsMoved ? withMove(spec, move) : spec));
  const activeKey = active !== null && shown.some((spec) => spec.key === active) ? active : (shown[0]?.key ?? null);

  // `at` is the click's event timeStamp, the clock the scroll events use.
  const jump = (key: string, at: number) => {
    setActive(key);
    jumping.current = { key, until: at + JUMP_MS };
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    panels.current.get(key)?.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', inline: 'start', block: 'nearest' });
  };

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (el.clientWidth === 0) return;
    const key = shown[Math.round(el.scrollLeft / (el.clientWidth + PANEL_GAP))]?.key;
    // A tab's smooth scroll passes the panels between: ignore them until it
    // arrives, so aria-current doesn't flicker through every stage.
    const pending = jumping.current;
    if (pending) {
      if (key === pending.key || event.timeStamp > pending.until) jumping.current = null;
      else return;
    }
    if (key && key !== activeKey) setActive(key);
  };

  // A saved move settles only once the frame reloads, so while that reload
  // is failing, moving stays off: say why, on the alert and on each control.
  const paused = error !== null && move !== null;
  const staleError = error ? (
    <p role="alert" className="flex items-center gap-2 text-[13px] text-danger">
      {error} Showing the last result.{paused ? ` ${PAUSED}` : ''}
      <button type="button" onClick={portfolio.retry} className={QUIET}>
        Try again
      </button>
    </p>
  ) : null;

  const columnEls = columns.map((spec, index) => (
    <BoardColumn
      key={spec.key}
      spec={shown[index]}
      query={toApiQuery(inputs.params, { group_value: spec.key, limit: String(SECTION_PAGE_SIZE) })}
      enabled={spec.count > 0 && !spec.dropOnly}
      version={inputs.version + (inputs.columnBumps[spec.key] ?? 0)}
      currency={currency}
      isSm={isSm}
      narrow={narrow}
      canMove={canMove}
      saving={saving}
      pausedNote={paused ? PAUSED : null}
      move={move}
      filtered={filtered}
      openId={openId}
      focusId={focusId}
      dragging={dragging}
      onOpen={onOpen}
      onMove={moveCard}
      onDragStart={setDragging}
      onDragEnd={endDrag}
      onHandedOver={onHandedOver}
      onRowsLoaded={onRowsLoaded}
      onShowChurned={onShowChurned}
      onAdd={canMove ? onAdd : undefined}
      panelRef={
        isSm
          ? undefined
          : (element) => {
              if (element) panels.current.set(spec.key, element);
              else panels.current.delete(spec.key);
            }
      }
    />
  ));

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2" aria-busy={portfolio.loading}>
      {staleError}
      {isSm ? (
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">{columnEls}</div>
      ) : (
        <>
          <nav aria-label="Board columns" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            {shown.map((spec) => (
              <button
                key={spec.key}
                type="button"
                aria-current={spec.key === activeKey ? 'true' : undefined}
                onClick={(event) => jump(spec.key, event.timeStamp)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] ${
                  spec.key === activeKey ? 'bg-accent-dim font-semibold text-ink' : 'text-ink-muted hover:bg-subtle active:bg-line-subtle'
                } ${FOCUS}`}
              >
                {spec.label}
                {spec.dropOnly ? null : (
                  <>
                    {' '}
                    <span className="font-mono-brand tabular-nums text-[11px]">{spec.count}</span>
                  </>
                )}
              </button>
            ))}
          </nav>
          <div data-part="panels" onScroll={onScroll} className="flex snap-x snap-mandatory gap-3 overflow-x-auto">
            {columnEls}
          </div>
        </>
      )}
    </div>
  );
}
