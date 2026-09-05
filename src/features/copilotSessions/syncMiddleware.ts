import type { Middleware } from '@reduxjs/toolkit';
import { broadcastAction, persistSessions } from './sessionSync';
import type { CopilotSession } from './types';

interface SyncableAction {
  type: string;
  meta?: { fromSync?: boolean };
}

function isSyncableAction(action: unknown): action is SyncableAction {
  return typeof action === 'object' && action !== null && typeof (action as SyncableAction).type === 'string';
}

// Keeps sessionSync.ts's own persistence/broadcast layer a pure side
// effect, outside the slice's own reducers — the reducers stay plain and
// replay identically whether an action originated locally or arrived from
// another tab (see copilotSessionsSlice.ts's own sessionsHydrated/the
// plan's "same reducers replay" note).
//
// `meta.fromSync: true` marks an action that arrived FROM another tab
// (see App.tsx's own subscribeToRemoteActions wiring) — re-broadcasting
// and re-persisting it here would just echo it straight back out.
export const copilotSessionsSyncMiddleware: Middleware = (store) => (next) => (action: unknown) => {
  const result = next(action);

  if (isSyncableAction(action) && action.type.startsWith('copilotSessions/') && !action.meta?.fromSync) {
    const state = store.getState() as { copilotSessions: { byId: Record<string, CopilotSession> } };
    persistSessions(state.copilotSessions.byId);
    broadcastAction(action);
  }

  return result;
};
