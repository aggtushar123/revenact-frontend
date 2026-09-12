// Chart colours and axis helpers for the AI Trending Topics dashboard, keyed by
// the display names the API returns.
//
// Colour lives here rather than in the payload, the same arrangement the Ticket
// Overview dashboard uses — see its own chartTheme.ts. Only the mock this
// replaced shipped colours alongside its numbers, which gave the backend an
// opinion about the theme.

/** Interaction types — the source donut. Three systems, three hues, none of
 *  them semantic: an email isn't better or worse than a ticket, so these
 *  deliberately avoid success/danger. */
export const SOURCE_COLORS: Record<string, string> = {
  Email: 'var(--info)',
  Call: 'var(--warning)',
  Ticket: 'var(--accent)',
};

/** Sentiment, which *is* semantic. Shared by the donut and the trend line, so
 *  "negative" is the same red in both. */
export const SENTIMENT_COLORS: Record<string, string> = {
  Positive: 'var(--success)',
  Neutral: 'var(--warning)',
  Negative: 'var(--danger)',
};

/** The order the trend line stacks its three series in, and the keys it reads
 *  off each point — lower-cased because that's what the API sends as object
 *  keys, unlike the labels above. */
export const SENTIMENT_SERIES = [
  { key: 'positive', label: 'Positive', color: SENTIMENT_COLORS.Positive },
  { key: 'neutral', label: 'Neutral', color: SENTIMENT_COLORS.Neutral },
  { key: 'negative', label: 'Negative', color: SENTIMENT_COLORS.Negative },
] as const;

/** AI Area. Three areas, so three distinct hues rather than a scale — they are
 *  categories, not degrees of anything. */
export const AREA_COLORS: Record<string, string> = {
  'Product & Growth': 'var(--accent)',
  'Support & Operations': 'var(--warning)',
  'Customer Success': 'var(--info)',
};

/** A neutral for anything the maps above don't recognise — a value added to the
 *  backend's taxonomy before this file catches up should render in grey rather
 *  than vanish. */
export const FALLBACK_COLOR = 'var(--text-tertiary)';

/** Recharts needs a numeric domain to render axis ticks, and a hard-coded
 *  maximum silently clips real data. Same helper the Ticket Overview charts
 *  use; duplicated rather than imported across dashboards on purpose — these
 *  two screens don't otherwise share code, and an import between sibling tabs
 *  is the start of a shared "charts" grab-bag. */
export function niceMax(values: number[], fallback = 10): number {
  const peak = Math.max(0, ...values);
  if (peak <= 0) return fallback;
  const magnitude = 10 ** Math.floor(Math.log10(peak));
  return Math.ceil(peak / magnitude) * magnitude;
}

/** Compact counts, e.g. 2090 → "2.09K".
 *
 * The mock divided by 1000 unconditionally, so 300 rendered as "0.3K" — a
 * longer, less readable way of writing 300. Under a thousand stays plain. */
export function compact(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(2)}K` : String(value);
}

/** A percentage of a total, as a rounded string. Returns "0" for an empty
 *  total rather than "NaN", which is what a donut of nothing used to render. */
export function percentOf(value: number, total: number): string {
  if (!total) return '0';
  return ((value / total) * 100).toFixed(0);
}
