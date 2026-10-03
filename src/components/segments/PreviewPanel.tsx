import { useId } from 'react';
import { KIND_NOUN } from '../../features/segments/segmentFields';
import type { SegmentKind } from '../../features/segments/segmentTypes';
import { summaryFigures } from '../../features/segments/summaryFigures';
import { ItemSkeleton } from '../organizations/portfolio/PortfolioSections';
import { MONO } from '../organizations/portfolio/styles';
import type { PreviewState } from './usePreview';

/** Beside the rules (stacked on phones): "41 organisations match", the
 *  first ten, and the totals (spec §3). */
export function PreviewPanel({ kind, state }: { kind: SegmentKind; state: PreviewState }) {
  const headingId = useId();
  const noun = KIND_NOUN[kind];
  const data = state.status === 'ready' ? state.data : state.status === 'loading' ? state.last : null;
  let body;
  if (state.status === 'incomplete') {
    body = <p className="text-[13px] text-ink-muted">Finish each condition to see who matches.</p>;
  } else if (state.status === 'error') {
    body = <p className="text-[13px] text-ink-muted">Fix the rules to see who matches.</p>;
  } else if (!data) {
    body = <ItemSkeleton count={3} label="Loading preview" avatar={false} />;
  } else {
    body = (
      <div className={`flex flex-col gap-2 ${state.status === 'loading' ? 'opacity-60' : ''}`}>
        <p data-part="match-count" className="text-[15px] font-semibold text-ink">
          <span className={MONO}>{data.count}</span> {data.count === 1 ? noun.one : noun.many} match
        </p>
        {data.results.length > 0 ? (
          <ul aria-label="First matches" className="flex flex-col divide-y divide-line-subtle">
            {data.results.map((row) => (
              <li key={row.id} className="flex items-baseline justify-between gap-2 py-1.5">
                <span className="truncate text-[13px] text-ink">{row.name}</span>
                <span className="shrink-0 truncate text-[11px] text-ink-muted">
                  {'role' in row ? `${row.role} · ${row.parent.name}` : (row.owner?.name ?? 'Unassigned')}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {data.count > data.results.length ? (
          <p className="text-[11px] text-ink-muted">
            and <span className={MONO}>{data.count - data.results.length}</span> more
          </p>
        ) : null}
        <dl className="grid grid-cols-2 gap-2 border-t border-line-subtle pt-2">
          {summaryFigures(data.summary, kind).map((figure) => (
            <div key={figure.key}>
              <dt className="text-[11px] text-ink-muted">{figure.label}</dt>
              <dd className={`${MONO} text-[13px] text-ink`}>{figure.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }
  return (
    <section aria-labelledby={headingId} aria-busy={state.status === 'loading'} className="flex min-w-0 flex-col gap-3 rounded-xl bg-surface p-3">
      <h2 id={headingId} className="text-[15px] font-semibold text-ink">
        Preview
      </h2>
      {body}
    </section>
  );
}
