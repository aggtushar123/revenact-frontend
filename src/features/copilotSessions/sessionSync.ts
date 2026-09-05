// The Phase 1 "fake multiplayer" transport — no server, no precedent to
// copy: this repo has no BroadcastChannel/storage-event/WebSocket code
// anywhere else. Two layers:
//
// 1. Durability: every write persists the whole `byId` map to localStorage
//    so a freshly-opened tab (or a page reload) can rebuild session state
//    without depending on the live channel having been open the whole
//    time — the PRD's own non-functional requirement ("no reasoning step
//    or redirect is ever silently dropped... reconstructable from a
//    durable store, not just the live channel").
// 2. Live sync: BroadcastChannel where available, falling back to a
//    `storage` event listener (which only fires in *other* tabs, never
//    the one that wrote it — exactly the fallback this needs) when it
//    isn't. Same "same spirit as the existing localStorage-based auth
//    persistence" the PRD itself points at (see authSlice.ts's own
//    loadPersistedState), generalized to a live channel.
//
// Real, explicit limitation (see the plan): this only crosses tabs of the
// *same* browser profile — a genuinely different login in a different
// profile/device won't sync until Phase 2's real backend relay.

import type { CopilotSession } from './types';

const STORAGE_KEY = 'revenact_copilot_sessions';
const BUS_KEY = 'revenact_copilot_sessions_bus';
const CHANNEL_NAME = 'revenact-copilot-sessions-v1';

// One id per tab, for this tab's whole lifetime — lets a tab ignore its
// own broadcasts (an echo guard) instead of double-applying an action it
// already applied locally before broadcasting it.
export const TAB_ID = Math.random().toString(36).slice(2);

export function loadPersistedSessions(): Record<string, CopilotSession> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    // Corrupted localStorage — start fresh rather than crash the app.
    return {};
  }
}

export function persistSessions(byId: Record<string, CopilotSession>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(byId));
  } catch {
    // Private browsing / quota exceeded — sessions still work for this
    // tab's own lifetime via in-memory Redux state, just not durably.
  }
}

interface BusEnvelope {
  tabId: string;
  action: unknown;
}

/** Real BroadcastChannel where the browser supports it; a no-op-looking
 * shim (post via localStorage instead) where it doesn't — callers never
 * need to branch on which transport is actually active. */
function openChannel(): BroadcastChannel | null {
  try {
    return typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
  } catch {
    return null;
  }
}

export function broadcastAction(action: unknown): void {
  const envelope: BusEnvelope = { tabId: TAB_ID, action };
  const channel = openChannel();
  if (channel) {
    try {
      channel.postMessage(envelope);
    } catch {
      // Ignore — the storage-event write below still reaches other tabs.
    } finally {
      channel.close();
    }
  }
  // Written even when BroadcastChannel is available — a tab that missed
  // the live message (e.g. it was asleep) can still catch up from this
  // on its next storage-event tick, and it's the same fallback tabs
  // without BroadcastChannel rely on exclusively.
  try {
    localStorage.setItem(BUS_KEY, JSON.stringify({ ...envelope, at: Date.now() }));
  } catch {
    // Ignore — BroadcastChannel delivery (if available) still worked.
  }
}

/** Subscribes to remote actions from *other* tabs (this tab's own
 * broadcasts are filtered out via TAB_ID). Returns an unsubscribe fn. */
export function subscribeToRemoteActions(onAction: (action: unknown) => void): () => void {
  function handleEnvelope(envelope: unknown) {
    if (
      envelope &&
      typeof envelope === 'object' &&
      'tabId' in envelope &&
      'action' in envelope &&
      (envelope as BusEnvelope).tabId !== TAB_ID
    ) {
      onAction((envelope as BusEnvelope).action);
    }
  }

  const channel = openChannel();
  const handleMessage = (event: MessageEvent) => handleEnvelope(event.data);
  channel?.addEventListener('message', handleMessage);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== BUS_KEY || !event.newValue) return;
    try {
      handleEnvelope(JSON.parse(event.newValue));
    } catch {
      // Ignore a malformed bus entry.
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    channel?.removeEventListener('message', handleMessage);
    channel?.close();
    window.removeEventListener('storage', handleStorage);
  };
}
