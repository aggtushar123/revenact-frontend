import type { TicketKpis } from '../../../../../features/tickets/ticketsSlice';

type Tone = 'gray' | 'green' | 'red' | 'orange';

/** The six cards, in the order the 2x3 grid draws them. Built here
 * rather than server-side because these are labels and formatting, not
 * data — the API returns the six numbers. */
function cards(kpis: TicketKpis | null): { label: string; value: string; subValue?: string; tone: Tone }[] {
  // An em-dash rather than a zero while the first fetch is in flight:
  // "0 tickets" is a claim, "—" is an admission. Same convention as
  // HealthPage's own metrics.
  const n = (v: number | null | undefined, suffix = '') =>
    v === null || v === undefined ? '—' : `${v}${suffix}`;

  return [
    { label: 'Total Ticket Volume', value: n(kpis?.total), tone: 'gray' },
    { label: 'Tickets On Hold', value: n(kpis?.on_hold), tone: 'orange' },
    { label: 'Avg. Ticket Lifetime (Days)', value: n(kpis?.avg_lifetime_days), tone: 'green' },
    { label: 'Ticket Resolution Rate', value: n(kpis?.resolution_rate, '%'), tone: 'green' },
    { label: 'Positive Sentiment Tickets', value: n(kpis?.positive_sentiment), tone: 'green' },
    { label: 'Negative Sentiment Tickets', value: n(kpis?.negative_sentiment), tone: 'red' },
  ];
}

export function KPIGrid({ kpis }: { kpis: TicketKpis | null }) {
  const getTextColor = (colorType?: Tone) => {
    switch (colorType) {
      case 'green': return 'text-success';
      case 'red': return 'text-danger';
      case 'orange': return 'text-warning';
      default: return 'text-ink';
    }
  };

  return (
    <div className="grid grid-cols-2 grid-rows-3 gap-0 min-h-[280px] bg-surface border border-line-subtle shadow-sm rounded-lg overflow-hidden h-full">
      {cards(kpis).map((kpi, idx) => {
        // Add borders to create the internal grid layout
        const borderClasses = `
          ${idx % 2 === 0 ? 'border-r border-line-subtle' : ''}
          ${idx < 4 ? 'border-b border-line-subtle' : ''}
        `;

        return (
          <div key={idx} className={`p-4 flex flex-col justify-center ${borderClasses}`}>
            <div className="flex flex-col gap-0.5 mb-1.5">
              <span className="text-[12px] font-medium text-ink-muted">{kpi.label}</span>
              {kpi.subValue && <span className="text-[10px] text-ink-faint">{kpi.subValue}</span>}
            </div>
            <span className={`text-3xl font-semibold tracking-tight ${getTextColor(kpi.tone)}`}>
              {kpi.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
