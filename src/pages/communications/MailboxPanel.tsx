// The mailbox's own left panel: the five folders, two filters, and the
// categories. Folders and flags pick a list; a category narrows it.

import { useState } from 'react';
import { AlertCircle, Ban, ChevronDown, ChevronRight, LayoutList, SlidersHorizontal, Star, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MailCategory, MailFolder, MailSummary } from '../../features/mail/mailboxSlice';
import { Switch } from './InboxPanel';
import { CATEGORIES, CATEGORY_DOT, CATEGORY_LABEL } from './mailCategories';

const FOLDERS: { folder: MailFolder; label: string }[] = [
  { folder: 'inbox', label: 'Inbox' },
  { folder: 'drafts', label: 'Drafts' },
  { folder: 'sent', label: 'Sent' },
  { folder: 'done', label: 'Done' },
  { folder: 'muted', label: 'Muted' },
];

const FLAGS: { folder: MailFolder; label: string; icon: LucideIcon }[] = [
  { folder: 'starred', label: 'Starred', icon: Star },
  { folder: 'important', label: 'Important', icon: AlertCircle },
  { folder: 'spam', label: 'Spam', icon: Ban },
  { folder: 'trash', label: 'Trash', icon: Trash2 },
];

function Card({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: LucideIcon;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="bg-surface border border-line rounded-xl p-1.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-ink rounded-lg hover:bg-subtle/60"
      >
        <Icon className="w-4 h-4 text-ink-muted" aria-hidden="true" />
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown className={`w-4 h-4 text-ink-faint transition-transform duration-[var(--dur-fast)] ${open ? '' : '-rotate-90'}`} aria-hidden="true" />
      </button>
      {open ? children : null}
    </section>
  );
}

export function MailboxPanel({
  folder,
  category,
  unread,
  priority,
  summary,
  onFolder,
  onCategory,
  onUnread,
  onPriority,
}: {
  folder: MailFolder;
  category: MailCategory | null;
  unread: boolean;
  priority: boolean;
  summary: MailSummary | null;
  onFolder: (folder: MailFolder) => void;
  onCategory: (category: MailCategory) => void;
  onUnread: (next: boolean) => void;
  onPriority: (next: boolean) => void;
}) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(true);

  return (
    <aside aria-label="Mailbox folders and filters" className="w-[232px] shrink-0 flex flex-col gap-2.5 pr-3 overflow-y-auto custom-scrollbar">
      <nav aria-label="Folders" className="bg-surface border border-line rounded-xl p-1.5 flex flex-col gap-0.5">
        {FOLDERS.map(({ folder: f, label }) => {
          const active = f === folder;
          const count = summary?.folders[f as keyof MailSummary['folders']];
          return (
            <button
              key={f}
              type="button"
              onClick={() => onFolder(f)}
              aria-current={active ? 'page' : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-left transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active ? 'bg-subtle text-ink font-medium' : 'text-ink-muted hover:text-ink hover:bg-subtle/60'
              }`}
            >
              <span className="flex-1 truncate">{label}</span>
              <span className="font-mono-brand text-[11.5px] tabular-nums text-ink-faint">{count === undefined ? '' : count}</span>
            </button>
          );
        })}
      </nav>

      <Card title="Filters" icon={SlidersHorizontal} open={filtersOpen} onToggle={() => setFiltersOpen((o) => !o)}>
        <Switch id="mail-priority" label="Priority" checked={priority} onChange={onPriority} />
        <Switch id="mail-unread" label="Unread" checked={unread} onChange={onUnread} />
      </Card>

      <Card title="Categories" icon={LayoutList} open={categoriesOpen} onToggle={() => setCategoriesOpen((o) => !o)}>
        {FLAGS.map(({ folder: f, label, icon: Icon }) => {
          const active = f === folder;
          return (
            <button
              key={f}
              type="button"
              onClick={() => onFolder(f)}
              aria-current={active ? 'page' : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-left ${active ? 'bg-subtle text-ink font-medium' : 'text-ink-muted hover:text-ink hover:bg-subtle/60'}`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {label}
            </button>
          );
        })}
        {CATEGORIES.map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onCategory(c)}
              aria-pressed={active}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] text-left ${active ? 'bg-subtle text-ink font-medium' : 'text-ink-muted hover:text-ink hover:bg-subtle/60'}`}
            >
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
              <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[c]}`} aria-hidden="true" />
              {CATEGORY_LABEL[c]}
            </button>
          );
        })}
      </Card>
    </aside>
  );
}
