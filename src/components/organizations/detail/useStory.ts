import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchStory } from '../../../features/organizations/storyApi';
import type { StoryItem, StoryResponse } from '../../../features/organizations/storyTypes';
import { errorMessage } from '../portfolio/usePortfolio';

type Loaded = { key: string; data: StoryResponse; items: StoryItem[]; next: string | null } | { key: string; error: string };
type More = { key: string; loading: boolean; error: string | null };

export interface StoryState {
  /** Page one of the latest answer (its counts and attention). While a new
   *  query loads the previous answer stays, so the page does not flash empty. */
  data: StoryResponse | null;
  items: StoryItem[];
  /** The next page's cursor, for the current query only. */
  next: string | null;
  /** Page one of the current query has not landed yet. */
  loading: boolean;
  error: string | null;
  loadingMore: boolean;
  moreError: string | null;
  loadMore: () => Promise<void>;
  retry: () => void;
}

/** The story, cursor-paged (spec §2 "Paging"). `version` reloads it (after
 *  "+ Add"); `enabled` is off while another tab is open. */
export function useStory(orgId: number, query: string, version: number, enabled: boolean): StoryState {
  const [attempt, setAttempt] = useState(0);
  const key = `${orgId}?${query}#${version}#${attempt}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [more, setMore] = useState<More | null>(null);
  // Bumped whenever the read changes or unmounts, so a page two that lands
  // for an older read is dropped rather than appended to a newer one.
  const generation = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchStory(orgId, query).then(
      (data) => {
        if (!cancelled) setLoaded({ key, data, items: data.items, next: data.next_cursor });
      },
      (err: unknown) => {
        if (!cancelled) setLoaded({ key, error: errorMessage(err, 'Could not load the story.') });
      },
    );
    return () => {
      cancelled = true;
      generation.current += 1;
      inFlight.current = false;
    };
  }, [enabled, key, orgId, query]);

  const current = loaded && 'data' in loaded ? loaded : null;
  // The latest `current`, so `loadMore` reads it through a ref instead of
  // closing over it: a fresh page one landing (or a page being appended)
  // changes `current`'s identity on every load, and closing over it would
  // recreate `loadMore` just as often. `key`/`orgId`/`query` are enough to
  // define this callback's identity — they change only when the read itself
  // changes, synced in an effect below so no render ever reads a stale value.
  const currentRef = useRef(current);
  useEffect(() => {
    currentRef.current = current;
  });

  const loadMore = useCallback(async () => {
    const latest = currentRef.current;
    if (!latest || latest.key !== key || !latest.next || inFlight.current) return;
    const token = generation.current;
    inFlight.current = true;
    setMore({ key, loading: true, error: null });
    try {
      const page = await fetchStory(orgId, query, latest.next);
      if (generation.current !== token) return;
      setLoaded((prev) =>
        prev && 'data' in prev && prev.key === key
          ? { ...prev, items: [...prev.items, ...page.items], next: page.next_cursor }
          : prev,
      );
      setMore({ key, loading: false, error: null });
    } catch (err) {
      if (generation.current !== token) return;
      setMore({ key, loading: false, error: errorMessage(err, 'Could not load more of the story.') });
    } finally {
      if (generation.current === token) inFlight.current = false;
    }
  }, [key, orgId, query]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    data: current?.data ?? null,
    items: current?.items ?? [],
    next: current && current.key === key ? current.next : null,
    loading: enabled && loaded?.key !== key,
    error: loaded && 'error' in loaded && loaded.key === key ? loaded.error : null,
    loadingMore: more?.key === key ? more.loading : false,
    moreError: more?.key === key ? more.error : null,
    loadMore,
    retry,
  };
}
