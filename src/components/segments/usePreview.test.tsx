import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { ApiError } from '../../lib/apiClient';
import * as api from '../../features/segments/segmentApi';
import type { PreviewRequest, PreviewResponse } from '../../features/segments/segmentTypes';
import { summaryOf } from '../../features/segments/testSegments';
import { PREVIEW_DEBOUNCE_MS, usePreview } from './usePreview';

vi.mock('../../features/segments/segmentApi');

const request = (value: number): PreviewRequest => ({ kind: 'customer', rules: { match: 'all', conditions: [{ field: 'csat_score', op: 'lt', value }] } });
const answer = (count: number): PreviewResponse => ({ kind: 'customer', count, results: [], summary: summaryOf(count, 'customer') });

/** A promise the test settles by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('usePreview (plan Decision 3)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(api.previewSegment).mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('asks nothing while a condition is unfinished', async () => {
    const { result } = renderHook(() => usePreview(null));
    await act(async () => {
      vi.advanceTimersByTime(PREVIEW_DEBOUNCE_MS * 2);
    });
    expect(result.current).toEqual({ status: 'incomplete' });
    expect(api.previewSegment).not.toHaveBeenCalled();
  });

  it('asks once, 400ms after the last change, with the last rules', async () => {
    vi.mocked(api.previewSegment).mockResolvedValue(answer(41));
    const { result, rerender } = renderHook(({ r }) => usePreview(r), { initialProps: { r: request(50) } });
    rerender({ r: request(55) });
    await act(async () => {
      vi.advanceTimersByTime(PREVIEW_DEBOUNCE_MS - 1);
    });
    rerender({ r: request(60) });
    await act(async () => {
      vi.advanceTimersByTime(PREVIEW_DEBOUNCE_MS);
    });
    expect(api.previewSegment).toHaveBeenCalledTimes(1);
    expect(api.previewSegment).toHaveBeenCalledWith(request(60));
    expect(result.current).toEqual({ status: 'ready', data: answer(41) });
  });

  it('drops an answer a newer request superseded, keeping the last good one on screen meanwhile', async () => {
    const first = deferred<PreviewResponse>();
    const second = deferred<PreviewResponse>();
    vi.mocked(api.previewSegment).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result, rerender } = renderHook(({ r }) => usePreview(r), { initialProps: { r: request(50) } });
    await act(async () => {
      vi.advanceTimersByTime(PREVIEW_DEBOUNCE_MS);
    });
    rerender({ r: request(60) });
    await act(async () => {
      vi.advanceTimersByTime(PREVIEW_DEBOUNCE_MS);
    });
    await act(async () => {
      second.resolve(answer(12));
    });
    expect(result.current).toEqual({ status: 'ready', data: answer(12) });
    await act(async () => {
      first.resolve(answer(99));
    });
    expect(result.current).toEqual({ status: 'ready', data: answer(12) });
    rerender({ r: request(70) });
    expect(result.current).toEqual({ status: 'loading', last: answer(12) });
  });

  it('reads a refusal as its rules message', async () => {
    vi.mocked(api.previewSegment).mockRejectedValue(new ApiError(400, { rules: ['"is" cannot be used with Health score.'] }, 'x'));
    const { result } = renderHook(() => usePreview(request(50)));
    await act(async () => {
      vi.advanceTimersByTime(PREVIEW_DEBOUNCE_MS);
    });
    expect(result.current).toEqual({ status: 'error', message: '"is" cannot be used with Health score.' });
  });
});
