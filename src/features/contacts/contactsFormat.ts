import type { CompanyRef, Contact, ContactSentimentEvidence } from '../customers/customersSlice';
import type { SummaryPart } from '../organizations/listSummaries';
import type { Analysis, Classification, ContactsSummary, Reading } from './contactsTypes';

// The words and tones the Contacts page and the organisation page's calls
// use for people, sentiment and a record's reading (spec 2026-09-28 §3, §5).

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const SENTIMENT_LABEL: Record<Reading, string> = { positive: 'Positive', neutral: 'Neutral', negative: 'Negative' };

/** A reading as a pill. */
export const SENTIMENT_PILL: Record<Reading, string> = {
  positive: 'bg-success-dim text-success',
  neutral: 'bg-subtle text-ink-muted',
  negative: 'bg-danger-dim text-danger',
};

/** A person's sentiment as a word in its colour, with a dot. */
export const SENTIMENT_TEXT: Record<Reading, string> = {
  positive: 'text-success',
  neutral: 'text-ink-muted',
  negative: 'text-danger',
};
export const SENTIMENT_DOT: Record<Reading, string> = {
  positive: 'bg-success',
  neutral: 'bg-line-strong',
  negative: 'bg-danger',
};

/** "142 people · 38 decision makers · 120 active · 61% positive · 12
 *  negative · +12.5% growth (30d)"; active and growth only when served,
 *  growth left out when it is null (nobody 30 days ago). */
export function contactsSummaryParts(s: ContactsSummary): SummaryPart[] {
  const growth = s.growth_30d_pct;
  return [
    { value: String(s.total), label: plural(s.total, 'person', 'people') },
    { value: String(s.decision_makers), label: plural(s.decision_makers, 'decision maker', 'decision makers') },
    ...(s.active !== undefined ? [{ value: String(s.active), label: 'active' }] : []),
    { value: `${s.total ? Math.round((s.positive / s.total) * 100) : 0}%`, label: 'positive' },
    { value: String(s.negative), label: 'negative' },
    ...(typeof growth === 'number' ? [{ value: `${growth > 0 ? '+' : ''}${growth}%`, label: 'growth (30d)' }] : []),
  ];
}

/** What a call, email or ticket reads as: its sentiment, "Not enough to
 *  analyse", or nothing while it waits to be read. A record from before
 *  `analysis` existed shows its sentiment, as it did. */
export function readingOf(record: { analysis?: Analysis; sentiment: string | null }): { label: string; tone: string } | null {
  if (record.analysis === 'not_analysable') return { label: 'Not enough to analyse', tone: 'bg-subtle text-ink-muted' };
  if (record.analysis === 'pending') return null;
  const sentiment = record.sentiment as Reading | null;
  if (!sentiment || !(sentiment in SENTIMENT_LABEL)) return null;
  return { label: SENTIMENT_LABEL[sentiment], tone: SENTIMENT_PILL[sentiment] };
}

/** "12 Sep", in UTC so a day never moves with the viewer's zone. */
export function dayMonth(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "12 Sep 2026". */
export function dayLabel(iso: string): string {
  return `${dayMonth(iso)} ${new Date(iso).getUTCFullYear()}`;
}

function listJoin(parts: string[]): string {
  if (parts.length < 2) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

function hasEvidence(e: ContactSentimentEvidence | Record<string, never>): e is ContactSentimentEvidence {
  return 'calls' in e && (e.calls ?? 0) + (e.emails ?? 0) + (e.tickets ?? 0) > 0;
}

/** Why a person reads as they do: "Neutral: 3 positive · 2 neutral · 1
 *  negative across 6 calls and 2 emails, latest 12 Sep". */
export function sentimentWhy(
  sentiment: Reading,
  source: Contact['sentiment_source'],
  evidence: ContactSentimentEvidence | Record<string, never>,
): string {
  const label = SENTIMENT_LABEL[sentiment];
  if (source !== 'computed' || !hasEvidence(evidence)) {
    return `${label}, set by hand. Nothing of theirs has been analysed yet.`;
  }
  const kinds = listJoin(
    [
      evidence.calls ? `${evidence.calls} ${plural(evidence.calls, 'call', 'calls')}` : '',
      evidence.emails ? `${evidence.emails} ${plural(evidence.emails, 'email', 'emails')}` : '',
      evidence.tickets ? `${evidence.tickets} ${plural(evidence.tickets, 'ticket', 'tickets')}` : '',
    ].filter(Boolean),
  );
  const latest = evidence.latest_at ? `, latest ${dayMonth(evidence.latest_at)}` : '';
  return `${label}: ${evidence.positive} positive · ${evidence.neutral} neutral · ${evidence.negative} negative across ${kinds}${latest}`;
}

/** "n calls" beside a person's sentiment, or where it came from. */
export function callsLabel(contact: Contact): string {
  const calls = 'calls' in contact.sentiment_evidence ? (contact.sentiment_evidence.calls ?? 0) : 0;
  if (calls) return `${calls} ${plural(calls, 'call', 'calls')}`;
  return contact.sentiment_source === 'manual' ? 'set by hand' : 'no calls';
}

/** "Customer Success › Account Management", blank parts left out. */
export function classificationLabel(c: Classification): string {
  return [c.area, c.category, c.subcategory].filter(Boolean).join(' › ');
}

/** A person's organisation and account, from the refs the list serves, or
 *  from the older fields a record from before them carries. */
export function placeOf(contact: Contact): { organisation: CompanyRef | null; account: CompanyRef | null } {
  const organisation = contact.organisation !== undefined ? contact.organisation : (contact.companies[0] ?? null);
  const account =
    contact.account !== undefined
      ? contact.account
      : contact.account_id && contact.account_name
        ? { id: contact.account_id, name: contact.account_name }
        : null;
  return { organisation, account };
}

/** "Kraft Heinz › EMEA", or the organisation alone. */
export function placeLabel(place: { organisation: CompanyRef | null; account: CompanyRef | null }): string {
  return [place.organisation?.name, place.account?.name].filter(Boolean).join(' › ');
}

/** Only http(s) lands in an href. */
export function safeUrl(url: string | null | undefined): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}
