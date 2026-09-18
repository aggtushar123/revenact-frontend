import { AtSign, LifeBuoy, Mail, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CommunicationKind, CommunicationsStats } from '../../features/communications/communicationsSlice';

/**
 * The four bucket tiles.
 *
 * They are a filter, not a summary: clicking one narrows the queue, clicking it
 * again clears it. Same interaction as the Health donut, which already teaches
 * that a number on this product is something you can click.
 *
 * The counts come from their own endpoint rather than from the list, so that
 * narrowing to one bucket does not zero the other three underneath the cursor.
 */

interface Bucket {
  kind: CommunicationKind;
  label: string;
  icon: LucideIcon;
  /** Tint classes for the icon chip. One accent, semantic colours for meaning. */
  chip: string;
}

const BUCKETS: Bucket[] = [
  { kind: 'email', label: 'Replies owed', icon: Mail, chip: 'bg-accent-dim text-accent' },
  { kind: 'question', label: 'Questions for you', icon: AtSign, chip: 'bg-info-dim text-info' },
  { kind: 'ticket', label: 'Open tickets', icon: LifeBuoy, chip: 'bg-warning-dim text-warning' },
  { kind: 'call', label: 'Calls to wrap up', icon: Phone, chip: 'bg-success-dim text-success' },
];

function hint(bucket: Bucket, stats: CommunicationsStats | null): string {
  if (!stats) return '';
  if (bucket.kind === 'email') {
    return stats.has_mailbox ? 'from your mailbox' : 'no mailbox connected';
  }
  if (bucket.kind === 'question') {
    return stats.stale_questions > 0 ? `${stats.stale_questions} stale` : 'from colleagues';
  }
  if (bucket.kind === 'ticket') return 'your department';
  return 'no summary yet';
}

export function BucketTiles({
  stats,
  active,
  isLoading,
  onToggle,
}: {
  stats: CommunicationsStats | null;
  active: CommunicationKind | null;
  isLoading: boolean;
  onToggle: (kind: CommunicationKind) => void;
}) {
  if (isLoading && !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-busy="true">
        {BUCKETS.map((bucket) => (
          <div
            key={bucket.kind}
            className="h-[74px] rounded-xl border border-line bg-surface animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {BUCKETS.map((bucket) => {
        const Icon = bucket.icon;
        const isActive = active === bucket.kind;
        const count = stats?.counts[bucket.kind] ?? 0;
        // A dash, never a zero: with no mailbox connected nothing has been
        // read, and "0 replies owed" would be a claim we cannot make.
        const unknown = bucket.kind === 'email' && stats !== null && !stats.has_mailbox;

        return (
          <button
            key={bucket.kind}
            type="button"
            onClick={() => onToggle(bucket.kind)}
            aria-pressed={isActive}
            className={`h-[74px] px-3.5 py-3 rounded-xl border text-left flex flex-col justify-between transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
              isActive
                ? 'border-accent bg-accent-dim/40'
                : 'border-line bg-surface hover:border-line-strong'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-md flex items-center justify-center ${bucket.chip}`}>
                <Icon size={14} aria-hidden="true" />
              </span>
              <span className="text-[12px] font-bold text-ink-muted">{bucket.label}</span>
            </span>
            <span className="flex items-baseline gap-2">
              <span
                className={`font-mono-brand tabular-nums text-[23px] leading-none font-medium ${
                  isActive ? 'text-accent' : 'text-ink'
                }`}
              >
                {unknown ? '—' : count}
              </span>
              <span className="text-[11px] text-ink-muted">{hint(bucket, stats)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
