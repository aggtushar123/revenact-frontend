// Mirrors revenact-backend's copilot serializers field-for-field — see
// docs/API_CONTRACTS.md -> copilot.

export type MessageRole = 'user' | 'assistant';

export interface CopilotMessage {
  id: number;
  role: MessageRole;
  content: string;
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
