// The mailbox list: the Categories block on top (what is waiting, by kind),
// then every message grouped by month, newest first.

import type { MailCategory, MailCategoryBlock, MailMessage } from '../../features/mail/mailboxSlice';
import { CATEGORY_DOT, CATEGORY_LABEL } from './mailCategories';
import { who } from './mailWho';

function monthOf(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'Earlier' : d.toLocaleDateString(undefined, { month: 'long', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

function dayOf(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0].charAt(0) + (parts[1]?.charAt(0) ?? '')).toUpperCase();
}

export function CategoriesBlock({ blocks, active, onPick }: { blocks: MailCategoryBlock[]; active: MailCategory | null; onPick: (category: MailCategory) => void }) {
  if (blocks.length === 0) return null;
  return (
    <section aria-label="Waiting by category" className="mb-5">
      <h2 className="text-[12.5px] font-semibold text-ink-muted mb-2">Categories</h2>
      <ul className="flex flex-col gap-1.5">
        {blocks.map((block) => (
          <li key={block.category}>
            <button
              type="button"
              onClick={() => onPick(block.category)}
              aria-pressed={active === block.category}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active === block.category ? 'bg-subtle border-line-strong' : 'rv-glass-inner border-line hover:border-line-strong'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_DOT[block.category]}`} aria-hidden="true" />
              <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0" aria-hidden="true" title="Unread" />
              <span className="flex-1 min-w-0 text-[13px] truncate">
                <span className="font-semibold text-ink">{block.subjects.join(', ')}</span>
                <span className="text-ink-muted">
                  {'  '}
                  {block.senders[0]}
                  {block.more_senders > 0 ? ` · +${block.more_senders}` : ''}
                </span>
              </span>
              <span className="shrink-0 px-2 py-0.5 rounded-md bg-subtle text-[11px] text-ink-muted">{block.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MailList({
  rows,
  isLoading,
  onSelect,
  emptyState,
  footer = null,
}: {
  rows: MailMessage[];
  isLoading: boolean;
  onSelect: (id: number) => void;
  emptyState: React.ReactNode;
  /** Below the last group: the way to the next page, when there is one. */
  footer?: React.ReactNode;
}) {
  if (isLoading && rows.length === 0) {
    return (
      <div aria-busy="true" aria-live="polite" className="flex flex-col gap-2 pt-1">
        <span className="sr-only">Loading your mail</span>
        {[70, 55, 64, 48].map((w, i) => (
          <div key={i} className="h-[52px] rounded-xl bg-surface/60 border border-line-subtle animate-pulse" style={{ width: `${Math.max(w, 40)}%` }} />
        ))}
      </div>
    );
  }
  if (rows.length === 0) return <>{emptyState}</>;

  const groups = new Map<string, MailMessage[]>();
  for (const row of rows) {
    const key = monthOf(row.sent_at);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return (
    <div className="flex flex-col gap-5">
      {[...groups.entries()].map(([month, items]) => (
        <section key={month} aria-label={month}>
          <h2 className="text-[12.5px] font-semibold text-ink-muted mb-2">{month}</h2>
          <ul className="flex flex-col gap-1.5">
            {items.map((row) => {
              const name = who(row);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(row.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border rv-glass-inner border-line hover:border-line-strong text-left transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="w-8 h-8 shrink-0 rounded-full bg-subtle text-ink text-[11.5px] font-semibold flex items-center justify-center" aria-hidden="true">
                      {initialsOf(name)}
                    </span>
                    <span className="w-[160px] xl:w-[210px] shrink-0 min-w-0 flex items-center gap-2">
                      {!row.is_read ? <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0" role="img" aria-label="Unread message" /> : null}
                      <span className={`block text-[13px] truncate ${row.is_read ? 'text-ink' : 'font-semibold text-ink'}`}>{row.direction === 'sent' ? `To ${name}` : name}</span>
                    </span>
                    <span className="flex-1 min-w-0 text-[13px] truncate">
                      <span className={row.is_read ? 'text-ink' : 'font-semibold text-ink'}>{row.subject}</span>
                      {row.snippet ? <span className="text-ink-muted">: {row.snippet}</span> : null}
                    </span>
                    {row.account ? <span className="hidden xl:inline-flex shrink-0 px-2 py-0.5 rounded-md bg-accent-dim text-[11px] text-ink truncate max-w-[140px]">{row.account.name}</span> : null}
                    <span className="hidden md:inline-flex shrink-0 px-2 py-0.5 rounded-md bg-subtle text-[11px] text-ink-muted">{CATEGORY_LABEL[row.category]}</span>
                    <span className="shrink-0 font-mono-brand tabular-nums text-[12px] w-[52px] text-right text-ink-muted">{dayOf(row.sent_at)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {footer}
    </div>
  );
}
