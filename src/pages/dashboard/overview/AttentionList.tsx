import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../../lib/apiClient';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import { formatCompactMoney } from '../../../features/customers/formatters';
import { snooze, unsnooze } from '../../../features/attention/attentionApi';
import type { AttentionItem, AttentionKind } from '../../../features/attention/attentionApi';
import { useDrill } from '../drill/useDrill';
import { Panel } from '../shared/Panel';
import { Empty, ErrorState } from '../shared/DataState';

const KIND_LABEL: Record<AttentionKind, string> = {
  renewal: 'Renewal',
  risk: 'Risk',
  going_quiet: 'Going quiet',
  support: 'Support',
  anomaly: 'Anomaly',
};

type Acted = 'snoozed' | 'done';

const ACTED_LINE: Record<Acted, string> = { snoozed: 'Snoozed', done: 'Marked done' };

const BUTTON =
  'min-h-9 px-3 rounded-lg text-[13px] font-semibold transition-colors duration-[var(--dur-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed';
const SECONDARY = `${BUTTON} border border-line text-ink bg-surface hover:bg-subtle`;
const QUIET = `${BUTTON} text-ink-muted hover:text-ink hover:bg-subtle`;

function SkeletonRows() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading what needs attention</span>
      <ol className="divide-y divide-line" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} data-testid="attention-skeleton-row" className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-5 w-16 rounded-md bg-subtle animate-pulse" />
                <span className="h-4 w-40 max-w-full rounded bg-subtle animate-pulse" />
              </div>
              <span className="block h-3 w-56 max-w-full rounded bg-subtle animate-pulse" />
            </div>
            <span className="h-4 w-14 rounded bg-subtle animate-pulse" />
            <div className="flex gap-2">
              <span className="h-9 w-28 rounded-lg bg-subtle animate-pulse" />
              <span className="h-9 w-16 rounded-lg bg-subtle animate-pulse" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * The ranked "Needs attention" list: what to act on first, across renewals,
 * risk, quiet accounts, support and anomalies. The order is the server's
 * (score descending); nothing here re-ranks it.
 *
 * Snooze and Done are optimistic: the row gives way to an Undo line at once
 * and comes back if the server says no. The line holds the row's place, so
 * Undo restores it exactly where it was.
 */
export function AttentionList({
  items,
  currency,
  loading,
  error,
}: {
  /** Null until the first load. */
  items: AttentionItem[] | null;
  currency: CurrencyCode;
  /** True only on the first load; a refetch keeps the old list on screen. */
  loading: boolean;
  error: boolean;
}) {
  const { open } = useDrill();
  const [acted, setActed] = useState<Record<string, Acted>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const list = items ?? [];
  const remaining = list.filter((item) => !acted[item.key]).length;

  const mark = (key: string, choice: Acted | null) =>
    setActed((prev) => {
      const next = { ...prev };
      if (choice) next[key] = choice;
      else delete next[key];
      return next;
    });

  const reason = (err: unknown) => (err instanceof ApiError ? ` ${err.message}` : '');

  async function act(item: AttentionItem, choice: Acted) {
    setActionError(null);
    mark(item.key, choice);
    setPending((prev) => ({ ...prev, [item.key]: true }));
    try {
      await snooze(item.key, choice === 'done' ? { done: true } : { days: 7 });
    } catch (err) {
      mark(item.key, null);
      setActionError(`Could not ${choice === 'done' ? 'mark done' : 'snooze'} ${item.title}.${reason(err)}`);
    } finally {
      setPending((prev) => ({ ...prev, [item.key]: false }));
    }
  }

  async function undo(item: AttentionItem) {
    const was = acted[item.key];
    setActionError(null);
    mark(item.key, null);
    try {
      await unsnooze(item.key);
    } catch (err) {
      mark(item.key, was);
      setActionError(`Could not undo ${item.title}.${reason(err)}`);
    }
  }

  const header = (
    <div className="flex items-baseline gap-3 min-w-0">
      {actionError && (
        <p role="alert" className="text-[11px] font-semibold text-danger">
          {actionError}
        </p>
      )}
      {items !== null && (
        <span data-testid="attention-count" className="font-mono-brand tabular-nums text-[13px] text-ink-muted">
          {remaining}
        </span>
      )}
    </div>
  );

  let body;
  if (loading && items === null) {
    body = <SkeletonRows />;
  } else if (error && list.length === 0) {
    body = <ErrorState message="Could not load what needs attention." />;
  } else if (list.length === 0) {
    body = <Empty label="Nothing needs you right now." />;
  } else {
    body = (
      <>
        {error && (
          <ErrorState message="Could not load what needs attention." detail="Showing the list as it last loaded." />
        )}
        <ol aria-label="Needs attention" className="divide-y divide-line">
          {list.map((item) => {
            const done = acted[item.key];
            if (done) {
              return (
                <li key={item.key} className="flex items-center justify-between gap-3 py-3">
                  <p className="text-[13px] text-ink-muted min-w-0 truncate">
                    {ACTED_LINE[done]} · <span className="text-ink">{item.title}</span>
                  </p>
                  <button type="button" className={QUIET} disabled={pending[item.key]} onClick={() => undo(item)}>
                    Undo
                  </button>
                </li>
              );
            }
            return (
              <li key={item.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 rounded-md bg-subtle px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                      {KIND_LABEL[item.kind]}
                    </span>
                    {item.customer_id !== null ? (
                      <Link
                        to={`/organizations/${item.customer_id}`}
                        className="min-w-0 truncate text-[13px] font-semibold text-ink hover:underline rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={(event) =>
                          open(
                            {
                              title: item.title,
                              figure: `${item.companies.length} companies`,
                              source: {
                                kind: 'rows',
                                rows: item.companies.map((c) => ({ id: String(c.id), name: c.name })),
                              },
                            },
                            event.currentTarget,
                          )
                        }
                        className="min-w-0 truncate text-left text-[13px] font-semibold text-ink hover:underline rounded cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        {item.title}
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-ink-muted">{item.reason}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
                  <span className="text-right">
                    <span className="block font-mono-brand tabular-nums text-[13px] text-ink">
                      {formatCompactMoney(item.at_stake, currency)}
                    </span>
                    <span className="block text-[11px] text-ink-muted">at stake</span>
                  </span>
                  <span className="flex gap-2">
                    <button type="button" className={SECONDARY} onClick={() => act(item, 'snoozed')}>
                      Snooze 7 days
                    </button>
                    <button type="button" className={QUIET} onClick={() => act(item, 'done')}>
                      Done
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </>
    );
  }

  return (
    <Panel title="Needs attention" action={header}>
      {body}
    </Panel>
  );
}
