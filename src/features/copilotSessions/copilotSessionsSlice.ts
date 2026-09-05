import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CopilotSession, SessionEvent } from './types';
import { loadPersistedSessions } from './sessionSync';

// Plain createSlice, same convention as features/tasks/tasksSlice.ts —
// not the createAsyncThunk one customersSlice.ts uses, because there's no
// backend behind this slice at all (see the plan this was built from):
// every session here lives in this browser's own localStorage, synced
// live across tabs by sessionSync.ts's own BroadcastChannel/storage-event
// layer (wired up as Redux middleware — see syncMiddleware.ts — rather
// than called from inside these reducers, so the reducers themselves stay
// plain and the *same* actions replay correctly whether they originated
// locally or from another tab).

interface CopilotSessionsState {
  byId: Record<string, CopilotSession>;
}

const initialState: CopilotSessionsState = {
  byId: loadPersistedSessions(),
};

interface StartSessionPayload {
  id: string;
  conversationId: number;
  customerId?: number;
  accountId?: number;
  accountName: string;
  ownerId: number;
  ownerName: string;
  query: string;
  at: string;
}

function pushEvent(session: CopilotSession, event: SessionEvent) {
  session.transcript.push(event);
}

export const copilotSessionsSlice = createSlice({
  name: 'copilotSessions',
  initialState,
  reducers: {
    // Lazily created on the first real message of a conversation started
    // from an "Ask Copilot about this account" entry point — same
    // "no ghost rows for content that was never really started"
    // convention as the real Conversation itself.
    sessionStarted: (state, action: PayloadAction<StartSessionPayload>) => {
      const { id, conversationId, customerId, accountId, accountName, ownerId, ownerName, query, at } =
        action.payload;
      state.byId[id] = {
        id,
        conversationId,
        customerId,
        accountId,
        accountName,
        ownerId,
        ownerName,
        isLive: false,
        status: 'private',
        transcript: [{ kind: 'query', userId: ownerId, userName: ownerName, text: query, at }],
        participants: [{ userId: ownerId, userName: ownerName, joinedAt: at }],
        createdAt: at,
      };
    },

    // "Make this a live session" — explicit opt-in only, never automatic.
    sessionMadeLive: (state, action: PayloadAction<{ id: string }>) => {
      const session = state.byId[action.payload.id];
      if (session && session.status !== 'closed') {
        session.isLive = true;
        session.status = 'live';
      }
    },

    thinkingStarted: (state, action: PayloadAction<{ id: string; at: string }>) => {
      const session = state.byId[action.payload.id];
      if (session) pushEvent(session, { kind: 'thinking', at: action.payload.at });
    },

    // The real Claude reply — appended once the real API call resolves.
    answerRecorded: (state, action: PayloadAction<{ id: string; text: string; at: string }>) => {
      const session = state.byId[action.payload.id];
      if (session) {
        pushEvent(session, { kind: 'answer', text: action.payload.text, at: action.payload.at });
      }
    },

    // Any message after the session's own first (the query) is, by
    // definition, a redirect — a real follow-up into the same real
    // conversation, not scripted (see the plan's own "reasoning
    // fidelity" decision).
    redirectSent: (
      state,
      action: PayloadAction<{ id: string; userId: number; userName: string; text: string; at: string }>
    ) => {
      const session = state.byId[action.payload.id];
      if (session) {
        const { userId, userName, text, at } = action.payload;
        pushEvent(session, { kind: 'redirected', userId, userName, text, at });
      }
    },

    participantJoined: (
      state,
      action: PayloadAction<{ id: string; userId: number; userName: string; at: string }>
    ) => {
      const session = state.byId[action.payload.id];
      if (!session) return;
      const { userId, userName, at } = action.payload;
      if (!session.participants.some((p) => p.userId === userId)) {
        session.participants.push({ userId, userName, joinedAt: at });
        pushEvent(session, { kind: 'joined', userId, userName, at });
      }
    },

    handedOff: (
      state,
      action: PayloadAction<{
        id: string;
        fromUserId: number;
        fromUserName: string;
        toUserId: number;
        toUserName: string;
        note: string;
        at: string;
      }>
    ) => {
      const session = state.byId[action.payload.id];
      if (!session) return;
      const { fromUserId, fromUserName, toUserId, toUserName, note, at } = action.payload;
      session.status = 'awaiting-handoff';
      pushEvent(session, { kind: 'handed-off', fromUserId, fromUserName, toUserId, toUserName, note, at });
    },

    sessionClosed: (state, action: PayloadAction<{ id: string; at: string }>) => {
      const session = state.byId[action.payload.id];
      if (session) {
        session.status = 'closed';
        session.closedAt = action.payload.at;
      }
    },

    // Only ever dispatched by syncMiddleware.ts when hydrating this tab
    // from another tab's own persisted state (e.g. this tab opened after
    // sessions already existed) — not a user-facing action.
    sessionsHydrated: (state, action: PayloadAction<Record<string, CopilotSession>>) => {
      state.byId = { ...action.payload, ...state.byId };
    },
  },
});

export const {
  sessionStarted,
  sessionMadeLive,
  thinkingStarted,
  answerRecorded,
  redirectSent,
  participantJoined,
  handedOff,
  sessionClosed,
  sessionsHydrated,
} = copilotSessionsSlice.actions;

export default copilotSessionsSlice.reducer;
