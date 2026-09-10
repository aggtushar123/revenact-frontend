// Chart colours for the Ticket Overview dashboard, keyed by the
// display names the API returns.
//
// Colour lives here rather than in the payload because that is what
// every other real-data chart in this app already does — see
// SurveyTrendChart's own LINES and HealthPage's category map. Only the
// mock this replaced shipped `fill` alongside its numbers, which meant
// the backend had an opinion about the theme.
//
// Both maps are keyed by label, not by the raw enum value, because
// that's what the charts stack, legend and tooltip by.

/** Ticket.Status display labels. Shared by the status donut and the
 * assignee breakdown, which stack the same five states — a second copy
 * would drift the moment one of them changed. */
export const STATUS_COLORS: Record<string, string> = {
  Open: 'var(--warning)',
  'In Progress': 'var(--info)',
  'On Hold': 'var(--text-tertiary)',
  Resolved: 'var(--success)',
  Closed: 'var(--accent)',
};

/** The order the assignee chart stacks its segments in — roughly the
 * life of a ticket, so a bar reads left to right as work progressing. */
export const STATUS_ORDER = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'];

/** Ticket.Priority display labels, low to critical.
 *
 * Critical is a literal rather than a token because there isn't one
 * for it — the palette stops at `--danger`, and Critical needs to be
 * distinguishable from High rather than the same red twice. Carried
 * over from the mock, which had the same literal for the same reason.
 * Worth promoting to a real token next time index.css is touched;
 * that file currently has a large in-flight theme migration in it, and
 * adding a line there would have meant committing someone else's
 * unfinished work alongside this. */
export const PRIORITY_COLORS: Record<string, string> = {
  Low: 'var(--success)',
  Medium: 'var(--warning)',
  High: 'var(--danger)',
  Critical: '#8B2E2E',
};

/** A neutral for anything the maps don't recognise — a status or
 * priority added to the backend before this file catches up should
 * render in grey rather than vanish. */
export const FALLBACK_COLOR = 'var(--text-tertiary)';

/** Recharts needs a fixed numeric domain to render axis ticks, but a
 * hard-coded maximum silently clips real data — which is exactly what
 * the mock's `domain={[0, 400]}` did. This rounds up to a clean
 * boundary above the data, so the axis stays readable and nothing is
 * cut off. */
export function niceMax(values: number[], fallback = 10): number {
  const peak = Math.max(0, ...values);
  if (peak <= 0) return fallback;
  const magnitude = 10 ** Math.floor(Math.log10(peak));
  return Math.ceil(peak / magnitude) * magnitude;
}

/** Evenly spaced ticks from 0 to `max`, for the axes that render them. */
export function ticksTo(max: number, count = 4): number[] {
  const step = max / count;
  return Array.from({ length: count + 1 }, (_, i) => Math.round(step * i));
}
