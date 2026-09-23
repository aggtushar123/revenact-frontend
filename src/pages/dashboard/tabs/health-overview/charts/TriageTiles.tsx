import { ACTION_THRESHOLD, RENEWAL_URGENT_DAYS } from '../triage';
import type { TriageSummary } from '../triage';
import { Kpi, KpiStrip } from '../../../shared/Kpi';

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
    <KpiStrip columns={3}>
      <Kpi
        label="Needs action now"
        value={String(needsAction)}
        detail={`risk ≥ ${ACTION_THRESHOLD} · ${needsActionRenewingSoon} renew inside ${RENEWAL_URGENT_DAYS} days`}
      />
      <Kpi label="Declining" value={String(declining)} detail="worse than three months ago" />
      <Kpi label="Book at Good" value={`${atGood}/${total}`} detail={goodSub} />
    </KpiStrip>
  );
}
