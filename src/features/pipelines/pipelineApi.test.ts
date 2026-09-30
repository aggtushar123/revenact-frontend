// Pinned to a non-UTC, non-DST zone (IST, UTC+5:30) so the export test's
// timezone assertions can actually fail on a UTC CI runner. Set before any
// Date is used; Node re-reads process.env.TZ on every local-time
// computation (storyDays.test.ts does the same).
process.env.TZ = 'Asia/Kolkata';

import { afterEach, describe, expect, it, vi } from 'vitest';
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

  it.each([
    ['just after local midnight', new Date(2026, 9, 1, 0, 30)],
    ['just before local midnight', new Date(2026, 9, 1, 23, 30)],
  ])('downloads the export named for the kind and the viewer\'s own calendar day (%s)', async (_label, today) => {
    const spy = stubPipelines();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await exportPipeline('risks', 'owner=2&sort=-mrr', today);
    const call = spy.mock.calls.find(([input]) => String(input).includes('/pipelines/risks/export.csv'));
    expect(String(call?.[0])).toContain('export.csv?owner=2&sort=-mrr');
    // The viewer's local date (IST here), not toISOString's UTC date: at
    // 00:30 IST this moment is still 2026-09-30 in UTC.
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('risks-2026-10-01.csv');
  });
});
