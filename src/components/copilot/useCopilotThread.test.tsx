import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ApiError } from '../../lib/apiClient';
import type { SurfaceContext } from '../../pages/copilot/types';
import { stubCopilot } from './testCopilot';
import { refusalMessage, useCopilotThread } from './useCopilotThread';

const org = (organization: number): SurfaceContext => ({ surface: 'organizations', view: 'detail', organization, account: null, focus: null });
const board = (owner: string): SurfaceContext => ({ surface: 'organizations', view: 'board', filters: { owner }, focus: null });

function renderThread(context: SurfaceContext) {
  return renderHook(({ context: current }) => useCopilotThread(null, () => {}, current), { initialProps: { context } });
}

describe('useCopilotThread across context changes', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('drops a refusal that lands after the person moved to another organisation', async () => {
    const { release } = stubCopilot({ hold: true, refuse: { organization: ['Not an organisation you can open.'] } });
    const { result, rerender } = renderThread(org(7));
    let sent!: Promise<void>;
    act(() => {
      sent = result.current.send({ text: 'What changed?', content: 'What changed?', context: org(7) });
    });
    expect(result.current.pending).not.toBeNull();
    // The 400 is still on its way when the page becomes organisation 9.
    rerender({ context: org(9) });
    release();
    await act(() => sent);
    expect(result.current.pending).toBeNull();
    expect(result.current.failed).toBeNull();
  });

  it('still shows a refusal that lands on the organisation it was asked on', async () => {
    const { release } = stubCopilot({ hold: true, refuse: { organization: ['Not an organisation you can open.'] } });
    const { result } = renderThread(org(7));
    let sent!: Promise<void>;
    act(() => {
      sent = result.current.send({ text: 'What changed?', content: 'What changed?', context: org(7) });
    });
    release();
    await act(() => sent);
    expect(result.current.failed).toMatchObject({ refused: true, message: 'You can no longer ask about this organization.' });
  });

  it('clears a refusal once the context changes', async () => {
    stubCopilot({ refuse: { organization: ['Not an organisation you can open.'] } });
    const { result, rerender } = renderThread(org(7));
    await act(() => result.current.send({ text: 'What changed?', content: 'What changed?', context: org(7) }));
    expect(result.current.failed?.refused).toBe(true);
    rerender({ context: org(9) });
    expect(result.current.failed).toBeNull();
  });

  it('keeps a retryable failure, its question and Retry, across a filter change', async () => {
    const { spy } = stubCopilot({ statuses: [502] });
    const { result, rerender } = renderThread(board('2'));
    await act(() => result.current.send({ text: 'Who renews first?', content: 'Who renews first?', context: board('2') }));
    expect(result.current.failed).toMatchObject({ text: 'Who renews first?', refused: false, budget: false });
    rerender({ context: board('3') });
    expect(result.current.failed).toMatchObject({ text: 'Who renews first?', refused: false });
    // Retry still resends the question as it was asked.
    await act(async () => result.current.retry());
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
  });

  it('keeps a retryable failure that lands after a filter change', async () => {
    const { release } = stubCopilot({ hold: true, statuses: [502] });
    const { result, rerender } = renderThread(board('2'));
    let sent!: Promise<void>;
    act(() => {
      sent = result.current.send({ text: 'Who renews first?', content: 'Who renews first?', context: board('2') });
    });
    rerender({ context: board('3') });
    release();
    await act(() => sent);
    expect(result.current.failed).toMatchObject({ text: 'Who renews first?', refused: false });
  });

  it("keeps the budget message across a filter change: the month's budget is spent on every page", async () => {
    stubCopilot({ statuses: [429] });
    const { result, rerender } = renderThread(board('2'));
    await act(() => result.current.send({ text: 'Who renews first?', content: 'Who renews first?', context: board('2') }));
    rerender({ context: board('3') });
    expect(result.current.failed?.budget).toBe(true);
  });
});

describe('refusalMessage', () => {
  it('reads a Contacts refusal', () => {
    expect(refusalMessage(new ApiError(400, { context: { contact: ['Not a person you can open.'] } }, 'Bad'))).toBe(
      "You can't ask about this person here.",
    );
    expect(refusalMessage(new ApiError(400, { context: { filters: { account: ['Not an account you can open.'] } } }, 'Bad'))).toBe(
      "You can't ask about this list. Clear the filters and ask again.",
    );
  });
});
