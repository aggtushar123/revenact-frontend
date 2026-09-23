import type { TicketKpis } from '../../../../../features/tickets/ticketsSlice';
import { Kpi, KpiStrip } from '../../../shared/Kpi';

/** An em-dash rather than a zero while the first fetch is in flight: "0
 * tickets" is a claim, "—" is an admission. Same convention as HealthPage's
 * own metrics. */
const n = (v: number | null | undefined, suffix = '') =>
  v === null || v === undefined ? '—' : `${v}${suffix}`;

/**
 * The six ticket-overview figures, on the shared `Kpi`/`KpiStrip`.
 *
 * Colour used to follow a `gray | green | red | orange` scheme that tracked
 * nothing real — On Hold in amber, an average lifetime and a resolution
 * rate in green — so every glance implied a caution or a win that wasn't
 * one. A negative-sentiment count is the one figure here that is
 * unambiguously a loss; everything else is a plain count or rate.
 */
export function KPIGrid({ kpis }: { kpis: TicketKpis | null }) {
  return (
    <KpiStrip columns={3}>
      <Kpi label="Total Ticket Volume" value={n(kpis?.total)} />
      <Kpi label="Tickets On Hold" value={n(kpis?.on_hold)} />
      <Kpi label="Avg. Ticket Lifetime (Days)" value={n(kpis?.avg_lifetime_days)} />
      <Kpi label="Ticket Resolution Rate" value={n(kpis?.resolution_rate, '%')} />
      <Kpi label="Positive Sentiment Tickets" value={n(kpis?.positive_sentiment)} />
      <Kpi label="Negative Sentiment Tickets" value={n(kpis?.negative_sentiment)} tone="loss" />
    </KpiStrip>
  );
}
