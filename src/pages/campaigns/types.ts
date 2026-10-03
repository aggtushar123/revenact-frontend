// Mirrors revenact-backend's CampaignSerializer field-for-field — see
// docs/API_CONTRACTS.md -> campaigns.

export interface CampaignRecipient {
  id: number;
  name: string;
  email: string;
}

export interface CampaignSendLogEntry {
  contact_id: number;
  contact_name: string;
  status: 'sent' | 'skipped';
  detail: string;
}

export interface Campaign {
  id: number;
  name: string;
  subject: string;
  body: string;
  // `sending` — claimed while its emails go out, and left there if the
  // send crashes, for an admin to reconcile; PATCH/DELETE/send all 400
  // while a campaign holds this status.
  status: 'draft' | 'sending' | 'sent';
  status_display: string;
  recipients: CampaignRecipient[];
  // Count of recipients the reader may not open — never named, only
  // counted (see docs/API_CONTRACTS.md -> campaigns, "Recipients are
  // twice filtered"). A reply saved before this field existed has none,
  // so a missing value is read as 0 everywhere this is consumed.
  hidden_recipients: number;
  send_log: CampaignSendLogEntry[];
  sent_count: number;
  skipped_count: number;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// `hidden_recipients` is served by every current backend reply, but an
// older cached/mocked one may lack it entirely — treated as 0 rather
// than NaN/undefined leaking into arithmetic or copy.
export function hiddenRecipientCount(campaign: Pick<Campaign, 'hidden_recipients'>): number {
  return campaign.hidden_recipients ?? 0;
}

// `recipient_ids` is never a real serializer field on the backend (see
// CampaignSerializer's own docstring) — resolved server-side against
// the caller's own organisation, same reasoning as customer_id/
// account_id elsewhere in this app.
export type CampaignWritePayload = Pick<Campaign, 'name' | 'subject' | 'body'> & {
  recipient_ids?: number[];
};
