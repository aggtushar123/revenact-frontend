import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import { formatCompactMoney } from '../../../features/customers/formatters';
import { PORTFOLIO_FIELDS } from '../../../features/organizations/portfolioFields';
import type { PortfolioRow } from '../../../features/organizations/portfolioTypes';
import { trapTab } from '../../../lib/focusTrap';
import { AccountDetails } from './AccountDetails';
import { HealthRing, PulsePair, RenewalRunway, SignalTag, TrendLine, touchText } from './rowParts';
import { FOCUS } from './styles';


/** The opened row on phones (spec §1 "Phones"): a modal bottom sheet with
 *  the row's signals on top and the six panels below. Focus moves in, Tab
 *  is trapped, and Escape or Close returns focus to whatever opened it. */
export function AccountSheet({
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
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // A caller re-rendering with a brand new inline `onClose` (the common
  // case) must not re-run the effect below — that would re-focus Close and
  // steal focus back from wherever the visitor has since tabbed to. Kept in
  // a ref so Escape always calls whatever `onClose` is current.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.querySelector<HTMLElement>('button')?.focus();
    // A background body scrolling under a fixed sheet is the one thing that
    // makes a bottom sheet feel broken on a phone — lock it while open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key === 'Tab' && ref.current) trapTab(event, ref.current);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
    // Deliberately once on mount (see onCloseRef above) — not keyed on
    // `onClose`.
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div aria-hidden="true" className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[85dvh] overflow-y-auto rounded-t-xl bg-surface pb-[env(safe-area-inset-bottom)]"
      >
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line-subtle bg-surface px-3 py-3">
          <HealthRing score={row.health.score} category={row.health.category} />
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate text-[15px] font-semibold text-ink">
              {row.name}
            </h2>
            <p className="truncate text-[11px] text-ink-muted">
              {PORTFOLIO_FIELDS.owner.value(row)} · {row.lifecycle.label} · {touchText(row.last_touch_days)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`inline-flex w-11 h-11 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-subtle ${FOCUS}`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
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
        <AccountDetails row={row} onEdit={onEdit} />
        <div className="px-3 pb-4">
          <Link
            to={`/organizations/${row.id}`}
            className={`flex min-h-11 items-center justify-center rounded-lg bg-accent text-[13px] font-semibold text-on-accent hover:bg-accent-hover ${FOCUS}`}
          >
            Open organization page
          </Link>
        </div>
      </div>
    </div>
  );
}
