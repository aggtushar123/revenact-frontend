import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { manyItems, storyQueries, stubOrganizationPage } from '../../../features/organizations/testStory';
import { useStory } from './useStory';

describe('useStory', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads page one, then appends the next page with the cursor it was given', async () => {
    const spy = stubOrganizationPage({ items: manyItems(35) });
    const { result } = renderHook(() => useStory(7, 'limit=30', 0, true));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.items).toHaveLength(30));
    expect(result.current.next).toBe('30');
    expect(result.current.data?.counts.by_group.tasks).toBe(35);
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.items).toHaveLength(35);
    expect(result.current.next).toBeNull();
    expect(storyQueries(spy).map((query) => query.get('cursor'))).toEqual([null, '30']);
  });

  it('reads nothing while disabled', () => {
    const spy = stubOrganizationPage();
    const { result } = renderHook(() => useStory(7, 'limit=30', 0, false));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('keeps the last answer on screen while a new query loads', async () => {
    stubOrganizationPage();
    const { result, rerender } = renderHook(({ query }) => useStory(7, query, 0, true), {
      initialProps: { query: 'limit=30' },
    });
    await waitFor(() => expect(result.current.items).toHaveLength(5));
    rerender({ query: 'group=tickets&limit=30' });
    expect(result.current.loading).toBe(true);
    expect(result.current.items).toHaveLength(5);
    expect(result.current.next).toBeNull();
    await waitFor(() => expect(result.current.items.map((item) => item.id)).toEqual([88]));
  });

  it('reports a failed read, and Try again reads again', async () => {
    stubOrganizationPage({ failStory: 1 });
    const { result } = renderHook(() => useStory(7, 'limit=30', 0, true));
    await waitFor(() => expect(result.current.error).toBe('Try later.'));
    expect(result.current.data).toBeNull();
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.items).toHaveLength(5));
    expect(result.current.error).toBeNull();
  });

  it('reads again when the version changes (after something was added)', async () => {
    const spy = stubOrganizationPage();
    const { rerender } = renderHook(({ version }) => useStory(7, 'limit=30', version, true), { initialProps: { version: 0 } });
    await waitFor(() => expect(storyQueries(spy)).toHaveLength(1));
    rerender({ version: 1 });
    await waitFor(() => expect(storyQueries(spy)).toHaveLength(2));
  });
});
