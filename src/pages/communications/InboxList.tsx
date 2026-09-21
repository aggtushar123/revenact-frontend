// The list: every row is a button, grouped by the month it started waiting,
// newest group first. The kind is a quiet chip, the wait is mono and
// coloured on the shared three- and seven-day thresholds, and it is always
// written out, never colour alone.

import { AtSign, LifeBuoy, Mail, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CommunicationKind, CommunicationRow } from '../../features/communications/communicationsSlice';
import { waitingTone } from '../../features/communications/communicationsSlice';

const ICONS: Record<CommunicationKind, LucideIcon> = { email: Mail, question: AtSign, ticket: LifeBuoy, call: Phone };
const KIND_LABEL: Record<CommunicationKind, string> = {
  email: 'Reply owed',
  question: 'Question for you',
  ticket: 'Open ticket',
  call: 'Call to wrap up',
};
const WAIT_CLASS = { danger: 'text-danger', warning: 'text-warning', muted: 'text-ink-muted' } as const;

function monthOf(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'Earlier' : d.toLocaleDateString(undefined, { month: 'long', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

function initialOf(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase();
}

export function InboxList({
  rows,
  selectedId,
  isLoading,
  onSelect,
  emptyState,
}: {
  rows: CommunicationRow[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  emptyState: React.ReactNode;
}) {
  if (isLoading && rows.length === 0) {
    return (
      <div aria-busy="true" aria-live="polite" className="flex flex-col gap-2 pt-1">
        <span className="sr-only">Loading your inbox</span>
        {[70, 55, 64, 48].map((w, i) => (
          <div key={i} className="h-[52px] rounded-xl bg-surface/60 border border-line-subtle animate-pulse" style={{ width: `${Math.max(w, 40)}%` }} />
        ))}
      </div>
    );
  }
  if (rows.length === 0) return <>{emptyState}</>;

  const groups = new Map<string, CommunicationRow[]>();
  for (const row of rows) {
    const key = monthOf(row.waiting_since);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return (
    <div className="flex flex-col gap-5">
      {[...groups.entries()].map(([month, items]) => (
        <section key={month} aria-label={month}>
          <h3 className="text-[12.5px] font-semibold text-ink-muted mb-2">{month}</h3>
          <ul className="flex flex-col gap-1.5">
            {items.map((row) => {
              const Icon = ICONS[row.kind];
              const selected = row.id === selectedId;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(row.id)}
                    aria-current={selected ? 'true' : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      selected ? 'bg-subtle border-line-strong' : 'bg-surface border-line hover:border-line-strong'
                    }`}
                  >
                    <span className="relative shrink-0">
                      <span className="w-8 h-8 rounded-full bg-subtle text-ink text-[12px] font-semibold flex items-center justify-center" aria-hidden="true">
                        {initialOf(row.who)}
                      </span>
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-surface border border-line flex items-center justify-center text-ink-muted" aria-hidden="true">
                        <Icon className="w-2.5 h-2.5" />
                      </span>
                    </span>
                    <span className="w-[180px] shrink-0 min-w-0">
                      <span className="block text-[13px] font-semibold text-ink truncate">{row.who}</span>
                      {row.account ? <span className="block text-[11px] text-ink-muted truncate">{row.account.name}</span> : null}
                    </span>
                    <span className="flex-1 min-w-0 text-[13px] truncate">
                      <span className="text-ink">{row.subject}</span>
                      {row.snippet ? <span className="text-ink-muted">: {row.snippet}</span> : null}
                    </span>
                    <span className="hidden md:inline-flex shrink-0 px-2 py-0.5 rounded-md bg-subtle text-[11px] text-ink-muted">{KIND_LABEL[row.kind]}</span>
                    <span className={`shrink-0 font-mono-brand tabular-nums text-[12px] w-[68px] text-right ${WAIT_CLASS[waitingTone(row.waiting_days)]}`}>
                      {row.waiting_days}d waiting
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Empty is an achievement. A quiet ring, a line, nothing to click. */
export function InboxZero({ title = 'Inbox zero', line = 'Nothing between you and the rest of the day.' }: { title?: string; line?: string }) {
  return (
    <div className="h-full min-h-[420px] flex flex-col items-center justify-center gap-10 text-center">
      <div aria-hidden="true" className="relative w-40 h-40">
        <div className="absolute inset-0 rounded-full border border-line-strong/60" />
        <div className="absolute inset-6 rounded-full bg-subtle" />
        <div className="absolute inset-10 rounded-full bg-surface border border-line" />
      </div>
      <p className="text-[13px] text-ink-muted">
        <span className="font-semibold text-ink">{title}</span> · {line}
      </p>
    </div>
  );
}
