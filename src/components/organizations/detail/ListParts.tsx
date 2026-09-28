import { Fragment, useId } from 'react';
import { Search } from 'lucide-react';
import type { SummaryPart } from '../../../features/organizations/listSummaries';
import { EmptyState } from '../portfolio/PortfolioSections';
import { FOCUS, QUIET } from '../portfolio/styles';
import { LIST } from './listStyles';

/** The account a record is on, as the Story tags it. */
export function AccountTag({ name }: { name: string }) {
  return (
    <span className="inline-block min-w-0 max-w-[10rem] truncate rounded-full bg-subtle px-2 py-0.5 text-ink">{name}</span>
  );
}

/** The one line above a list that replaces the stat cards: figures in DM
 *  Mono, parted by middle dots, wrapping between parts only. */
export function SummaryLine({ parts }: { parts: SummaryPart[] }) {
  return (
    <p data-summary="" className="text-[13px] text-ink-muted">
      {parts.map((part, i) => (
        <Fragment key={part.label}>
          {i > 0 ? ' · ' : null}
          <span className="whitespace-nowrap">
            <span className="font-mono-brand tabular-nums text-ink">{part.value}</span> {part.label}
          </span>
        </Fragment>
      ))}
    </p>
  );
}

/** A list's loading state: rows shaped like its items, not a spinner. */
export function ListSkeleton({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div role="status" aria-label={label}>
      <ul aria-hidden="true" className={LIST}>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex gap-3 px-3 py-2.5">
            <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-subtle" />
            <span className="flex flex-1 flex-col gap-1.5">
              <span className="block h-3 w-48 animate-pulse rounded bg-subtle" />
              <span className="block h-2.5 w-full animate-pulse rounded bg-subtle" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** An empty list: under an account chip it offers All; under All it says
 *  there is nothing yet and how things arrive. */
export function ScopedEmpty({
  what,
  scope,
  detail,
  onShowAll,
}: {
  /** Plural noun: "people", "files". */
  what: string;
  /** From scopeLabel: null under All. */
  scope: string | null;
  detail: string;
  onShowAll: () => void;
}) {
  if (scope) {
    return (
      <EmptyState
        title={`No ${what} on ${scope}`}
        detail="The other accounts' show under All."
        action={
          <button type="button" onClick={onShowAll} className={`${QUIET} border border-line`}>
            Show all accounts
          </button>
        }
      />
    );
  }
  return <EmptyState title={`No ${what} yet`} detail={detail} action={null} />;
}

export function NoMatch({ q, onClear }: { q: string; onClear: () => void }) {
  return (
    <EmptyState
      title={`Nothing matches “${q.trim()}”`}
      detail="Try another word, or clear the search."
      action={
        <button type="button" onClick={onClear} className={`${QUIET} border border-line`}>
          Clear search
        </button>
      }
    />
  );
}

/** A list's search, as the Story's: 15px and 44px on phones, 13px and 36px from sm. */
export function ListSearch({
  label,
  value,
  onChange,
  isSm,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isSm: boolean;
}) {
  const id = useId();
  return (
    <div role="search" className={isSm ? 'relative min-w-0 max-w-xs flex-1' : 'relative w-full'}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        className={`min-h-11 w-full rounded-lg border border-line bg-surface pl-8 pr-2 text-[15px] text-ink placeholder:text-ink-muted sm:min-h-9 sm:text-[13px] ${FOCUS}`}
      />
    </div>
  );
}
