import { useId } from 'react';
import { dayLabel, groupByDay, localDay } from '../../../features/organizations/storyDays';
import type { StoryItem } from '../../../features/organizations/storyTypes';
import { EmptyState, ErrorBlock, MoreButton } from '../portfolio/PortfolioSections';
import { useEndSentinel } from '../portfolio/useEndSentinel';
import { QUIET } from '../portfolio/styles';
import { StoryItemRow } from './StoryItemRow';
import type { StoryState } from './useStory';

function Skeleton() {
  return (
    <div role="status" aria-label="Loading the story">
      <ul aria-hidden="true" className="divide-y divide-line-subtle rounded-xl bg-surface">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex gap-3 px-3 py-2.5">
            <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-subtle" />
            <span className="flex flex-1 flex-col gap-1.5">
              <span className="block h-3 w-48 animate-pulse rounded bg-subtle" />
              <span className="block h-2.5 w-full animate-pulse rounded bg-subtle" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Day({ label, items, onOpenEmail }: { label: string; items: StoryItem[]; onOpenEmail: (item: StoryItem) => void }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </h2>
      <ul className="divide-y divide-line-subtle rounded-xl bg-surface">
        {items.map((item) => (
          <StoryItemRow key={`${item.kind}:${item.id}`} item={item} onOpenEmail={onOpenEmail} />
        ))}
      </ul>
    </section>
  );
}

/** The stream (spec §1.6): a clean list grouped by day, newest first, in the
 *  Communications inbox's manner. The next page loads when the end scrolls
 *  into view, with Show more as the fallback. */
export function StoryStream({
  story,
  filtered,
  today = localDay(new Date()),
  onClearFilters,
  onOpenEmail,
}: {
  story: StoryState;
  /** Any account, filter, source or search is set (the empty state offers Clear filters). */
  filtered: boolean;
  today?: string;
  onClearFilters: () => void;
  onOpenEmail: (item: StoryItem) => void;
}) {
  const sentinel = useEndSentinel(() => void story.loadMore(), Boolean(story.next) && !story.loadingMore && !story.moreError);

  if (story.error) return <ErrorBlock message={story.error} onRetry={story.retry} />;
  if (!story.data) return <Skeleton />;
  if (story.items.length === 0) {
    return filtered ? (
      <EmptyState
        title="Nothing matches these filters"
        detail="Try another account, filter or search."
        action={
          <button type="button" onClick={onClearFilters} className={`${QUIET} border border-line`}>
            Clear filters
          </button>
        }
      />
    ) : (
      <EmptyState title="Nothing here yet" detail="Calls, emails, tickets, tasks and notes appear here as they happen." action={null} />
    );
  }

  return (
    <div aria-busy={story.loading} className="flex flex-col gap-3">
      {groupByDay(story.items).map((day) => (
        <Day key={day.key} label={dayLabel(day.key, today)} items={day.items} onOpenEmail={onOpenEmail} />
      ))}
      <div ref={sentinel} data-sentinel="" aria-hidden="true" className="h-px" />
      <MoreButton next={story.next} loading={story.loadingMore} error={story.moreError} label="Show more" onClick={() => void story.loadMore()} />
    </div>
  );
}
