import { useEffect, useId, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { ADD_FLOWS, STORY_GROUPS, offeredSources, type AddKind } from '../../../features/organizations/storyKinds';
import type { StoryCounts, StoryGroup, StoryKind } from '../../../features/organizations/storyTypes';
import { FOCUS, PRIMARY } from '../portfolio/styles';
import { CountChip } from './CountChip';
import { Menu } from './Menu';
import { SourcesPicker } from './SourcesPicker';

const SEARCH_DELAY_MS = 300;

/** The story's toolbar (spec §1.6): the six filters with their counts,
 *  Sources, search and + Add. */
export function StoryToolbar({
  group,
  sources,
  q,
  byGroup,
  byKind,
  isSm,
  onGroup,
  onSources,
  onSearch,
  onAdd,
}: {
  group: StoryGroup | '';
  sources: StoryKind[];
  q: string;
  /** `counts.by_group` from the story (`all` and the five groups); null until it lands. */
  byGroup: StoryCounts['by_group'] | null;
  /** `counts.by_kind` from the story; null until it lands. */
  byKind: StoryCounts['by_kind'] | null;
  isSm: boolean;
  onGroup: (group: StoryGroup | '') => void;
  onSources: (sources: StoryKind[]) => void;
  onSearch: (q: string) => void;
  onAdd: (what: AddKind) => void;
}) {
  const searchId = useId();
  const [draft, setDraft] = useState(q);
  // The URL's q changed from outside (Clear filters, Back): the box follows.
  const [seenQ, setSeenQ] = useState(q);
  if (seenQ !== q) {
    setSeenQ(q);
    setDraft(q);
  }

  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  useEffect(() => {
    if (draft.trim() === q.trim()) return;
    const timer = window.setTimeout(() => onSearchRef.current(draft.trim()), SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [draft, q]);

  const total = byGroup ? byGroup.all : null;

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Show" className={isSm ? 'flex flex-wrap gap-1.5' : '-mx-4 flex gap-1.5 overflow-x-auto px-4'}>
        {STORY_GROUPS.map((option) => (
          <CountChip
            key={option.key || 'all'}
            label={option.label}
            count={option.key ? (byGroup?.[option.key] ?? null) : total}
            pressed={group === option.key}
            onClick={() => onGroup(option.key)}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            onSearchRef.current(draft.trim());
          }}
          className="relative min-w-0 flex-1 sm:max-w-xs"
        >
          <label htmlFor={searchId} className="sr-only">
            Search the story
          </label>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            id={searchId}
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search the story"
            className={`min-h-11 w-full rounded-lg border border-line bg-surface pl-8 pr-2 text-[15px] text-ink placeholder:text-ink-muted sm:min-h-9 sm:text-[13px] ${FOCUS}`}
          />
        </form>
        <SourcesPicker offered={offeredSources(group, byKind, sources)} selected={sources} onChange={onSources} />
        <Menu
          label="Add to the story"
          trigger={
            <>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add
            </>
          }
          triggerClassName={PRIMARY}
          items={ADD_FLOWS.map((flow) => ({ key: flow.key, label: flow.label, onSelect: () => onAdd(flow.key) }))}
        />
      </div>
    </div>
  );
}
