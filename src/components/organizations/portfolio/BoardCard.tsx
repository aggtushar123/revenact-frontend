import { memo, useEffect, useRef, useState, type DragEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, PanelRight } from 'lucide-react';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import { LIFECYCLE_LABELS, formatCompactMoney } from '../../../features/customers/formatters';
import { LIFECYCLE_VALUES } from '../../../features/organizations/portfolioParams';
import type { LifecycleValue, PortfolioRow, PortfolioRowBase } from '../../../features/organizations/portfolioTypes';
import { usePortfolioKind } from './portfolioKind';
import { HealthRing, SignalTag, TrendLine } from './rowParts';
import { FOCUS } from './styles';
import { useDismiss } from './useDismiss';

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

/** The menu's tallest height (seven 32px items plus `py-1`) and its gap. */
const MENU_MAX = 224;
const MENU_GAP = 4;
/** Never squeeze the menu below two items: it scrolls instead. */
const MENU_MIN = 88;

/** The part of the screen `el` can actually be seen in: the window,
 *  intersected with every ancestor that clips its overflow (a desktop
 *  column's scroller, the phone panel strip, the page frame). A column that
 *  runs past the bottom of the window only counts down to the window. */
function visibleBox(el: HTMLElement): { top: number; bottom: number } {
  let top = 0;
  let bottom = window.innerHeight;
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowX, overflowY } = window.getComputedStyle(node);
    if (/auto|scroll|hidden|clip/.test(`${overflowX} ${overflowY}`)) {
      const bounds = node.getBoundingClientRect();
      top = Math.max(top, bounds.top);
      bottom = Math.min(bottom, bounds.bottom);
    }
  }
  return { top, bottom };
}

/** Where the menu goes. It hangs off the button (absolutely positioned, no
 *  portal), so it opens on whichever side of the button has room inside the
 *  visible box, preferring below, and its height is capped to that room (it
 *  scrolls) so no stage is ever cut off. */
function placeMenu(button: HTMLElement): { upward: boolean; maxHeight: number } {
  const box = visibleBox(button);
  const rect = button.getBoundingClientRect();
  const below = box.bottom - rect.bottom - MENU_GAP;
  const above = rect.top - box.top - MENU_GAP;
  const upward = below < MENU_MAX && above > below;
  const room = upward ? above : below;
  return { upward, maxHeight: Math.max(MENU_MIN, Math.min(MENU_MAX, room)) };
}

/** The card's "Move to…" control (controller ruling R1, browser finding
 *  B1): a compact icon button in the card header that opens a real menu of
 *  the other stages, so nothing moves until one is chosen. Arrow Up/Down,
 *  Home and End move between items. Escape and choosing an item close the
 *  menu and return focus to the button. A press outside closes it and leaves
 *  focus where the user put it, and Tab closes it as focus moves on. Opening
 *  another card's menu closes this one (the press is outside it). */
function MoveToMenu<R extends PortfolioRowBase>({
  row,
  disabled,
  note,
  targets,
  onMove,
}: {
  row: R;
  disabled: boolean;
  note: string | null;
  targets: LifecycleValue[];
  onMove: (row: R, to: LifecycleValue, fromMenu?: boolean) => void;
}) {
  const [openMenu, setOpenMenu] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState({ upward: false, maxHeight: MENU_MAX });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const closeMenu = () => {
    setOpenMenu(false);
    buttonRef.current?.focus();
  };

  useDismiss([menuRef, buttonRef], (reason) => (reason === 'escape' ? closeMenu() : setOpenMenu(false)), openMenu);

  useEffect(() => {
    if (openMenu) itemRefs.current[activeIndex]?.focus();
  }, [openMenu, activeIndex]);

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const last = targets.length - 1;
    const to: Record<string, (i: number) => number> = {
      ArrowDown: (i) => (i + 1) % targets.length,
      ArrowUp: (i) => (i - 1 + targets.length) % targets.length,
      Home: () => 0,
      End: () => last,
    };
    if (to[event.key]) {
      event.preventDefault();
      setActiveIndex(to[event.key]);
    } else if (event.key === 'Tab') {
      // Let the browser move focus on first, then close: unmounting the
      // focused item inside the keydown would leave the Tab nowhere to go.
      window.setTimeout(() => setOpenMenu(false), 0);
    }
  };

  return (
    <span className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={openMenu}
        aria-label={`Move ${row.name} to…`}
        title={disabled && note ? note : undefined}
        onClick={(event) => {
          event.stopPropagation();
          setActiveIndex(0);
          if (!openMenu && buttonRef.current) setPlacement(placeMenu(buttonRef.current));
          setOpenMenu((was) => !was);
        }}
        className={`inline-flex min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-subtle hover:text-ink active:bg-line-subtle disabled:opacity-50 ${FOCUS}`}
      >
        <ArrowRightLeft className="w-4 h-4" aria-hidden="true" />
      </button>
      {openMenu ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Move ${row.name} to`}
          onKeyDown={onMenuKeyDown}
          onClick={(event) => event.stopPropagation()}
          style={{ maxHeight: placement.maxHeight }}
          className={`absolute right-0 z-20 flex w-44 ${placement.upward ? 'bottom-full mb-1' : 'top-full mt-1'} flex-col overflow-y-auto rounded-lg border border-line bg-elevated py-1 shadow-md`}
        >
          {targets.map((value, index) => (
            <button
              key={value}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                onMove(row, value, true);
                closeMenu();
              }}
              className={`flex min-h-11 sm:min-h-8 shrink-0 items-center px-3 text-left text-[13px] text-ink hover:bg-subtle focus-visible:bg-subtle ${FOCUS}`}
            >
              {LIFECYCLE_LABELS[value]}
            </button>
          ))}
        </div>
      ) : null}
    </span>
  );
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
  const targets = LIFECYCLE_VALUES.filter((value) => value !== row.lifecycle.value);

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
        {movable ? <MoveToMenu row={row} disabled={moveDisabled} note={moveNote} targets={targets} onMove={onMove} /> : null}
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
