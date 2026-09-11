import { ACTION_THRESHOLD, RENEWAL_URGENT_DAYS } from '../triage';
import type { TriageSummary } from '../triage';

interface TileProps {
  label: string;
  value: string;
  sub: string;
  /** Left rule colour. Omitted for the neutral tile. */
  tone?: 'danger' | 'warning';
}

function Tile({ label, value, sub, tone }: TileProps) {
  const rule =
    tone === 'danger'
      ? 'border-l-[3px] border-l-danger'
      : tone === 'warning'
        ? 'border-l-[3px] border-l-warning'
        : '';
  const valueTone = tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : 'text-ink';

  return (
    <div className={`bg-surface border border-line-subtle rounded-lg shadow-sm px-[13px] py-[11px] ${rule}`}>
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-faint">{label}</div>
      <div className={`text-[25px] font-semibold leading-tight tracking-tight mt-[3px] tabular-nums ${valueTone}`}>
        {value}
      </div>
      <div className="text-[11px] text-ink-muted mt-[1px]">{sub}</div>
    </div>
  );
}

/**
 * The three figures that decide whether this screen needs you today.
 *
 * Deliberately thin: the point of the Triage view is the ranked queue below,
 * and a row of big hero numbers above it would compete with the thing that
 * actually carries the work.
 */
export function TriageTiles({ summary }: { summary: TriageSummary }) {
  const { needsAction, needsActionRenewingSoon, declining, atGood, total, atGoodPreviousMonth } = summary;

  const goodSub =
    atGoodPreviousMonth === null
      ? 'no prior month recorded'
      : atGoodPreviousMonth === atGood
        ? 'unchanged from last month'
        : atGoodPreviousMonth > atGood
          ? `down from ${atGoodPreviousMonth} last month`
          : `up from ${atGoodPreviousMonth} last month`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Tile
        tone="danger"
        label="Needs action now"
        value={String(needsAction)}
        sub={`risk ≥ ${ACTION_THRESHOLD} · ${needsActionRenewingSoon} renew inside ${RENEWAL_URGENT_DAYS} days`}
      />
      <Tile
        tone="warning"
        label="Declining"
        value={String(declining)}
        sub="worse than three months ago"
      />
      <Tile label="Book at Good" value={`${atGood}/${total}`} sub={goodSub} />
    </div>
  );
}
