import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import { formatCompactMoney } from '../../../features/customers/formatters';
import { PORTFOLIO_FIELDS } from '../../../features/organizations/portfolioFields';
import type { PortfolioRow } from '../../../features/organizations/portfolioTypes';
import { AccountDetails } from './AccountDetails';
import { DETAILS_PANEL_ID } from './BoardCard';
import { HealthRing, PulsePair, RenewalRunway, SignalTag, TrendLine, touchText } from './rowParts';
import { FOCUS } from './styles';

/** The Board's opened card from `sm` (owner decision 2026-09-26): the
 *  row's signals and the six panels in a column beside the board, which
 *  stays in place and usable. It is not modal. Focus moves to Close on open
 *  and back to the opener on close, and Escape inside the panel closes it.
 *  A `bg-surface` item on the canvas, beside the columns, never inside one. */
export function AccountSidePanel({
  row,
  currency,
  onClose,
  onEdit,
}: {
  row: PortfolioRow;
  currency: CurrencyCode;
  onClose: () => void;
  onEdit?: (id: number) => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Once on mount: switching to another card keeps the panel mounted and
  // must not steal focus again.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && !event.defaultPrevented) {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <aside
      id={DETAILS_PANEL_ID}
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      className="flex w-[26rem] shrink-0 flex-col overflow-y-auto rounded-xl bg-surface"
    >
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line-subtle bg-surface px-3 py-3">
        <HealthRing score={row.health.score} category={row.health.category} />
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="truncate text-[15px] font-semibold text-ink">
            {row.name}
          </h2>
          <p className="truncate text-[11px] text-ink-muted">
            {`${PORTFOLIO_FIELDS.owner.value(row)} · ${row.lifecycle.label} · ${touchText(row.last_touch_days)}`}
          </p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className={`inline-flex w-8 h-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-subtle active:bg-line-subtle ${FOCUS}`}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </header>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3">
        <span className="font-mono-brand tabular-nums text-[15px] text-ink">
          {row.arr == null ? '—' : formatCompactMoney(row.arr, currency)}
        </span>
        <SignalTag signal={row.signal} />
        <TrendLine trend={row.health.trend} category={row.health.category} />
        <RenewalRunway renewal={row.renewal} className="flex" />
        <PulsePair pulse={row.pulse} className="flex" />
      </div>
      <AccountDetails row={row} onEdit={onEdit} stacked />
      <div className="px-3 pb-4">
        <Link
          to={`/organizations/${row.id}`}
          className={`flex min-h-9 items-center justify-center rounded-lg bg-accent text-[13px] font-semibold text-on-accent hover:bg-accent-hover ${FOCUS}`}
        >
          Open organization page
        </Link>
      </div>
    </aside>
  );
}
