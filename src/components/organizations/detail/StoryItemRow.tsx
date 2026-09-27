import { useId, useLayoutEffect, useRef, useState } from 'react';
import {
  Activity,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  HeartPulse,
  LifeBuoy,
  Mail,
  Phone,
  SquareCheck,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';
import { KIND_NAME, sourceName } from '../../../features/organizations/storyKinds';
import { timeLabel } from '../../../features/organizations/storyDays';
import type { StoryItem, StoryKind } from '../../../features/organizations/storyTypes';
import { FOCUS } from '../portfolio/styles';

const ICON: Record<StoryKind, LucideIcon> = {
  activity: Activity,
  call: Phone,
  email: Mail,
  calendar_event: CalendarDays,
  ticket: LifeBuoy,
  task: SquareCheck,
  note: StickyNote,
  survey: ClipboardList,
  health: HeartPulse,
};

const LINK = `mt-1 inline-flex min-h-11 items-center gap-1 rounded-sm text-[13px] font-semibold text-ink underline sm:min-h-0 ${FOCUS}`;

/** `link.url`: a ticket in its source system or a call's recording, in a new
 *  tab. The backend sends only http(s) URLs; the check stays because the
 *  value lands in an href. The backend sends no in-app paths. */
function ItemLink({ item }: { item: StoryItem }) {
  const url = item.link.url ?? '';
  if (!/^https?:\/\//i.test(url)) return null;
  const name = sourceName(item.source);
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={LINK}>
      {item.kind === 'call' && !name ? 'Open the recording' : `Open in ${name || 'its source'}`}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

/** One story item (spec §1.6): icon, title, time, a one-line summary, then
 *  the account tag and kind · who · source. An email with a thread opens it;
 *  any other item with more to show opens in place. */
export function StoryItemRow({ item, onOpenEmail }: { item: StoryItem; onOpenEmail: (item: StoryItem) => void }) {
  const [expanded, setExpanded] = useState(false);
  const detailId = useId();
  const Icon = ICON[item.kind] ?? Activity;
  const time = timeLabel(item);
  const threaded = item.kind === 'email' && Boolean(item.link.thread_id);
  // Opening in place shows the whole summary and the link, so it is offered
  // only when there is more than the row already shows: a link, a summary of
  // several lines, or one cut off at the row's width (measured, and again
  // when the row resizes).
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const [clipped, setClipped] = useState(false);
  useLayoutEffect(() => {
    const line = summaryRef.current;
    if (!line) return;
    const measure = () => setClipped(line.scrollWidth > line.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(line);
    return () => observer.disconnect();
  }, [item.summary, expanded]);
  const linked = /^https?:\/\//i.test(item.link.url ?? '');
  const expandable = !threaded && (linked || item.summary.includes('\n') || clipped);
  const source = sourceName(item.source);
  const meta = [KIND_NAME[item.kind] ?? 'Record', item.actor?.name, source ? `via ${source}` : null]
    .filter(Boolean)
    .join(' · ');
  // A 44px target below sm (the line height centres the title in it).
  const titleButton = `inline-block min-h-11 max-w-full truncate rounded-sm text-left leading-[2.75rem] hover:underline active:opacity-70 sm:min-h-0 sm:leading-normal ${FOCUS}`;

  return (
    <li data-story-item={`${item.kind}:${item.id}`} className="flex gap-3 px-3 py-2.5">
      <span aria-hidden="true" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-subtle text-ink-muted">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
            {threaded ? (
              <button type="button" aria-haspopup="dialog" onClick={() => onOpenEmail(item)} className={titleButton}>
                {item.title}
              </button>
            ) : expandable ? (
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={expanded ? detailId : undefined}
                onClick={() => setExpanded((value) => !value)}
                className={titleButton}
              >
                {item.title}
              </button>
            ) : (
              item.title
            )}
          </h3>
          {time ? (
            <time dateTime={item.occurred_at} className="shrink-0 font-mono-brand text-[11px] tabular-nums text-ink-muted">
              {time}
            </time>
          ) : null}
        </div>
        {expanded ? (
          <div id={detailId}>
            {item.summary ? <p className="whitespace-pre-line break-words text-[13px] text-ink-muted">{item.summary}</p> : null}
            <ItemLink item={item} />
          </div>
        ) : item.summary ? (
          <p ref={summaryRef} className="truncate text-[13px] text-ink-muted">
            {item.summary}
          </p>
        ) : null}
        <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
          <span className="inline-block min-w-0 max-w-[10rem] truncate rounded-full bg-subtle px-2 py-0.5 text-ink">
            {item.account?.name ?? 'Organization'}
          </span>
          <span className="min-w-0 truncate">{meta}</span>
        </p>
      </div>
    </li>
  );
}
