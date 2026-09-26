import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { PanelRight } from 'lucide-react';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import { LIFECYCLE_LABELS, formatCompactMoney } from '../../../features/customers/formatters';
import { PORTFOLIO_FIELDS } from '../../../features/organizations/portfolioFields';
import { LIFECYCLE_VALUES } from '../../../features/organizations/portfolioParams';
import type { LifecycleValue, PortfolioRow } from '../../../features/organizations/portfolioTypes';
import { HealthRing, SignalTag, TrendLine } from './rowParts';
import { FOCUS } from './styles';

/** The id of the Board's side panel (AccountSidePanel), which an open card controls. */
export const DETAILS_PANEL_ID = 'board-account-details';

export interface BoardCardProps {
  row: PortfolioRow;
  currency: CurrencyCode;
  /** From `sm`. HTML5 drag has no touch support, so phones move with the menu only. */
  isSm: boolean;
  /** Its details are showing (side panel from `sm`, bottom sheet below). */
  open: boolean;
  /** Grouped by lifecycle: the card drags and has a Move to… menu. */
  canMove: boolean;
  /** A move is saving (one at a time). */
  moveDisabled: boolean;
  onOpen: (row: PortfolioRow) => void;
  onMove: (row: PortfolioRow, to: LifecycleValue) => void;
  onDragStart: (row: PortfolioRow) => void;
  onDragEnd: () => void;
}

/** The Board's "Move to…" control (controller ruling R1): a button, not a
 *  native `<select>` acting on change, so nothing moves until a stage is
 *  chosen from a real menu. Arrow Up/Down move between items; Escape and an
 *  outside click both close the menu and return focus to the button. */
function MoveToMenu({
  row,
  disabled,
  targets,
  onMove,
}: {
  row: PortfolioRow;
  disabled: boolean;
  targets: LifecycleValue[];
  onMove: (row: PortfolioRow, to: LifecycleValue) => void;
}) {
  const [openMenu, setOpenMenu] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Escape and choosing an item hand focus back to the button. An outside
  // click doesn't: the user moved focus somewhere on purpose, so the
  // browser's own focus change is left alone instead of being fought right
  // after (the same rule as PinFieldsMenu's `restoreFocus`).
  const closeMenu = () => {
    setOpenMenu(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (openMenu) itemRefs.current[activeIndex]?.focus();
  }, [openMenu, activeIndex]);

  useEffect(() => {
    if (!openMenu) return;
    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpenMenu(false);
    };
    document.addEventListener('click', onOutsideClick);
    return () => document.removeEventListener('click', onOutsideClick);
  }, [openMenu]);

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % targets.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + targets.length) % targets.length);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    }
  };

  return (
    <span className="relative mt-2 block">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={openMenu}
        onClick={(event) => {
          event.stopPropagation();
          setActiveIndex(0);
          setOpenMenu((was) => !was);
        }}
        className={`flex min-h-11 w-full sm:min-h-8 items-center justify-center rounded-lg border border-line bg-surface px-2 text-[13px] text-ink-muted hover:border-line-strong hover:text-ink active:bg-line-subtle disabled:opacity-50 ${FOCUS}`}
      >
        Move to…
      </button>
      {openMenu ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Move ${row.name} to`}
          onKeyDown={onMenuKeyDown}
          onClick={(event) => event.stopPropagation()}
          className="absolute inset-x-0 top-full z-20 mt-1 flex max-h-56 flex-col overflow-y-auto rounded-lg border border-line bg-elevated py-1 shadow-md"
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
                onMove(row, value);
                closeMenu();
              }}
              className={`flex min-h-11 sm:min-h-8 items-center px-3 text-left text-[13px] text-ink hover:bg-subtle focus-visible:bg-subtle ${FOCUS}`}
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
 *  organization page. Move to… is the keyboard and touch path for a move. */
export function BoardCard({
  row,
  currency,
  isSm,
  open,
  canMove,
  moveDisabled,
  onOpen,
  onMove,
  onDragStart,
  onDragEnd,
}: BoardCardProps) {
  const draggable = isSm && canMove && !moveDisabled;
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
      <div className="flex items-start gap-2.5">
        <HealthRing score={row.health.score} category={row.health.category} />
        <div className="min-w-0 flex-1">
          <Link
            to={`/organizations/${row.id}`}
            draggable={false}
            onClick={(event) => event.stopPropagation()}
            className={`flex min-h-11 min-w-0 items-center truncate rounded-sm text-[13px] font-semibold text-ink hover:underline sm:block sm:min-h-0 ${FOCUS}`}
          >
            <span className="truncate">{row.name}</span>
          </Link>
          <p className="truncate text-[11px] text-ink-muted">{PORTFOLIO_FIELDS.owner.value(row)}</p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(row);
          }}
          aria-expanded={open}
          aria-controls={open && isSm ? DETAILS_PANEL_ID : undefined}
          aria-label={open ? `Close ${row.name}` : `Open ${row.name}`}
          className={`inline-flex w-11 h-11 sm:w-8 sm:h-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-subtle active:bg-line-subtle ${FOCUS}`}
        >
          <PanelRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 flex min-w-0 items-center gap-2">
        <span className="font-mono-brand tabular-nums text-[13px] text-ink">{arr}</span>
        <SignalTag signal={row.signal} />
        <TrendLine trend={row.health.trend} category={row.health.category} className="ml-auto" />
      </div>
      {canMove ? <MoveToMenu row={row} disabled={moveDisabled} targets={targets} onMove={onMove} /> : null}
    </li>
  );
}
