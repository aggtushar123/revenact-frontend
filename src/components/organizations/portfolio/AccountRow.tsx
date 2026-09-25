import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { ColumnId } from '../tableData';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import { formatCompactMoney } from '../../../features/customers/formatters';
import { PORTFOLIO_FIELDS } from '../../../features/organizations/portfolioFields';
import type { PortfolioRow } from '../../../features/organizations/portfolioTypes';
import { SM, useMediaQuery } from '../../../lib/useMediaQuery';
import { HealthRing, PulsePair, RenewalRunway, SignalTag, TrendLine, touchText } from './rowParts';
import { FOCUS } from './styles';

export const LONG_PRESS_MS = 500;

export interface AccountRowProps {
  row: PortfolioRow;
  currency: CurrencyCode;
  pins: ColumnId[];
  /** Any row is selected: taps select instead of opening. */
  selecting: boolean;
  selected: boolean;
  /** While this row's own section (or the flat list) is loading, or a bulk
   *  action is running on it: its checkbox is disabled and a long press no
   *  longer starts selection. */
  selectDisabled?: boolean;
  /** The selection is at its 500-id cap. An unchecked checkbox is disabled
   *  (a checked one stays enabled, so it can still be unticked). */
  atLimit?: boolean;
  open: boolean;
  onToggleSelect: (id: number) => void;
  onLongPress: (id: number) => void;
  onToggleOpen: (row: PortfolioRow) => void;
  /** The opened row, inline (desktop). Phones open a sheet instead. */
  children?: ReactNode;
}

/** One account as a rounded item on the page (spec §1 "Account row").
 *  From `sm` it is a single line. Below `sm` the same elements wrap into a
 *  two-line card: ring, name and owner on top, then ARR, signal and trend
 *  (an `order-*` break element does the wrapping, so nothing renders twice). */
export function AccountRow({
  row,
  currency,
  pins,
  selecting,
  selected,
  selectDisabled = false,
  atLimit = false,
  open,
  onToggleSelect,
  onLongPress,
  onToggleOpen,
  children,
}: AccountRowProps) {
  const isSm = useMediaQuery(SM);
  const timer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const detailsId = `account-${row.id}-details`;
  const arr = row.arr == null ? '—' : formatCompactMoney(row.arr, currency);
  const checkboxDisabled = selectDisabled || (atLimit && !selected);
  const limitHint = atLimit && !selected ? '500 is the most you can select at once' : undefined;

  const cancelPress = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  // Unmounting mid-press (e.g. the list re-renders under a filter change)
  // must not fire a stray onLongPress once the timer elapses.
  useEffect(() => cancelPress, []);

  const startPress = (event: PointerEvent) => {
    // A mouse selects with the checkbox; long-press is for touch and pen.
    if (event.pointerType === 'mouse' || selectDisabled) return;
    longPressed.current = false;
    cancelPress();
    timer.current = window.setTimeout(() => {
      timer.current = null;
      longPressed.current = true;
      onLongPress(row.id);
    }, LONG_PRESS_MS);
  };

  const onRowClick = () => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    if (selecting) onToggleSelect(row.id);
    else onToggleOpen(row);
  };

  return (
    <li
      data-row-id={row.id}
      className={`group rounded-xl bg-surface transition-shadow duration-[var(--dur-fast)] hover:shadow-sm ${selected ? 'ring-1 ring-accent' : ''}`}
    >
      <div
        data-part="header"
        onClick={onRowClick}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        className="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5 cursor-pointer select-none sm:select-auto"
      >
        <label
          onClick={(event) => event.stopPropagation()}
          className={`shrink-0 items-center justify-center w-11 h-11 -m-2 sm:w-6 sm:h-6 sm:m-0 ${
            selecting ? 'flex' : 'hidden sm:flex sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100'
          }`}
        >
          <input
            type="checkbox"
            checked={selected}
            disabled={checkboxDisabled}
            onChange={() => onToggleSelect(row.id)}
            aria-label={`Select ${row.name}`}
            title={limitHint}
            className={`w-4 h-4 cursor-pointer accent-accent ${FOCUS} disabled:cursor-not-allowed disabled:opacity-50`}
          />
        </label>

        <HealthRing score={row.health.score} category={row.health.category} />

        <div className="min-w-0 flex-1 sm:flex-none sm:w-56">
          <Link
            to={`/organizations/${row.id}`}
            onClick={(event) => event.stopPropagation()}
            data-field="organization"
            className={`block truncate rounded-sm text-[13px] font-semibold text-ink hover:underline ${FOCUS}`}
          >
            {row.name}
          </Link>
          <p className="truncate text-[11px] text-ink-muted">
            <span data-field="owner">{PORTFOLIO_FIELDS.owner.value(row)}</span> ·{' '}
            <span data-field="lifecycleStage">{row.lifecycle.label}</span> · {touchText(row.last_touch_days)}
          </p>
        </div>

        <TrendLine trend={row.health.trend} category={row.health.category} className="order-4 sm:order-none" />
        {isSm ? <RenewalRunway renewal={row.renewal} /> : null}

        {isSm ? (
          <span className="flex flex-1 min-w-0 flex-wrap gap-1">
            {pins.map((id) => {
              const field = PORTFOLIO_FIELDS[id];
              return (
                <span key={id} data-pin={id} className="inline-flex items-center gap-1 rounded-full bg-subtle px-2 py-0.5 text-[11px] text-ink-muted">
                  {field.short} <span className="font-mono-brand tabular-nums text-ink">{field.value(row)}</span>
                </span>
              );
            })}
          </span>
        ) : null}

        <span className="order-2 sm:order-none sm:w-20 sm:text-right font-mono-brand tabular-nums text-[13px] text-ink">
          {arr}
        </span>

        {isSm ? <PulsePair pulse={row.pulse} /> : null}

        <span className="order-3 sm:order-none sm:w-36 flex sm:justify-end min-w-0">
          <SignalTag signal={row.signal} />
        </span>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleOpen(row);
          }}
          aria-expanded={open}
          aria-controls={open && children ? detailsId : undefined}
          aria-label={open ? `Close ${row.name}` : `Open ${row.name}`}
          className={`shrink-0 w-11 h-11 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-subtle active:bg-line-subtle ${FOCUS}`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-[var(--dur-fast)] ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {/* Phones: everything after this break wraps onto the card's second line. */}
        <span aria-hidden="true" className="order-1 basis-full h-0 sm:hidden" />
      </div>
      {children}
    </li>
  );
}
