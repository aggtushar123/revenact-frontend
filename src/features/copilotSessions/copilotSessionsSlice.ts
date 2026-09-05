import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CopilotSession, SessionInvite } from './types';

// Multiplayer Copilot, Phase 2a — real backend-shaped state now (see
// types.ts's own docstring), populated from sessionApi.ts's real REST
// responses via a polling loop (see pages/copilot/Index.tsx's own
// useSessionPolling), not M0's BroadcastChannel/localStorage layer,
// which this supersedes entirely (no more `sessionsHydrated` — a fresh
// page load just re-fetches from the real backend instead of reading
// localStorage).

interface CopilotSessionsState {
  byId: Record<number, CopilotSession>;
  myInvites: SessionInvite[];
}

const initialState: CopilotSessionsState = {
  byId: {},
  myInvites: [],
};

export const copilotSessionsSlice = createSlice({
  name: 'copilotSessions',
  initialState,
  reducers: {
    // Handles every real response shape that carries a session snapshot
    // — a full GET (all events), a polling GET (`?since_id=`, only new
    // events), or a POST response (make-live/handoff/close, each
    // returning its own small full history) — by merging rather than
    // replacing the event list wholesale, this one reducer is correct
    // for all of them: a full fetch's events dedup against nothing (no
    // prior state) and a poll's few new events append onto what's
    // already there.
    sessionSnapshotReceived: (state, action: PayloadAction<CopilotSession>) => {
      const incoming = action.payload;
      const existing = state.byId[incoming.conversation_id];
      const existingIds = new Set(existing?.events.map((e) => e.id) ?? []);
      const events = existing
        ? [...existing.events, ...incoming.events.filter((e) => !existingIds.has(e.id))]
        : incoming.events;
      state.byId[incoming.conversation_id] = { ...incoming, events };
    },

    myInvitesReceived: (state, action: PayloadAction<SessionInvite[]>) => {
      state.myInvites = action.payload;
    },

    // Optimistic removal right after a real respond() call resolves —
    // the next fetchMyInvites() poll would drop it anyway, this just
    // avoids a flash of the just-answered invite before that happens.
    inviteRemoved: (state, action: PayloadAction<{ inviteId: number }>) => {
      state.myInvites = state.myInvites.filter((i) => i.id !== action.payload.inviteId);
    },
  },
});

export const { sessionSnapshotReceived, myInvitesReceived, inviteRemoved } =
  copilotSessionsSlice.actions;

export default copilotSessionsSlice.reducer;
