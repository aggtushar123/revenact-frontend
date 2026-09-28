import { useId, useState } from 'react';
import { ExternalLink, Mail, Phone, Sparkles, Ticket } from 'lucide-react';
import { durationLabel } from '../../features/calls/callFormat';
import { classificationLabel, dayLabel, placeLabel, readingOf, safeUrl } from '../../features/contacts/contactsFormat';
import type { Classification, HistoryCall, HistoryEmail, HistoryTicket } from '../../features/contacts/contactsTypes';
import type { CompanyRef } from '../../features/customers/customersSlice';
import { ITEM_LINK, META, ROW_ICON, TITLE_BUTTON } from '../organizations/detail/listStyles';

// A person's calls, emails and tickets on their profile (spec 2026-09-28
// §3): plain rows like the organisation page's, each with its reading
// (sentiment, "Not enough to analyse", or nothing while it waits), the AI's
// classification and the organisation › account it is on.

function Reading({ record }: { record: { analysis: HistoryCall['analysis']; sentiment: HistoryCall['sentiment'] } }) {
  const reading = readingOf(record);
  return reading ? <span className={`rounded-full px-2 py-0.5 ${reading.tone}`}>{reading.label}</span> : null;
}

function Place({ organisation, account }: { organisation: CompanyRef | null; account: CompanyRef | null }) {
  const label = placeLabel({ organisation, account });
  return label ? <span className="inline-block min-w-0 max-w-[16rem] truncate rounded-full bg-subtle px-2 py-0.5 text-ink">{label}</span> : null;
}

function Classified({ classification }: { classification: Classification }) {
  const label = classificationLabel(classification);
  if (!label) return null;
  return (
    <span data-ai="" className="inline-flex min-w-0 items-center gap-1">
      <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="sr-only">AI classification: </span>
      <span className="truncate">{label}</span>
    </span>
  );
}

function When({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} className="shrink-0 font-mono-brand text-[11px] tabular-nums text-ink-muted">
      {dayLabel(iso)}
    </time>
  );
}

/** One call: date, title, reading, the summary its title opens in place,
 *  the classification, host and length, the organisation › account, and
 *  the recording. */
export function HistoryCallItem({ call }: { call: HistoryCall }) {
  const [expanded, setExpanded] = useState(false);
  const detailId = useId();
  const recording = safeUrl(call.link.url);
  const who = [call.host_name, durationLabel(call.duration_minutes) || null].filter(Boolean).join(' · ');
  return (
    <li data-history-call={call.id} className="flex gap-3 py-2.5">
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
          <When iso={call.occurred_at} />
        </div>
        {!call.summary ? (
          <p className="text-[13px] text-ink-muted">No summary.</p>
        ) : expanded ? (
          <p id={detailId} className="whitespace-pre-line break-words text-[13px] text-ink-muted">
            {call.summary}
          </p>
        ) : (
          <p className="truncate text-[13px] text-ink-muted">{call.summary}</p>
        )}
        <p className={META}>
          <Reading record={call} />
          <Place organisation={call.organisation} account={call.account} />
          {who ? <span className="min-w-0 truncate">{who}</span> : null}
          <Classified classification={call.classification} />
          {recording ? (
            <a href={recording} target="_blank" rel="noopener noreferrer" className={`${ITEM_LINK} font-semibold underline`}>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Recording
            </a>
          ) : null}
        </p>
      </div>
    </li>
  );
}

/** One email from them: subject, date, reading, snippet and where it is
 *  filed. Never a link — the app has no page for a thread outside an
 *  organisation's Story, and the backend can send no thread id at all
 *  (link.thread_id is nullable). */
export function HistoryEmailItem({ email }: { email: HistoryEmail }) {
  return (
    <li data-history-email={email.id} className="flex gap-3 py-2.5">
      <span aria-hidden="true" className={ROW_ICON}>
        <Mail className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <h4 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{email.subject || '(no subject)'}</h4>
          <When iso={email.sent_at} />
        </div>
        {email.snippet ? <p className="truncate text-[13px] text-ink-muted">{email.snippet}</p> : null}
        <p className={META}>
          <Reading record={email} />
          <Place organisation={email.organisation} account={email.account} />
          {email.sender_name ? <span className="min-w-0 truncate">from {email.sender_name}</span> : null}
          <Classified classification={email.classification} />
        </p>
      </div>
    </li>
  );
}

/** One ticket they raised: number, title, status, reading and the ticket itself. */
export function HistoryTicketItem({ ticket }: { ticket: HistoryTicket }) {
  const url = safeUrl(ticket.link.url);
  return (
    <li data-history-ticket={ticket.id} className="flex gap-3 py-2.5">
      <span aria-hidden="true" className={ROW_ICON}>
        <Ticket className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <h4 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
            <span className="font-mono-brand tabular-nums text-ink-muted">{ticket.ticket_number}</span> {ticket.title}
          </h4>
          <When iso={ticket.opened_at} />
        </div>
        <p className={META}>
          <span>{ticket.status_display}</span>
          <Reading record={ticket} />
          <Place organisation={ticket.organisation} account={ticket.account} />
          <Classified classification={ticket.classification} />
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className={`${ITEM_LINK} font-semibold underline`}>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Open ticket
            </a>
          ) : null}
        </p>
      </div>
    </li>
  );
}
