import { useId, useState } from 'react';
import { ExternalLink, FileText, Phone, Sparkles } from 'lucide-react';
import { durationLabel } from '../../../features/calls/callFormat';
import type { Call } from '../../../features/calls/callsSlice';
import { downloadAttachment } from '../../../features/files/filesSlice';
import { timeLabel } from '../../../features/organizations/storyDays';
import { AccountTag } from './ListParts';
import { ITEM_LINK, META, ROW_ICON, TITLE_BUTTON } from './listStyles';

const SENTIMENT: Record<Exclude<Call['sentiment'], ''>, { label: string; tone: string }> = {
  positive: { label: 'Positive', tone: 'bg-success-dim text-success' },
  neutral: { label: 'Neutral', tone: 'bg-subtle text-ink-muted' },
  negative: { label: 'Negative', tone: 'bg-danger-dim text-danger' },
};

/** One call as a plain row, like a Story item (spec 2026-09-27 §4): title
 *  and time, a one-line summary its title opens in place, then the account
 *  tag, host, duration, where it came from (a recorder, or who logged it),
 *  sentiment and the AI's classification, who was on it with their roles,
 *  and the transcript and recording. */
export function CallItem({ call }: { call: Call }) {
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const detailId = useId();
  const sentiment = call.sentiment ? SENTIMENT[call.sentiment] : null;
  // The value lands in an href: only http(s) is linked.
  const recording = /^https?:\/\//i.test(call.recording_url) ? call.recording_url : null;
  const who = [call.host_name, durationLabel(call.duration_minutes) || null].filter(Boolean).join(' · ');
  const source = call.connector_name ? `via ${call.connector_name}` : call.logged_by ? `logged by ${call.logged_by.name}` : null;
  const classification = call.ai_category || call.ai_area;
  const participants = call.participants
    .map((person) => (person.role_display ? `${person.name} · ${person.role_display}` : person.name))
    .join(', ');
  const transcript = call.transcript;

  async function openTranscript() {
    if (!transcript) return;
    setFailed(false);
    try {
      await downloadAttachment(transcript);
    } catch {
      setFailed(true);
    }
  }

  return (
    <li data-call={call.id} className="flex gap-3 px-3 py-2.5">
      <span aria-hidden="true" className={ROW_ICON}>
        <Phone className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <h4 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
            {call.summary ? (
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={expanded ? detailId : undefined}
                onClick={() => setExpanded((value) => !value)}
                className={TITLE_BUTTON}
              >
                {call.title}
              </button>
            ) : (
              call.title
            )}
          </h4>
          <time dateTime={call.occurred_at} className="shrink-0 font-mono-brand text-[11px] tabular-nums text-ink-muted">
            {timeLabel({ occurred_at: call.occurred_at, all_day: false })}
          </time>
        </div>
        {!call.summary ? (
          <p className="text-[13px] text-ink-muted">No summary yet.</p>
        ) : expanded ? (
          <p id={detailId} className="whitespace-pre-line break-words text-[13px] text-ink-muted">
            {call.summary}
          </p>
        ) : (
          <p className="truncate text-[13px] text-ink-muted">{call.summary}</p>
        )}
        <p className={META}>
          <AccountTag record={call} />
          <span className="min-w-0 truncate">{who}</span>
          {source ? <span className="min-w-0 truncate">{source}</span> : null}
          {sentiment ? <span className={`rounded-full px-2 py-0.5 ${sentiment.tone}`}>{sentiment.label}</span> : null}
          {classification ? (
            <span data-ai="" className="inline-flex min-w-0 items-center gap-1">
              <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="sr-only">AI classification: </span>
              <span className="truncate">{classification}</span>
            </span>
          ) : null}
        </p>
        {participants ? <p className="mt-0.5 break-words text-[11px] text-ink-muted">With {participants}</p> : null}
        {transcript || recording ? (
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-[13px] font-semibold">
            {transcript ? (
              <button type="button" onClick={() => void openTranscript()} className={`${ITEM_LINK} underline`}>
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                Transcript
              </button>
            ) : null}
            {recording ? (
              <a href={recording} target="_blank" rel="noopener noreferrer" className={`${ITEM_LINK} underline`}>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Recording
              </a>
            ) : null}
          </p>
        ) : null}
        {failed ? (
          <p role="alert" className="text-[11px] text-danger">
            Could not download the transcript.
          </p>
        ) : null}
      </div>
    </li>
  );
}
