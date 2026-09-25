import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { usePagedPortfolio, usePortfolio } from './usePortfolio';
import { parseParams } from '../../../features/organizations/portfolioParams';
import { buildPortfolio, portfolioQueries, stubPortfolio } from '../../../features/organizations/testPortfolio';
import type { PortfolioResponse } from '../../../features/organizations/portfolioTypes';

const params = (search = '') => parseParams(new URLSearchParams(search));

/** A fetch stub whose responses are resolved by hand, in whatever order the
 *  test picks, so a "superseded request lands late" race can be reproduced. */
function stubDeferred() {
  const calls: { search: string; resolve: (body: PortfolioResponse) => void }[] = [];
  const spy = vi.fn((input: RequestInfo | URL) => {
    const url = new URL(String(input));
    return new Promise((resolve) => {
      calls.push({
        search: url.search,
        resolve: (body: PortfolioResponse) => resolve({ ok: true, status: 200, json: async () => body }),
      });
    });
  });
  vi.stubGlobal('fetch', spy);
  return calls;
}

const answer = (search: string) => buildPortfolio(new URLSearchParams(search.slice(1)));

describe('usePortfolio', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks for the frame only (limit 1) when grouped', async () => {
    const spy = stubPortfolio();
    const { result } = renderHook(() => usePortfolio(params(), 0));
    await waitFor(() => expect(result.current.data).not.toBeNull());
    const [frame] = portfolioQueries(spy);
    expect(frame.get('limit')).toBe('1');
    expect(frame.get('group')).toBe('health');
    expect(result.current.rows).toEqual([]);
    expect(result.current.data?.groups.map((g) => g.key)).toEqual(['average', 'good']);
    expect(result.current.total).toBeNull();
  });

  it('pages an ungrouped list with the cursor and reports each page', async () => {
    const spy = stubPortfolio({
      portfolio: (q) => {
        const two = new URLSearchParams(q);
        two.set('limit', '2');
        return buildPortfolio(two);
      },
    });
    const onLoaded = vi.fn();
    const { result } = renderHook(() => usePortfolio(params('group=none&include_churned=1'), 0, onLoaded));
    await waitFor(() => expect(result.current.rows.map((r) => r.id)).toEqual([7, 1]));
    expect(portfolioQueries(spy)[0].get('limit')).toBe('50');
    expect(result.current.next).toBe('2');
    await act(() => result.current.loadMore());
    expect(result.current.rows.map((r) => r.id)).toEqual([7, 1, 2]);
    expect(result.current.next).toBeNull();
    expect(portfolioQueries(spy).at(-1)?.get('cursor')).toBe('2');
    expect(onLoaded).toHaveBeenCalledTimes(2);
  });

  it('probes the unfiltered book for M when filtered, keeping the churn scope', async () => {
    const spy = stubPortfolio();
    const { result } = renderHook(() => usePortfolio(params('health=average'), 0));
    await waitFor(() => expect(result.current.total).toBe(2));
    expect(result.current.data?.count).toBe(1);
    const probe = portfolioQueries(spy).find((q) => q.toString() === 'limit=1');
    expect(probe).toBeDefined();

    const churn = renderHook(() => usePortfolio(params('include_churned=1&owner=2'), 0));
    await waitFor(() => expect(churn.result.current.total).toBe(3));
  });

  it('reports an error and retries', async () => {
    let fail = true;
    stubPortfolio({ portfolio: (q) => (fail ? { status: 500, body: { detail: 'Boom' } } : buildPortfolio(q)) });
    const { result } = renderHook(() => usePortfolio(params(), 0));
    await waitFor(() => expect(result.current.error).toBe('Boom'));
    expect(result.current.data).toBeNull();
    fail = false;
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.error).toBeNull();
  });

  it('refetches when the version changes', async () => {
    const spy = stubPortfolio();
    const { result, rerender } = renderHook(({ version }) => usePortfolio(params(), version), { initialProps: { version: 0 } });
    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ version: 1 });
    await waitFor(() => expect(portfolioQueries(spy)).toHaveLength(2));
  });

  it('does not fetch while disabled', async () => {
    const spy = stubPortfolio();
    const { result } = renderHook(() => usePagedPortfolio('group=health&group_value=poor&limit=25', false, 0));
    expect(result.current.loading).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  // Ruling: a stale cursor is tied to the old filters/sort/group and silently
  // returns page one, so a superseded request landing late must never win.
  it('ignores a response from a superseded request when the query changes mid-flight', async () => {
    const calls = stubDeferred();
    const { result, rerender } = renderHook(({ query }) => usePagedPortfolio(query, true, 0), {
      initialProps: { query: 'owner=2&limit=50' },
    });

    await waitFor(() => expect(calls).toHaveLength(1));
    rerender({ query: 'owner=3&limit=50' });
    await waitFor(() => expect(calls).toHaveLength(2));

    // The fresh (second) request lands first.
    calls[1].resolve(answer(calls[1].search));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rows.map((r) => r.id)).toEqual([1]);

    // The superseded (first) request resolves late; it must be ignored.
    calls[0].resolve(answer(calls[0].search));
    await Promise.resolve();
    await Promise.resolve();
    expect(result.current.rows.map((r) => r.id)).toEqual([1]);
    expect(result.current.loading).toBe(false);
  });

  it('does not send a stale cursor when Show more follows a params change', async () => {
    const calls = stubDeferred();
    const { result, rerender } = renderHook(({ query }) => usePagedPortfolio(query, true, 0), {
      initialProps: { query: 'limit=1' },
    });

    await waitFor(() => expect(calls).toHaveLength(1));
    calls[0].resolve(answer(calls[0].search));
    await waitFor(() => expect(result.current.next).toBe('1'));

    // Params change before the next page is requested.
    rerender({ query: 'owner=2&limit=1' });
    await waitFor(() => expect(calls).toHaveLength(2));

    // "Show more" clicked before the new page-one request has landed: it
    // must not fire a request carrying the old (now-stale) cursor.
    await act(() => result.current.loadMore());
    expect(calls).toHaveLength(2);
    expect(calls.some((c) => c.search.includes('cursor='))).toBe(false);

    calls[1].resolve(answer(calls[1].search));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rows.map((r) => r.id)).toEqual([7]);
  });
});
