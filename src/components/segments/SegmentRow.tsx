import { Link } from 'react-router-dom';
import { KIND_LABEL } from '../../features/segments/segmentFields';
import type { SegmentListRow } from '../../features/segments/segmentTypes';
import { movesText, OWNER_ONLY } from '../../features/segments/summaryFigures';
import { FOCUS, MONO } from '../organizations/portfolio/styles';
import { SizeSparkline } from './SizeSparkline';

const BADGE = 'shrink-0 rounded-full bg-subtle px-1.5 text-[11px] font-semibold text-ink-muted';
const SHARING_BADGE = { private: null, workspace: 'Workspace', people: 'Shared' } as const;

/** "—" where the figure is the owner's alone (Ruling S8). */
function OwnerOnly() {
  return (
    <span className={`${MONO} text-[13px] text-ink-muted`}>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{OWNER_ONLY}</span>
    </span>
  );
}

/** One segment in the list (spec §3), a rounded row, never a table row:
 *  name with its sharing and paused badges, kind and owner under it, then
 *  the member count, today's change and the 30-day size. Phones wrap the
 *  figures under the name. */
export function SegmentRow({ row }: { row: SegmentListRow }) {
  const badge = SHARING_BADGE[row.sharing];
  return (
    <li data-segment={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-surface px-3 py-2.5">
      <div className="min-w-0 flex-1 basis-56">
        <span className="flex min-w-0 items-center gap-1.5">
          <Link to={`/segments/${row.id}`} className={`flex min-h-11 min-w-0 items-center rounded-sm text-[13px] font-semibold text-ink hover:underline sm:min-h-0 ${FOCUS}`}>
            <span className="truncate">{row.name}</span>
          </Link>
          {badge ? <span className={BADGE}>{badge}</span> : null}
          {row.paused ? <span className={BADGE}>Paused</span> : null}
        </span>
        <p className="truncate text-[11px] text-ink-muted">
          {KIND_LABEL[row.kind]} · {row.is_owner ? 'You' : row.owner.name}
        </p>
      </div>
      <span data-part="count" className="flex w-20 flex-col">
        {row.member_count === null ? <OwnerOnly /> : <span className={`${MONO} text-[13px] text-ink`}>{row.member_count}</span>}
        <span className="text-[11px] text-ink-muted">members</span>
      </span>
      <span data-part="today" className="flex w-20 flex-col">
        {row.today === null ? <OwnerOnly /> : <span className={`${MONO} text-[13px] text-ink`}>{movesText(row.today)}</span>}
        <span className="text-[11px] text-ink-muted">today</span>
      </span>
      <span data-part="sparkline" className="flex w-16 items-center">
        {row.sparkline === null ? <OwnerOnly /> : <SizeSparkline sizes={row.sparkline} />}
      </span>
    </li>
  );
}
