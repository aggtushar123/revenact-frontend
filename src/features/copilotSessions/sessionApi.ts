// Real REST calls backing Multiplayer Copilot, Phase 2a — mirrors
// revenact-backend's services/copilot/urls.py one-to-one. Same thin
// apiFetch-wrapper pattern as pages/copilot/copilotApi.ts.
import { apiFetch } from '../../lib/apiClient';
import type { CopilotSession, SessionInvite } from './types';
import type { Proposal } from '../proposals/proposalsSlice';

/** 404s (as an ApiError) when this conversation has no live session yet —
 * "explicit opt-in only" means most conversations never get one; the
 * caller treats that as "nothing to show", not an error banner. */
export function fetchSession(conversationId: number, sinceEventId?: number): Promise<CopilotSession> {
  const query = sinceEventId !== undefined ? `?since_id=${sinceEventId}` : '';
  return apiFetch<CopilotSession>(`/copilot/conversations/${conversationId}/session/${query}`);
}

/** Owner-only server-side — "Make this a live session". Optional
 * customer/account context, sourced from whatever entry point started
 * this conversation (see pages/copilot/Index.tsx's own
 * pendingAccountContext), only used the first time a session is created
 * for this conversation. */
export function makeSessionLive(
  conversationId: number,
  context?: { customerId?: number; accountId?: number }
): Promise<CopilotSession> {
  return apiFetch<CopilotSession>(`/copilot/conversations/${conversationId}/session/`, {
    method: 'POST',
    body: { customer_id: context?.customerId, account_id: context?.accountId },
  });
}

export function inviteToSession(conversationId: number, userId: number): Promise<SessionInvite> {
  return apiFetch<SessionInvite>(`/copilot/conversations/${conversationId}/session/invite/`, {
    method: 'POST',
    body: { user_id: userId },
  });
}

/** Hand-off implies invite server-side, and is its own independent way
 * for a session to start existing — not gated behind makeSessionLive
 * first (see SessionHandoffView's own docstring). Same optional
 * customer/account context as makeSessionLive, for the same reason:
 * only used the first time a session is created for this conversation. */
export function handOffSession(
  conversationId: number,
  toUserId: number,
  note: string,
  context?: { customerId?: number; accountId?: number }
): Promise<CopilotSession> {
  return apiFetch<CopilotSession>(`/copilot/conversations/${conversationId}/session/handoff/`, {
    method: 'POST',
    body: {
      to_user_id: toUserId,
      note,
      customer_id: context?.customerId,
      account_id: context?.accountId,
    },
  });
}

export function closeSession(conversationId: number): Promise<CopilotSession> {
  return apiFetch<CopilotSession>(`/copilot/conversations/${conversationId}/session/close/`, {
    method: 'POST',
  });
}

/** The caller's own pending invites — real data behind the sidebar's
 * "Invited to a live session" section, visible before the invitee has
 * accepted (and so before they could load the conversation itself). */
export function fetchMyInvites(): Promise<SessionInvite[]> {
  return apiFetch<SessionInvite[]>('/copilot/sessions/invites/');
}

export function respondToInvite(
  inviteId: number,
  responseStatus: 'accepted' | 'declined'
): Promise<SessionInvite> {
  return apiFetch<SessionInvite>(`/copilot/sessions/invites/${inviteId}/respond/`, {
    method: 'POST',
    body: { status: responseStatus },
  });
}

/** The proposals the facilitator already wrote from this session — 404s
 * (as an ApiError) when the conversation has no session. */
export function fetchSessionDecisions(conversationId: number): Promise<{ proposals: Proposal[] }> {
  return apiFetch<{ proposals: Proposal[] }>(`/copilot/conversations/${conversationId}/session/decisions/`);
}

/** Ask the facilitator to read the session and write what the people
 * decided into the review queue. A real, paid model call; any active
 * participant may ask, approving still happens in the queue. */
export function captureSessionDecisions(conversationId: number): Promise<{ proposals: Proposal[] }> {
  return apiFetch<{ proposals: Proposal[] }>(`/copilot/conversations/${conversationId}/session/decisions/`, {
    method: 'POST',
  });
}
