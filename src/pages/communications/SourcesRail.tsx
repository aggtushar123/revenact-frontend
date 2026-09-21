// The column of everything connected to the platform, left of the inbox.
//
// "All" first, then one icon per connected source: the person's mailbox
// (Gmail or Outlook, by provider), each connected ticket or chat connector,
// and calls. Only what is actually connected is shown; a source that is not
// wired up does not get a greyed-out icon pretending it is.

import { Plug } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Source } from './sources';

export function SourcesRail({ sources, active, onSelect }: { sources: Source[]; active: string; onSelect: (id: string) => void }) {
  return (
    <nav aria-label="Connected sources" className="w-14 shrink-0 flex flex-col items-center gap-1 py-2">
      {sources.map((source) => {
        const isActive = source.id === active;
        return (
          <button
            key={source.id}
            type="button"
            onClick={() => onSelect(source.id)}
            aria-pressed={isActive}
            aria-label={source.label}
            title={source.label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive ? 'bg-surface border border-line text-ink shadow-xs' : 'text-ink-muted hover:bg-black/5 dark:hover:bg-white/[0.06] border border-transparent'
            }`}
          >
            {source.icon}
          </button>
        );
      })}
      <Link
        to="/integrations"
        aria-label="Connect a source"
        title="Connect a source"
        className="mt-auto w-10 h-10 rounded-xl flex items-center justify-center text-ink-faint hover:text-ink hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors duration-[var(--dur-fast)]"
      >
        <Plug className="w-[18px] h-[18px]" aria-hidden="true" />
      </Link>
    </nav>
  );
}
