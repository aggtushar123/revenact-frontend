// Colours and helpers for the Usage Overview dashboard, keyed by band.
//
// Colour lives here rather than in the payload, the same arrangement the other
// dashboards use — the backend returns names and numbers and has no opinion
// about the theme.

/**
 * The utilisation bands, coloured by what they mean commercially rather than
 * by position on a scale: red is money going to waste, green is money working,
 * and blue is the top end — an account out of room is *good* news with an
 * action attached, and colouring it like a problem would bury the expansion
 * list at the bottom of the screen.
 */
export const BAND_COLORS: Record<string, string> = {
  dormant: 'var(--danger)',
  low: 'var(--warning)',
  fair: 'var(--warning)',
  healthy: 'var(--success)',
  at_capacity: 'var(--info)',
  over: 'var(--accent)',
};

/** Short axis labels. The API's own names carry their range ("Dormant
 *  (<25%)"), which is right in a legend and too long under a bar. */
export const BAND_SHORT: Record<string, string> = {
  dormant: 'Dormant',
  low: 'Low',
  fair: 'Fair',
  healthy: 'Healthy',
  at_capacity: 'At capacity',
  over: 'Over',
};

export const FALLBACK_COLOR = 'var(--text-tertiary)';

/** Recharts needs a numeric domain, and a hard-coded maximum silently clips
 *  real data. Rounds up to a clean boundary above the data. */
export function niceMax(values: number[], fallback = 10): number {
  const peak = Math.max(0, ...values);
  if (peak <= 0) return fallback;
  const magnitude = 10 ** Math.floor(Math.log10(peak));
  return Math.ceil(peak / magnitude) * magnitude;
}
