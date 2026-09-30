import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { OPPORTUNITIES_KIND } from '../../../features/pipelines/pipelineKinds';
import { parsePipelineParams } from '../../../features/pipelines/pipelineParams';
import { pipelineQueries, stubPipelines } from '../../../features/pipelines/testPipelines';
import { usePipelineBook } from './usePipelineBook';

const params = (query: string) => parsePipelineParams(new URLSearchParams(query));

describe('usePipelineBook', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads a flat page of rows, and M for "N of M" when a filter is on', async () => {
    const spy = stubPipelines();
    const { result } = renderHook(() => usePipelineBook(OPPORTUNITIES_KIND, params('owner=3&group=none'), 'list', 0));
    await waitFor(() => expect(result.current.rows.map((row) => row.id)).toEqual([43]));
    await waitFor(() => expect(result.current.total).toBe(3));
    const probe = pipelineQueries(spy, 'opportunities').find((query) => query.get('limit') === '1');
    expect(probe?.get('owner')).toBeNull();
  });

  it('reads only the frame when grouped, and no M without a filter', async () => {
    const spy = stubPipelines();
    const { result } = renderHook(() => usePipelineBook(OPPORTUNITIES_KIND, params(''), 'list', 0));
    await waitFor(() => expect(result.current.data?.count).toBe(3));
    expect(result.current.rows).toEqual([]);
    expect(result.current.total).toBeNull();
    expect(pipelineQueries(spy, 'opportunities').map((query) => query.get('limit'))).toEqual(['1']);
  });

  it('counts M in the chosen stages, so N and M count the same set', async () => {
    const spy = stubPipelines();
    const { result } = renderHook(() =>
      usePipelineBook(OPPORTUNITIES_KIND, params('stage=negotiation,discovery&owner=3&group=none'), 'list', 0),
    );
    await waitFor(() => expect(result.current.total).toBe(2));
    expect(result.current.data?.count).toBe(0);
    const probe = pipelineQueries(spy, 'opportunities').find((query) => query.get('limit') === '1');
    expect(probe?.get('stage')).toBe('negotiation,discovery');
    expect(probe?.get('owner')).toBeNull();
  });

  it("counts the Board's M over every stage, as the Board lists them", async () => {
    const spy = stubPipelines();
    const { result } = renderHook(() => usePipelineBook(OPPORTUNITIES_KIND, params('owner=3'), 'board', 0));
    await waitFor(() => expect(result.current.total).toBe(5));
    const probe = pipelineQueries(spy, 'opportunities').find((query) => query.get('limit') === '1' && !query.has('group'));
    expect(probe?.get('stage')?.split(',')).toContain('closed_lost');
  });

  it('has no M when the stage choice is the only filter, since M would equal N', async () => {
    const spy = stubPipelines();
    const { result } = renderHook(() => usePipelineBook(OPPORTUNITIES_KIND, params('stage=negotiation&group=none'), 'list', 0));
    await waitFor(() => expect(result.current.rows.map((row) => row.id)).toEqual([41]));
    expect(result.current.total).toBeNull();
    expect(pipelineQueries(spy, 'opportunities')).toHaveLength(1);
  });
});
