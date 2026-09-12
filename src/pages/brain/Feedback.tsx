import { useEffect, useState } from 'react';
import { MessageSquareWarning, ShieldAlert } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import { fetchFeedback } from '../../features/feedback/feedbackSlice';
import type { FeedbackEntry, FeedbackKind } from '../../features/feedback/feedbackSlice';
import { formatDate } from '../../features/customers/formatters';

const KINDS: { key: FeedbackKind | ''; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'classification', label: 'Classifications' },
  { key: 'proposal', label: 'Proposals' },
  { key: 'health_override', label: 'Health overrides' },
];

/** A before→after line for one field, or nothing if it didn't change. */
function Change({ label, before, after }: { label: string; before: unknown; after: unknown }) {
  if (before === after) return null;
  const show = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v));
  return (
    <li className="text-[12px] tabular-nums">
      <span className="text-ink-faint">{label}: </span>
      <span className="text-ink-muted line-through">{show(before)}</span>
      <span className="text-ink-faint"> → </span>
      <span className="text-ink font-medium">{show(after)}</span>
    </li>
  );
}

function EntryBody({ entry }: { entry: FeedbackEntry }) {
  if (entry.kind === 'classification') {
    return (
      <ul className="flex flex-col gap-0.5">
        {(['area', 'category', 'subcategory', 'sentiment'] as const).map((k) => (
          <Change key={k} label={k} before={entry.before[k]} after={entry.after[k]} />
        ))}
      </ul>
    );
  }
  if (entry.kind === 'proposal') {
    const decision = String(entry.after.decision ?? '');
    return (
      <p className="text-[12px] text-ink-muted">
        The agent proposed a <span className="font-medium text-ink">{String(entry.before.kind)}</span>;{' '}
        <span className={`font-medium ${decision === 'approved' ? 'text-success' : 'text-danger'}`}>{decision}</span>.
      </p>
    );
  }
  return (
    <ul>
      <Change label="health score" before={entry.before.health_score} after={entry.after.health_score_override ?? 'rubric'} />
    </ul>
  );
}

/**
 * The feedback log — real, this time.
 *
 * The mock page of this name listed invented "feedback entries". This one
 * lists every correction a person made to something the system said: a
 * classification fixed by hand, a proposal approved or rejected, a health
 * score overridden. What the system said and what the person said sit in
 * the same row, which is what makes it worth keeping — it is the set of
 * cases the next prompt, taxonomy or rubric change should be read against.
 */
export function FeedbackLogPage() {
  const dispatch = useAppDispatch();
  const canSeeAll = useCapability('view_all_accounts');
  const { data, isLoading, error } = useAppSelector((s) => s.feedback);
  const [kind, setKind] = useState<FeedbackKind | ''>('');

  useEffect(() => {
    if (canSeeAll) dispatch(fetchFeedback(kind));
  }, [dispatch, canSeeAll, kind]);

  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MessageSquareWarning className="w-4 h-4 text-accent" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Company Brain</span>
        </div>
        <h1 className="text-[20px] font-bold text-ink tracking-tight">Feedback log</h1>
        <p className="text-[13px] text-ink-faint font-medium mt-0.5">
          Every time a person corrected the system — what it said, and what they said.
        </p>
      </div>

      {!canSeeAll && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          The feedback log spans every book, which needs the view-all-accounts capability.
        </div>
      )}

      {canSeeAll && (
        <div className="flex items-center gap-1 flex-wrap" role="tablist" aria-label="Kind">
          {KINDS.map((k) => {
            const count = k.key === '' ? total : (data?.counts[k.key] ?? 0);
            return (
              <button
                key={k.key}
                type="button"
                role="tab"
                aria-selected={kind === k.key}
                onClick={() => setKind(k.key)}
                className={`px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                  kind === k.key ? 'bg-accent-dim text-accent' : 'text-ink-muted hover:text-ink hover:bg-subtle'
                }`}
              >
                {k.label} <span className="text-ink-faint tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {error}
        </p>
      )}

      {canSeeAll && data && data.feedback.length === 0 && !isLoading && (
        <p className="text-[12.5px] text-ink-faint bg-subtle border border-line-subtle rounded-lg px-4 py-3">
          Nothing corrected yet. Corrections arrive from the AI Trending table, the review queue and
          health-score overrides.
        </p>
      )}

      {data && data.feedback.length > 0 && (
        <ul className={`flex flex-col gap-2 ${isLoading ? 'opacity-60' : ''}`}>
          {data.feedback.map((entry) => (
            <li key={entry.id} className="bg-surface border border-line-subtle rounded-lg px-4 py-3 flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint bg-subtle px-1.5 py-0.5 rounded shrink-0">
                    {entry.kind_display}
                  </span>
                  <span className="text-[13px] font-semibold text-ink truncate">{entry.subject_label}</span>
                </div>
                <span className="text-[11px] text-ink-faint shrink-0">
                  {entry.made_by ?? 'someone'} · {formatDate(entry.created_at.slice(0, 10))}
                </span>
              </div>
              <EntryBody entry={entry} />
              {entry.note && <p className="text-[12px] text-ink-muted italic">“{entry.note}”</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
