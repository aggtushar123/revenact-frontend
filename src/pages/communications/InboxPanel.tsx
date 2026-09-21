// The inbox's own left panel: the queue folders and two filters.
//
// Folders are the four kinds of waiting the queue is built from, plus
// everything. Filters are real switches over real server parameters: "Needs
// you" is the queue versus the whole stream, "Mine only" is whose accounts.

import { AtSign, Inbox, LifeBuoy, Mail, Phone, SlidersHorizontal } from 'lucide-react';
import type { CommunicationKind, CommunicationsStats } from '../../features/communications/communicationsSlice';

const FOLDERS: { kind: CommunicationKind | null; label: string; icon: typeof Inbox }[] = [
  { kind: null, label: 'Inbox', icon: Inbox },
  { kind: 'question', label: 'Questions for you', icon: AtSign },
  { kind: 'email', label: 'Replies owed', icon: Mail },
  { kind: 'ticket', label: 'Open tickets', icon: LifeBuoy },
  { kind: 'call', label: 'Calls to wrap up', icon: Phone },
];

export function Switch({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <label htmlFor={id} className="text-[13px] text-ink">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${checked ? 'bg-accent' : 'bg-line-strong'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm border transition-transform duration-[var(--dur-fast)] ${checked ? 'translate-x-[18px] bg-on-accent border-transparent' : 'translate-x-0.5 bg-surface border-line-strong'}`} />
      </button>
    </div>
  );
}

export function InboxPanel({
  kind,
  stats,
  needsOnly,
  mineOnly,
  hasMailbox,
  onKind,
  onNeedsOnly,
  onMineOnly,
}: {
  kind: CommunicationKind | null;
  stats: CommunicationsStats | null;
  needsOnly: boolean;
  mineOnly: boolean;
  hasMailbox: boolean;
  onKind: (kind: CommunicationKind | null) => void;
  onNeedsOnly: (next: boolean) => void;
  onMineOnly: (next: boolean) => void;
}) {
  return (
    <aside aria-label="Inbox folders and filters" className="w-[232px] shrink-0 flex flex-col gap-2.5 pr-3">
      <nav aria-label="Folders" className="rv-glass-inner border border-line rounded-xl p-1.5 flex flex-col gap-0.5">
        {FOLDERS.map(({ kind: folderKind, label, icon: Icon }) => {
          const active = folderKind === kind;
          const count = folderKind === null ? stats?.total : stats?.counts[folderKind];
          const dash = folderKind === 'email' && stats !== null && !hasMailbox;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onKind(folderKind)}
              aria-current={active ? 'page' : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-left transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active ? 'bg-subtle text-ink font-medium' : 'text-ink-muted hover:text-ink hover:bg-subtle/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">{label}</span>
              <span className="font-mono-brand text-[11.5px] tabular-nums text-ink-faint">
                {stats === null ? '' : dash ? '–' : count}
              </span>
            </button>
          );
        })}
      </nav>

      <section aria-label="Filters" className="rv-glass-inner border border-line rounded-xl p-1.5">
        <div className="flex items-center gap-2 px-3 py-2 text-[13px] text-ink">
          <SlidersHorizontal className="w-4 h-4 text-ink-muted" aria-hidden="true" />
          Filters
        </div>
        <Switch id="filter-needs" label="Needs you" checked={needsOnly} onChange={onNeedsOnly} />
        <Switch id="filter-mine" label="Mine only" checked={mineOnly} onChange={onMineOnly} />
      </section>
    </aside>
  );
}
