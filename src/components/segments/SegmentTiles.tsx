import type { SegmentKind, SegmentSummary } from '../../features/segments/segmentTypes';
import { summaryFigures } from '../../features/segments/summaryFigures';
import { MONO } from '../organizations/portfolio/styles';
import { Tile, TilesSkeleton } from '../organizations/portfolio/tileParts';

/** The tiles (spec §3) over every member the reader may open; a search on
 *  the Members tab narrows the rows, never these. Phones swipe the strip
 *  sideways inside itself; the page never scrolls sideways. */
export function SegmentTiles({ summary, kind, failed }: { summary: SegmentSummary | null; kind: SegmentKind; failed: boolean }) {
  if (failed) {
    return (
      <p role="alert" className="text-[13px] text-danger">
        Could not load the totals.
      </p>
    );
  }
  if (!summary) return <TilesSkeleton count={kind === 'contact' ? 2 : 5} />;
  return (
    <div className="flex snap-x gap-2 overflow-x-auto [&>*]:flex-1">
      {summaryFigures(summary, kind).map((figure) => (
        <Tile key={figure.key} title={figure.label}>
          <p className={`${MONO} text-[22px] font-semibold text-ink`}>{figure.value}</p>
          {figure.detail ? <p className="text-[11px] text-ink-muted">{figure.detail}</p> : null}
        </Tile>
      ))}
    </div>
  );
}
