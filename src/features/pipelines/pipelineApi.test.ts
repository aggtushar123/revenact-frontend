import { afterEach, describe, expect, it, vi } from 'vitest';
import { localDay } from '../organizations/storyDays';
import { bulkUpdatePipeline, exportPipeline, fetchPipeline } from './pipelineApi';
import { pipelineBulkBodies, pipelineQueries, stubPipelines } from './testPipelines';

describe('the Pipelines API', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reads each kind at its own path with the query it is given', async () => {
    const spy = stubPipelines();
    const data = await fetchPipeline('risks', 'group=stage&sort=-mrr');
    expect(pipelineQueries(spy, 'risks')[0].get('group')).toBe('stage');
    expect(data.kind).toBe('risks');
    await fetchPipeline('opportunities', '');
    expect(String(spy.mock.calls[1][0])).toMatch(/\/api\/v1\/pipelines\/opportunities\/$/);
  });

  it('posts a bulk edit to the kind and returns what was updated and what failed', async () => {
    const spy = stubPipelines();
    const result = await bulkUpdatePipeline('opportunities', { ids: [41, 999], action: 'set_date', value: null });
    expect(result).toEqual({ updated: [41], failed: [{ id: 999, reason: 'Not found.' }] });
    expect(pipelineBulkBodies(spy, 'opportunities')).toEqual([{ ids: [41, 999], action: 'set_date', value: null }]);
  });

  it("downloads the export with the query, named for the kind and the viewer's own calendar day", async () => {
    const spy = stubPipelines();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const today = new Date('2026-10-01T12:00:00Z');
    await exportPipeline('risks', 'owner=2&sort=-mrr', today);
    const call = spy.mock.calls.find(([input]) => String(input).includes('/pipelines/risks/export.csv'));
    expect(String(call?.[0])).toContain('export.csv?owner=2&sort=-mrr');
    // The viewer's local date, not toISOString's UTC date.
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe(`risks-${localDay(today)}.csv`);
  });
});
