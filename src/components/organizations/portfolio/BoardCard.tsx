import { memo, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { PanelRight } from 'lucide-react';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import { LIFECYCLE_LABELS, formatCompactMoney } from '../../../features/customers/formatters';
import { LIFECYCLE_VALUES } from '../../../features/organizations/portfolioParams';
import type { LifecycleValue, PortfolioRow, PortfolioRowBase } from '../../../features/organizations/portfolioTypes';
import { MoveToMenu } from './MoveToMenu';
import { usePortfolioKind } from './portfolioKind';
import { HealthRing, SignalTag, TrendLine } from './rowParts';
import { FOCUS } from './styles';

/** The id of the Board's side panel (AccountSidePanel), which an open card controls. */
export const DETAILS_PANEL_ID = 'board-account-details';

export interface BoardCardProps<R extends PortfolioRowBase = PortfolioRow> {
  row: R;
  currency: CurrencyCode;
  /** From `sm`. HTML5 drag has no touch support, so phones move with the menu only. */
  isSm: boolean;
  /** Its details are showing (side panel from `sm`, bottom sheet below). */
  open: boolean;
  /** Grouped by lifecycle: the card drags and has a Move to… menu. */
  canMove: boolean;
  /** A move is saving or settling (one at a time). */
  moveDisabled: boolean;
  /** Why moving is off, shown on the Move to… button when it is stuck. */
  moveNote?: string | null;
  onOpen: (row: R) => void;
  /** `fromMenu` is true for a Move to… choice (keyboard or touch), whose
   *  card should keep focus in its new column; a drag leaves focus alone. */
  onMove: (row: R, to: LifecycleValue, fromMenu?: boolean) => void;
  onDragStart: (row: R) => void;
  onDragEnd: () => void;
}

/** One account on the Board (spec §1 "Board"): AccountRow's phone-card
 *  content (ring, name, owner, then ARR, signal and trend) as a compact
 *  card. A click opens its details beside the board. The name links to the
 *  card's kind (Organizations: the organization page; Accounts: its own
 *  page). The header's Move to… icon button is the keyboard and
 *  touch path for a move; after one, the board keeps focus on this card's
 *  Open button (`data-part="open"`) in its new column. Memoised: dragging re-renders the board, and only
 *  the cards whose props change should follow. */
function BoardCardView<R extends PortfolioRowBase>({
  row,
  currency,
  isSm,
  open,
  canMove,
  moveDisabled,
  moveNote = null,
  onOpen,
  onMove,
  onDragStart,
  onDragEnd,
}: BoardCardProps<R>) {
  const kind = usePortfolioKind();
  // A record the kind cannot save from here (an account none of whose
  // organisations the viewer may open) neither drags nor has Move to….
  const movable = canMove && kind.editable(row);
  const draggable = isSm && movable && !moveDisabled;
  const arr = row.arr == null ? '—' : formatCompactMoney(row.arr, currency);
  const targets = LIFECYCLE_VALUES.filter((value) => value !== row.lifecycle.value).map((value) => ({
    value,
    label: LIFECYCLE_LABELS[value],
  }));

  const startDrag = (event: DragEvent<HTMLLIElement>) => {
    // jsdom has no DataTransfer. Browsers get the id so Firefox starts the drag.
    event.dataTransfer?.setData('text/plain', String(row.id));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    onDragStart(row);
  };

  return (
    <li
      data-card-id={row.id}
      draggable={draggable}
      onDragStart={draggable ? startDrag : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      onClick={() => onOpen(row)}
      className={`cursor-pointer rounded-xl bg-surface p-3 transition-shadow duration-[var(--dur-fast)] hover:shadow-sm ${
        open ? 'ring-1 ring-accent' : ''
      } ${draggable ? 'active:cursor-grabbing' : ''}`}
    >
      <div data-part="card-header" className="flex items-start gap-2.5">
        <HealthRing score={row.health.score} category={row.health.category} />
        <div className="min-w-0 flex-1">
          <Link
            to={kind.href(row)}
            state={kind.linkState(row)}
            draggable={false}
            onClick={(event) => event.stopPropagation()}
            className={`flex min-h-11 min-w-0 items-center truncate rounded-sm text-[13px] font-semibold text-ink hover:underline sm:block sm:min-h-0 ${FOCUS}`}
          >
            <span className="truncate">{row.name}</span>
          </Link>
          <p className="truncate text-[11px] text-ink-muted">{kind.cardSubtitle(row)}</p>
        </div>
        {movable ? (
          <MoveToMenu
            name={row.name}
            disabled={moveDisabled}
            note={moveNote}
            targets={targets}
            onChoose={(to) => onMove(row, to as LifecycleValue, true)}
          />
        ) : null}
        <button
          data-part="open"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(row);
          }}
          aria-expanded={open}
          aria-controls={open && isSm ? DETAILS_PANEL_ID : undefined}
          aria-label={open ? `Close ${row.name}` : `Open ${row.name}`}
          className={`inline-flex w-11 h-11 sm:w-9 sm:h-9 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-subtle active:bg-line-subtle ${FOCUS}`}
        >
          <PanelRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 flex min-w-0 items-center gap-2">
        <span className="font-mono-brand tabular-nums text-[13px] text-ink">{arr}</span>
        <SignalTag signal={row.signal} />
        <TrendLine trend={row.health.trend} category={row.health.category} className="ml-auto" />
      </div>
    </li>
  );
}

/** Memoised (see above). `memo` drops the row's type parameter; the cast
 *  gives it back. */
export const BoardCard = memo(BoardCardView) as typeof BoardCardView;
