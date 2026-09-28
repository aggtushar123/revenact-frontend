import type { CompanyRef, Contact, ContactSentimentEvidence } from '../customers/customersSlice';

// The Contacts page's backend contract (revenact-backend
// docs/API_CONTRACTS.md: GET /api/v1/contacts/ and
// GET /api/v1/contacts/<id>/history/).

/** Whether a record has been read: `pending` (not yet), `not_analysable`
 *  (a call with nothing to judge) or `analysed`. */
export type Analysis = 'pending' | 'not_analysable' | 'analysed';

export type Reading = Contact['sentiment'];

/** Over the whole filtered set, not the page. */
export interface ContactsSummary {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  decision_makers: number;
}

export interface ContactsPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: Contact[];
  /** Optional: a response from before the redesign has none. */
  summary?: ContactsSummary;
}

export interface Classification {
  area: string;
  category: string;
  subcategory: string;
}

interface HistoryRow {
  id: number;
  analysis: Analysis;
  /** Null unless `analysis` is `analysed`. */
  sentiment: Reading | null;
  classification: Classification;
  organisation: CompanyRef | null;
  account: CompanyRef | null;
}

export interface HistoryCall extends HistoryRow {
  title: string;
  occurred_at: string;
  duration_minutes: number | null;
  host_name: string;
  summary: string;
  link: { url: string | null };
}

export interface HistoryEmail extends HistoryRow {
  subject: string;
  sent_at: string;
  sender_name: string;
  snippet: string;
  /** Null when the backend cannot thread the email; the app has no page
   *  for a thread outside an organisation's Story either way (an email
   *  never links). */
  link: { thread_id: string | null };
}

export interface HistoryTicket extends HistoryRow {
  ticket_number: string;
  title: string;
  status: string;
  status_display: string;
  opened_at: string;
  link: { url: string | null };
}

/** Newest first, the newest 100 of each kind; `counts` are the visible totals. */
export interface ContactHistory {
  contact_id: number;
  sentiment: Reading;
  sentiment_source: Contact['sentiment_source'];
  sentiment_evidence: ContactSentimentEvidence | Record<string, never>;
  counts: { calls: number; emails: number; tickets: number };
  calls: HistoryCall[];
  emails: HistoryEmail[];
  tickets: HistoryTicket[];
}
