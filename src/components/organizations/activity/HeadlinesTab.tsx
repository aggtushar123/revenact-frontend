import {
  LayoutTemplate,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '../ConfirmDialog';
import type { Headline } from '../../../features/customers/customersSlice';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2025-11-20" -> "20 Nov 2025" — the span shown on a headline card's
// own footer. Same parse-the-parts approach as NotesTab's formatDate
// (no Date, so no timezone shift on a date-only string).
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// A status dot, coloured by what the status actually means — the mock
// hardcoded `bg-danger` for every card, including "Closed", which read
// as an alert on a storyline that had been resolved.
const STATUS_DOT: Record<string, string> = {
  open: 'bg-danger',
  in_progress: 'bg-warning',
  closed: 'bg-success',
};

export interface HeadlinesTabProps {
  headlines: Headline[];
  isLoading: boolean;
  error: string | null;
  /** Omitted when there's no real entity to generate against (a direct
   * URL visit to an account page with no resolvable parent Customer —
   * see ActivityFeed's own prop doc). The button hides rather than
   * offering an action that can only 404. */
  onRegenerate?: () => Promise<void>;
  isRegenerating?: boolean;
  /** Shown as a banner above the cards, not in place of them — a failed
   * regenerate leaves the existing cards perfectly readable. */
  regenerateError?: string | null;
}

export function HeadlinesTab({
  headlines,
  isLoading,
  error,
  onRegenerate,
  isRegenerating = false,
  regenerateError = null,
}: HeadlinesTabProps) {
  const [confirming, setConfirming] = useState(false);
  const summaryItems = headlines.filter((item) => item.kind === 'summary');
  const feedItems = headlines.filter((item) => item.kind !== 'summary');

  // `group` arrives derived from period_end (see HeadlineSerializer) —
  // the mock stored it as free text, which is how it drifted from the
  // dates on the same card. Cards with no period_end have no group and
  // fall into one trailing untitled section rather than vanishing.
  const grouped = feedItems.reduce<Record<string, Headline[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  // Feed order is newest group first. Entries already arrive
  // period_end-descending within a group, so only the groups
  // themselves need sorting — by the newest card each one holds,
  // since "January 2026" doesn't sort chronologically as a string.
  const sortedGroups = Object.entries(grouped).sort((a, b) => {
    const newest = (items: Headline[]) =>
      items.reduce((max, item) => (item.period_end && item.period_end > max ? item.period_end : max), '');
    return newest(b[1]).localeCompare(newest(a[1]));
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <span className="text-sm font-semibold text-ink-faint">Loading headlines…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16">
        <span className="text-sm font-semibold text-danger">{error}</span>
      </div>
    );
  }

  // Regenerating discards the cards the model wrote last time, and
  // there's no undo — but only if there are any. With nothing generated
  // yet (a fresh account, or only hand-written cards, which the backend
  // never touches) there's nothing to lose, so the confirm would be
  // friction for no reason.
  const hasGeneratedCards = headlines.some((item) => item.generated_at !== null);

  function handleRegenerateClick() {
    if (hasGeneratedCards) {
      setConfirming(true);
    } else {
      void onRegenerate?.();
    }
  }

  const regenerateButton = onRegenerate && (
    <button
      onClick={handleRegenerateClick}
      disabled={isRegenerating}
      className="flex items-center gap-1.5 text-[12.5px] font-bold text-accent hover:text-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
      {isRegenerating ? 'Regenerating…' : 'Regenerate'}
    </button>
  );

  const confirmDialog = confirming && onRegenerate && (
    <ConfirmDialog
      title="Regenerate headlines?"
      message="This rewrites the cards written for this account from its current notes, emails, tickets and activities. The previous versions can't be recovered. Anything written by hand is left alone."
      confirmLabel="Regenerate"
      onConfirm={onRegenerate}
      onClose={() => setConfirming(false)}
    />
  );

  if (headlines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16">
        <LayoutTemplate className="w-10 h-10 text-ink-faint mb-2 opacity-40" />
        <span className="text-sm font-semibold text-ink-faint opacity-40">No headlines yet</span>
        {regenerateError && (
          <span className="text-[12.5px] font-semibold text-danger mt-3 max-w-md text-center">
            {regenerateError}
          </span>
        )}
        {onRegenerate && <div className="mt-4">{regenerateButton}</div>}
        {confirmDialog}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface font-sans p-6 md:p-8">
      {/* Title Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-accent" />
          <h2 className="text-[14.5px] font-extrabold text-accent tracking-wide">
            Account Headlines
          </h2>
        </div>
        {regenerateButton}
      </div>

      {regenerateError && (
        <div className="flex items-start gap-2 mb-6 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5">
          <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-px" />
          <span className="text-[12.5px] font-semibold text-danger">{regenerateError}</span>
        </div>
      )}

      <div className="pl-[2px]">
        {/* Summary cards (TL;DR) sit above the groups, without a pill */}
        {summaryItems.length > 0 && (
          <div className="mb-8 flex flex-col gap-5">
            {summaryItems.map((item) => (
              <HeadlineCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Card Items Section */}
        {sortedGroups.map(([group, groupItems]) => (
          <div key={group} className="mb-8">
            {group && (
              <div className="mb-5 inline-block bg-subtle rounded-full px-3.5 py-1 text-[11.5px] font-bold text-ink-muted">
                {group}
              </div>
            )}

            <div className="flex flex-col gap-5">
              {groupItems.map((item) => (
                <HeadlineCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {confirmDialog}
    </div>
  );
}

function HeadlineCard({ item }: { item: Headline }) {
  const [expanded, setExpanded] = useState(true);
  // Which footer a card gets follows `kind`, not whether it happens to
  // carry data sources. The mock used "has dataSources?" as a stand-in
  // for "is this the TL;DR?" because only its TL;DR had any — now that
  // the generator records sources on every card it writes, that proxy
  // would give storyline cards the summary footer and drop their date
  // span.
  const isSummary = item.kind === 'summary';

  return (
    <div className="bg-surface border border-line shadow-sm rounded-xl p-5 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <h4
          className="text-[14.5px] font-extrabold text-ink leading-snug group-hover:text-accent transition-colors cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {item.title}
        </h4>
        {item.status && (
          <div className="flex items-center gap-1.5 text-[12px] font-bold shrink-0 ml-4">
            <div
              className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[item.status] ?? 'bg-ink-faint'}`}
            />
            <span className="text-ink-muted">{item.status_display}</span>
          </div>
        )}
      </div>

      {expanded && (
        <p
          className={`text-[13px] text-ink-muted leading-[1.65] pr-2 ${isSummary ? 'mb-4' : 'mb-0'}`}
        >
          {item.content}
        </p>
      )}

      {/* Footer for TL;DR type cards */}
      {expanded && isSummary && (
        <div className="flex items-center gap-6 text-[12.5px] font-medium text-ink-muted pt-2 border-t border-transparent">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="w-4 h-4 text-ink-faint" />
            <span>
              Data sources:{' '}
              <span className="text-ink-muted font-semibold">{item.data_sources_display}</span>
            </span>
          </div>
          {item.time_period_label && (
            <div className="flex items-center gap-2 flex-wrap">
              <Clock className="w-4 h-4 text-ink-faint" />
              <span>
                Time period:{' '}
                <span className="text-ink-muted font-semibold">{item.time_period_label}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer for standard headline cards */}
      {!isSummary && item.period_start && (
        <div className="flex items-center justify-between mt-4 border-t border-transparent pt-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[12.5px] font-bold text-accent hover:text-accent-hover transition-colors"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            {expanded ? 'Hide details' : 'Show details'}
          </button>
          <div className="text-[12.5px] font-bold text-ink-muted flex items-center gap-1.5">
            {formatDate(item.period_start)}{' '}
            <span className="text-ink-faint font-normal">→</span>{' '}
            {item.period_end ? formatDate(item.period_end) : '—'}
          </div>
        </div>
      )}
    </div>
  );
}
