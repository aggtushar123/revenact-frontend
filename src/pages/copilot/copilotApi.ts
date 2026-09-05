// Thin wrappers over apiClient's apiFetch — same pattern as
// campaigns/campaignApi.ts's own, for the same reason: a Copilot
// conversation is scoped to one User, not a Customer/Account, so it
// lives here rather than as thunks in features/customers/customersSlice.ts.
import { apiFetch } from '../../lib/apiClient';
import type { Conversation, ConversationSummary } from './types';

// Pagination is off on this endpoint (see ConversationListView's own
// docstring) — a plain array, not fetchAllPages's {count,next,...} shape.
export function fetchConversations(): Promise<ConversationSummary[]> {
  return apiFetch<ConversationSummary[]>('/copilot/conversations/');
}

export function fetchConversation(id: number | string): Promise<Conversation> {
  return apiFetch<Conversation>(`/copilot/conversations/${id}/`);
}

export function deleteConversation(id: number): Promise<null> {
  return apiFetch<null>(`/copilot/conversations/${id}/`, { method: 'DELETE' });
}

// Omit `conversationId` to start a new Conversation (titled from this
// message) — see SendMessageView's own docstring.
export function sendMessage(params: { conversationId?: number; content: string }): Promise<Conversation> {
  return apiFetch<Conversation>('/copilot/messages/', {
    method: 'POST',
    body: { conversation_id: params.conversationId, content: params.content },
  });
}
