import { describe, it, expect } from 'vitest';
import reducer, { sessionSnapshotReceived, myInvitesReceived, inviteRemoved } from './copilotSessionsSlice';
import type { CopilotSession, SessionInvite } from './types';

const carl = { id: 1, name: 'Carl' };
const priya = { id: 2, name: 'Priya' };

function session(overrides: Partial<CopilotSession> = {}): CopilotSession {
  return {
    id: 9,
    conversation_id: 42,
    owner: carl,
    customer_id: 7,
    customer_name: 'Pizza Hut',
    account_id: null,
    account_name: null,
    status: 'live',
    participants: [{ user: carl, joined_at: '2026-09-05T10:14:02Z', left_at: null }],
    events: [
      {
        id: 1,
        kind: 'made_live',
        actor: carl,
        message: null,
        payload: {},
        created_at: '2026-09-05T10:14:02Z',
      },
    ],
    created_at: '2026-09-05T10:14:02Z',
    closed_at: null,
    ...overrides,
  };
}

describe('copilotSessionsSlice', () => {
  it('sessionSnapshotReceived stores a brand-new session keyed by conversation_id', () => {
    const state = reducer(undefined, sessionSnapshotReceived(session()));
    expect(state.byId[42]).toEqual(session());
  });

  it('a later snapshot with new events appends rather than replacing the event list', () => {
    const before = reducer(undefined, sessionSnapshotReceived(session()));
    const redirected = {
      id: 2,
      kind: 'redirected' as const,
      actor: priya,
      message: { id: 100, role: 'user' as const, content: 'Focus on the champion leaving.', created_at: 't2' },
      payload: {},
      created_at: 't2',
    };

    const after = reducer(
      before,
      sessionSnapshotReceived(
        session({
          events: [redirected],
          participants: [
            { user: carl, joined_at: '2026-09-05T10:14:02Z', left_at: null },
            { user: priya, joined_at: 't2', left_at: null },
          ],
        })
      )
    );

    expect(after.byId[42].events.map((e) => e.id)).toEqual([1, 2]);
    expect(after.byId[42].participants).toHaveLength(2);
  });

  it('re-receiving the same event by id is not duplicated', () => {
    const before = reducer(undefined, sessionSnapshotReceived(session()));
    const after = reducer(before, sessionSnapshotReceived(session()));
    expect(after.byId[42].events).toHaveLength(1);
  });

  it('a poll response with a fresher status/participants still merges cleanly', () => {
    const before = reducer(undefined, sessionSnapshotReceived(session({ status: 'live' })));
    const after = reducer(before, sessionSnapshotReceived(session({ status: 'awaiting_handoff', events: [] })));

    expect(after.byId[42].status).toBe('awaiting_handoff');
    // No new events this tick — the one from before is still there.
    expect(after.byId[42].events).toHaveLength(1);
  });

  it('myInvitesReceived replaces the whole list', () => {
    const invite: SessionInvite = {
      id: 5,
      status: 'pending',
      invited_by: carl,
      conversation_id: 42,
      conversation_title: 'Renewal risk',
      account_label: 'Pizza Hut',
      created_at: 't1',
    };
    const state = reducer(undefined, myInvitesReceived([invite]));
    expect(state.myInvites).toEqual([invite]);
  });

  it('inviteRemoved drops one invite by id without touching the rest', () => {
    const invites: SessionInvite[] = [
      {
        id: 5,
        status: 'pending',
        invited_by: carl,
        conversation_id: 42,
        conversation_title: 'A',
        account_label: null,
        created_at: 't1',
      },
      {
        id: 6,
        status: 'pending',
        invited_by: carl,
        conversation_id: 43,
        conversation_title: 'B',
        account_label: null,
        created_at: 't1',
      },
    ];
    const before = reducer(undefined, myInvitesReceived(invites));
    const after = reducer(before, inviteRemoved({ inviteId: 5 }));
    expect(after.myInvites.map((i) => i.id)).toEqual([6]);
  });
});
