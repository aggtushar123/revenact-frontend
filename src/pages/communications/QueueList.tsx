import { AtSign, LifeBuoy, Mail, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  CommunicationKind,
  CommunicationRow,
} from '../../features/communications/communicationsSlice';
import { waitingTone } from '../../features/communications/communicationsSlice';

/**
 * The queue itself.
 *
 * Every row is a real `<button>` rather than a clickable div, so Tab reaches it
 * and `aria-current` can say which one the pane is showing.
 *
 * Waiting time is the loudest thing in a row on purpose: it is the only value
 * that changes which item a person picks next, so it is mono, tabular, right
 * aligned and coloured on the shared three and seven day thresholds. It is also
 * always written out, never colour alone.
 */

const ICONS: Record<CommunicationKind, LucideIcon> = {
  email: Mail,
  question: AtSign,
  ticket: LifeBuoy,
  call: Phone,
};

const WAIT_CLASS = {
  danger: 'text-danger',
  warning: 'text-warning',
  muted: 'text-ink-muted',
} as const;

export function QueueRow({
  row,
  isSelected,
  onSelect,
}: {
  row: CommunicationRow;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const Icon = ICONS[row.kind];

  return (
    <button
      type="button"
      onClick={() => onSelect(row.id)}
      aria-current={isSelected}
      className={`w-full px-3.5 py-3 border-b border-line-subtle border-l-[3px] flex items-start gap-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
        isSelected
          ? 'border-l-accent bg-accent-dim/50'
          : 'border-l-transparent bg-surface hover:bg-subtle'
      }`}
    >
      <span
        className="w-[22px] h-[22px] mt-0.5 rounded-md shrink-0 flex items-center justify-center bg-subtle text-ink-muted"
        aria-hidden="true"
      >
        <Icon size={13} />
      </span>

      <span className="grow min-w-0 flex flex-col gap-0.5">
        <span className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-bold text-ink truncate">{row.who}</span>
          {row.account ? (
            <span className="text-[11px] text-ink-muted truncate">{row.account.name}</span>
          ) : null}
        </span>
        <span className="text-[12.5px] text-ink truncate">{row.subject}</span>
        <span className="text-[11.5px] text-ink-muted truncate">{row.snippet}</span>
      </span>

      <span className="shrink-0 flex flex-col items-end gap-0.5">
        <span
          className={`font-mono-brand tabular-nums text-[14px] leading-none font-medium ${
            WAIT_CLASS[waitingTone(row.waiting_days)]
          }`}
        >
          {row.waiting_days}d
        </span>
        <span className="text-[10px] text-ink-muted">waiting</span>
      </span>
    </button>
  );
}

/** Skeleton rows that match the real layout, not a spinner in the middle. */
function QueueSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="p-3.5 flex flex-col gap-4">
      <span className="sr-only">Loading your queue</span>
      {[62, 48, 67, 54, 59].map((width, index) => (
        <div key={index} className="flex items-start gap-2.5">
          <div className="w-[22px] h-[22px] rounded-md bg-subtle animate-pulse shrink-0" />
          <div className="grow flex flex-col gap-1.5">
            <div className="h-[11px] rounded bg-subtle animate-pulse" style={{ width: `${width}%` }} />
            <div
              className="h-[10px] rounded bg-subtle animate-pulse"
              style={{ width: `${Math.min(width + 20, 92)}%` }}
            />
          </div>
          <div className="w-6 h-3 rounded bg-subtle animate-pulse shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function QueueList({
  rows,
  selectedId,
  isLoading,
  heading,
  countLabel,
  onSelect,
  emptyState,
}: {
  rows: CommunicationRow[];
  selectedId: string | null;
  isLoading: boolean;
  heading: string;
  countLabel: string;
  onSelect: (id: string) => void;
  emptyState: React.ReactNode;
}) {
  return (
    <section
      aria-label="Queue"
      className="w-full lg:w-[468px] lg:shrink-0 bg-surface border border-line rounded-xl flex flex-col overflow-hidden"
    >
      <div className="h-[34px] shrink-0 px-3.5 border-b border-line-subtle bg-base flex items-center justify-between">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">
          {heading}
        </span>
        <span className="font-mono-brand tabular-nums text-[11px] text-ink-muted">{countLabel}</span>
      </div>

      <div className="grow overflow-y-auto">
        {isLoading && rows.length === 0 ? (
          <QueueSkeleton />
        ) : rows.length === 0 ? (
          emptyState
        ) : (
          rows.map((row) => (
            <QueueRow
              key={row.id}
              row={row}
              isSelected={row.id === selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </section>
  );
}
