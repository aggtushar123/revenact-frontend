// Mirrors revenact-backend's copilot serializers field-for-field — see
// docs/API_CONTRACTS.md -> copilot.

export type MessageRole = 'user' | 'assistant';

/** A record an answer was built from. A snapshot taken when the
 * answer was written, not a live reference — see the backend's
 * `_source_ref` for why. `id` is kept so the UI can still offer a link,
 * which simply won't resolve if the record has since been deleted. */
export interface MessageSource {
  type: 'email' | 'note' | 'ticket' | 'activity';
  id: number;
  label: string;
  date: string;
  company: string;
  company_type: 'customer' | 'account';
  company_id: number;
}

export interface CopilotMessage {
  id: number;
  role: MessageRole;
  content: string;
  /** Always present; empty on user turns and on answers that had
   * nothing specific to quote. */
  sources: MessageSource[];
  created_at: string;
}

// No nested `messages` — the shape `fetchConversations` returns, for the
// sidebar's own "Chat history" list.
export interface ConversationSummary {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

// Adds `messages` — the shape `fetchConversation`/`sendMessage` return.
export interface Conversation extends ConversationSummary {
  messages: CopilotMessage[];
}
