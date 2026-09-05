import { describe, it, expect, beforeEach } from 'vitest';
import { loadPersistedSessions, persistSessions, broadcastAction, subscribeToRemoteActions } from './sessionSync';
import type { CopilotSession } from './types';

const SESSION: CopilotSession = {
  id: 'sess-1',
  conversationId: 1,
  accountName: 'Pizza Hut',
  ownerId: 1,
  ownerName: 'Carl',
  isLive: false,
  status: 'private',
  transcript: [],
  participants: [],
  createdAt: '2026-09-05T00:00:00Z',
};

describe('sessionSync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('persistence', () => {
    it('loadPersistedSessions returns {} when nothing is stored', () => {
      expect(loadPersistedSessions()).toEqual({});
    });

    it('loadPersistedSessions returns {} instead of throwing on corrupted JSON', () => {
      localStorage.setItem('revenact_copilot_sessions', '{not valid json');
      expect(loadPersistedSessions()).toEqual({});
    });

    it('round-trips a real session through persistSessions/loadPersistedSessions', () => {
      persistSessions({ 'sess-1': SESSION });
      expect(loadPersistedSessions()).toEqual({ 'sess-1': SESSION });
    });
  });

  describe('cross-tab bus', () => {
    it('delivers a broadcast from another (simulated) tab to a subscriber', async () => {
      const received: unknown[] = [];
      const unsubscribe = subscribeToRemoteActions((action) => received.push(action));

      // Simulate a different tab's own write to the shared bus key,
      // exactly what the `storage` event fallback listens for — real
      // `storage` events only fire in *other* tabs than the one that
      // wrote them, so this is dispatched manually here.
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'revenact_copilot_sessions_bus',
          newValue: JSON.stringify({ tabId: 'some-other-tab', action: { type: 'copilotSessions/sessionClosed' } }),
        })
      );

      expect(received).toEqual([{ type: 'copilotSessions/sessionClosed' }]);
      unsubscribe();
    });

    it('ignores its own broadcasts (echo guard)', () => {
      const received: unknown[] = [];
      const unsubscribe = subscribeToRemoteActions((action) => received.push(action));

      // broadcastAction always writes the bus key using this tab's own
      // TAB_ID — a real `storage` event never fires in the tab that made
      // the write, but the echo guard is what protects a BroadcastChannel
      // delivery (which *does* loop back) from double-applying it.
      broadcastAction({ type: 'copilotSessions/sessionClosed' });
      const stored = localStorage.getItem('revenact_copilot_sessions_bus');
      expect(stored).toBeTruthy();
      const envelope = JSON.parse(stored!);
      expect(envelope.action).toEqual({ type: 'copilotSessions/sessionClosed' });

      // Replaying that exact envelope as an incoming storage event (same
      // tabId) must be ignored.
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'revenact_copilot_sessions_bus', newValue: stored })
      );
      expect(received).toEqual([]);
      unsubscribe();
    });

    it('ignores storage events for unrelated keys', () => {
      const received: unknown[] = [];
      const unsubscribe = subscribeToRemoteActions((action) => received.push(action));

      window.dispatchEvent(
        new StorageEvent('storage', { key: 'revenact_access_token', newValue: 'irrelevant' })
      );

      expect(received).toEqual([]);
      unsubscribe();
    });

    it('unsubscribe stops further delivery', () => {
      const received: unknown[] = [];
      const unsubscribe = subscribeToRemoteActions((action) => received.push(action));
      unsubscribe();

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'revenact_copilot_sessions_bus',
          newValue: JSON.stringify({ tabId: 'some-other-tab', action: { type: 'x' } }),
        })
      );

      expect(received).toEqual([]);
    });
  });
});
