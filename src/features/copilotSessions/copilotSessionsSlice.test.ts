import { describe, it, expect } from 'vitest';
import reducer, {
  sessionStarted,
  sessionMadeLive,
  thinkingStarted,
  answerRecorded,
  redirectSent,
  participantJoined,
  handedOff,
  sessionClosed,
} from './copilotSessionsSlice';

const START = {
  id: 'sess-1',
  conversationId: 42,
  customerId: 7,
  accountName: 'Pizza Hut',
  ownerId: 1,
  ownerName: 'Carl',
  query: "Why is Pizza Hut at risk?",
  at: '2026-09-05T10:14:02Z',
};

function stateAfter(...actions: { type: string; payload: unknown }[]) {
  return actions.reduce((state, action) => reducer(state, action), reducer(undefined, sessionStarted(START)));
}

describe('copilotSessionsSlice', () => {
  it('sessionStarted creates a private session with the query as its first transcript event', () => {
    const state = reducer(undefined, sessionStarted(START));
    const session = state.byId['sess-1'];

    expect(session.status).toBe('private');
    expect(session.isLive).toBe(false);
    expect(session.transcript).toEqual([
      { kind: 'query', userId: 1, userName: 'Carl', text: START.query, at: START.at },
    ]);
    expect(session.participants).toEqual([{ userId: 1, userName: 'Carl', joinedAt: START.at }]);
  });

  it('sessionMadeLive is explicit opt-in — never set by sessionStarted itself', () => {
    const before = reducer(undefined, sessionStarted(START));
    expect(before.byId['sess-1'].isLive).toBe(false);

    const after = reducer(before, sessionMadeLive({ id: 'sess-1' }));
    expect(after.byId['sess-1'].isLive).toBe(true);
    expect(after.byId['sess-1'].status).toBe('live');
  });

  it('thinkingStarted and answerRecorded append real-call lifecycle events', () => {
    const before = reducer(undefined, sessionStarted(START));
    const afterThinking = reducer(before, thinkingStarted({ id: 'sess-1', at: '2026-09-05T10:14:03Z' }));
    const afterAnswer = reducer(
      afterThinking,
      answerRecorded({ id: 'sess-1', text: 'Real Claude reply.', at: '2026-09-05T10:14:22Z' })
    );

    const kinds = afterAnswer.byId['sess-1'].transcript.map((e) => e.kind);
    expect(kinds).toEqual(['query', 'thinking', 'answer']);
  });

  it('redirectSent appends a redirected event without touching the query', () => {
    const state = stateAfter(
      redirectSent({ id: 'sess-1', userId: 2, userName: 'Priya', text: 'Focus on the champion leaving.', at: '2026-09-05T10:14:12Z' })
    );

    expect(state.byId['sess-1'].transcript).toHaveLength(2);
    expect(state.byId['sess-1'].transcript[1]).toEqual({
      kind: 'redirected',
      userId: 2,
      userName: 'Priya',
      text: 'Focus on the champion leaving.',
      at: '2026-09-05T10:14:12Z',
    });
  });

  it('participantJoined adds a new participant and a joined event, once per user', () => {
    const once = stateAfter(participantJoined({ id: 'sess-1', userId: 2, userName: 'Priya', at: '2026-09-05T10:14:09Z' }));
    expect(once.byId['sess-1'].participants).toHaveLength(2);
    expect(once.byId['sess-1'].transcript.filter((e) => e.kind === 'joined')).toHaveLength(1);

    // Re-joining (e.g. opening the link twice) doesn't duplicate.
    const twice = reducer(
      once,
      participantJoined({ id: 'sess-1', userId: 2, userName: 'Priya', at: '2026-09-05T10:20:00Z' })
    );
    expect(twice.byId['sess-1'].participants).toHaveLength(2);
    expect(twice.byId['sess-1'].transcript.filter((e) => e.kind === 'joined')).toHaveLength(1);
  });

  it('handedOff sets status to awaiting-handoff and logs the chain of custody', () => {
    const state = stateAfter(
      handedOff({
        id: 'sess-1',
        fromUserId: 2,
        fromUserName: 'Priya',
        toUserId: 3,
        toUserName: 'Jordan',
        note: 'Own the recovery call.',
        at: '2026-09-05T10:14:30Z',
      })
    );

    expect(state.byId['sess-1'].status).toBe('awaiting-handoff');
    const event = state.byId['sess-1'].transcript.find((e) => e.kind === 'handed-off');
    expect(event).toMatchObject({ fromUserName: 'Priya', toUserName: 'Jordan', note: 'Own the recovery call.' });
  });

  it('a session can be handed off more than once, keeping the full chain', () => {
    const state = stateAfter(
      handedOff({ id: 'sess-1', fromUserId: 1, fromUserName: 'Carl', toUserId: 2, toUserName: 'Priya', note: 'First', at: 't1' }),
      handedOff({ id: 'sess-1', fromUserId: 2, fromUserName: 'Priya', toUserId: 3, toUserName: 'Jordan', note: 'Second', at: 't2' })
    );

    const handoffs = state.byId['sess-1'].transcript.filter((e) => e.kind === 'handed-off');
    expect(handoffs).toHaveLength(2);
  });

  it('sessionClosed sets status and closedAt', () => {
    const state = stateAfter(sessionClosed({ id: 'sess-1', at: '2026-09-05T11:00:00Z' }));
    expect(state.byId['sess-1'].status).toBe('closed');
    expect(state.byId['sess-1'].closedAt).toBe('2026-09-05T11:00:00Z');
  });

  it('actions against an unknown session id are a harmless no-op', () => {
    const before = reducer(undefined, sessionStarted(START));
    const after = reducer(before, sessionClosed({ id: 'does-not-exist', at: 'now' }));
    expect(after).toEqual(before);
  });
});
