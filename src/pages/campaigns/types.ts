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
  status: 'draft' | 'sent';
  status_display: string;
  recipients: CampaignRecipient[];
  send_log: CampaignSendLogEntry[];
  sent_count: number;
  skipped_count: number;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// `recipient_ids` is never a real serializer field on the backend (see
// CampaignSerializer's own docstring) — resolved server-side against
// the caller's own organisation, same reasoning as customer_id/
// account_id elsewhere in this app.
export type CampaignWritePayload = Pick<Campaign, 'name' | 'subject' | 'body'> & {
  recipient_ids?: number[];
};
