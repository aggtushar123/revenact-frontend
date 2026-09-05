// A Multiplayer Copilot session — see the plan this was built from for the
// full PRD context. Deliberately NOT a real backend model: this whole
// slice is Phase 1's own explicit scope (BroadcastChannel/localStorage
// sync, no server), layered on top of the REAL services/copilot
// Conversation this session's own `conversationId` points at. The query,
// "thinking" state, and answer are all real Claude calls — only the
// multiplayer transport (who's watching, live redirects/hand-offs) is
// fake-for-now.
export interface CopilotSession {
  id: string;
  conversationId: number;
  customerId?: number;
  accountId?: number;
  accountName: string;
  ownerId: number;
  ownerName: string;
  // Explicit opt-in only — never set automatically by a risk signal (see
  // the plan's own "Default visibility" decision). A session with
  // isLive=false is just this one browser's own private bookkeeping.
  isLive: boolean;
  status: 'private' | 'live' | 'awaiting-handoff' | 'closed';
  transcript: SessionEvent[];
  participants: SessionParticipant[];
  createdAt: string;
  closedAt?: string;
}

export interface SessionParticipant {
  userId: number;
  userName: string;
  joinedAt: string;
}

export type SessionEvent =
  | { kind: 'query'; userId: number; userName: string; text: string; at: string }
  | { kind: 'thinking'; at: string }
  | { kind: 'answer'; text: string; at: string }
  | { kind: 'joined'; userId: number; userName: string; at: string }
  | { kind: 'redirected'; userId: number; userName: string; text: string; at: string }
  | {
      kind: 'handed-off';
      fromUserId: number;
      fromUserName: string;
      toUserId: number;
      toUserName: string;
      note: string;
      at: string;
    };
