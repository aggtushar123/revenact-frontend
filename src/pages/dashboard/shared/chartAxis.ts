// Axis furniture every dashboard chart shares: titles, tick style, margins
// and tick formatters. A plain `.ts` file (the truncating tick uses
// `createElement`) so it can sit beside `chartPalette.ts` as data, not UI.
//
// Axis-title recipe. A title goes *outside* its axis's tick band, in margin
// the chart reserves for it, so it can never sit on the tick numbers:
//
//   <BarChart margin={chartMargin({ left: true, x: true })}>
//     <XAxis {...AXIS_BASE} dataKey="month" label={axisLabel('Month', 'x')} />
//     <YAxis {...AXIS_BASE} width={38} label={axisLabel('Accounts')} />
//
// `axisLabel` uses Recharts' outside positions (`left` / `right` / `bottom`),
// which place the label relative to the axis's own box, beyond its outer
// edge (the y titles' centre 10px out, the x title's top 4px down). `chartMargin` widens the same side by
// `TITLE_ROOM`, which holds that offset plus one 11px line. The `inside*`
// positions are anchored inside the tick band and overlap the ticks on a
// narrow axis, so they are not used. Keep the axis `width` to what the ticks
// need; the title does not share it.

import { createElement } from 'react';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import { formatCompactMoney } from '../../../features/customers/formatters';

export type AxisSide = 'x' | 'left' | 'right';

/** Distance from an axis's outer edge to its title: to the centre of a
 *  rotated y title, to the top of the x title. */
const TITLE_OFFSET = { x: 4, y: 10 } as const;

/** An axis title, for `<XAxis label={axisLabel('Month', 'x')}>` or
 *  `<YAxis label={axisLabel('Accounts')}>`. Always pair it with
 *  `chartMargin` for the same side, which reserves the room it lands in
 *  (see the recipe at the top of this file). */
export function axisLabel(value: string, side: AxisSide = 'left') {
  return {
    value,
    position: side === 'x' ? 'bottom' : side,
    angle: side === 'x' ? 0 : side === 'left' ? -90 : 90,
    offset: side === 'x' ? TITLE_OFFSET.x : TITLE_OFFSET.y,
    fill: 'var(--text-secondary)',
    fontSize: 11,
    textAnchor: 'middle',
  } as const;
}

/** Tick text: 10px is the floor, never 9. */
export const AXIS_TICK = { fill: 'var(--text-tertiary)', fontSize: 10 } as const;

/** Spread onto any axis: `<XAxis {...AXIS_BASE} dataKey="month" />`. */
export const AXIS_BASE = { axisLine: false, tickLine: false, tick: AXIS_TICK } as const;

/** No negative sides: a negative left margin is how tick labels got clipped. */
export const CHART_MARGIN = { top: 16, right: 16, bottom: 8, left: 8 } as const;

/** Room an axis title takes beside its axis: its offset plus one 11px line
 *  (a y title is rotated, so its line height is its width). */
const TITLE_ROOM = 20;

/** `CHART_MARGIN`, widened on each side that carries an `axisLabel`. */
export function chartMargin(titles: { x?: boolean; left?: boolean; right?: boolean } = {}) {
  return {
    top: CHART_MARGIN.top,
    right: CHART_MARGIN.right + (titles.right ? TITLE_ROOM : 0),
    bottom: CHART_MARGIN.bottom + (titles.x ? TITLE_ROOM : 0),
    left: CHART_MARGIN.left + (titles.left ? TITLE_ROOM : 0),
  };
}

/** Money ticks in the app's one compact format ("$1.8M"). */
export const moneyTick = (currency: CurrencyCode) => (value: number) => formatCompactMoney(value, currency);

export const pctTick = (value: number) => `${value}%`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09-01" → "1 Sep", "2026-09" → "Sep '26". Read from the string, not a
 *  `Date`, so a UTC midnight never shifts a day in the viewer's timezone.
 *  Anything else is returned unchanged. */
export function dateTick(iso: string): string {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(iso);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  if (!match || !month) return iso;
  return match[3] ? `${Number(match[3])} ${month}` : `${month} '${match[1].slice(2)}`;
}

/** Cuts `text` to `max` characters, the last being an ellipsis. */
export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

interface TickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value?: unknown };
  textAnchor?: string;
}

/** A category tick that shortens long names and keeps the full one in a
 *  `<title>` (the hover tooltip): `<YAxis type="category" tick={truncTick(18)} />`.
 *  Pass an `angle` (e.g. -35) to slant crowded x-axis names:
 *  `<XAxis tick={truncTick(14, -35)} interval={0} height={64} />`; a slanted
 *  name rotates about its tick and ends there, hanging below the axis. */
export function truncTick(max = 14, angle = 0) {
  return function TruncatedTick({ x = 0, y = 0, payload, textAnchor = 'end' }: TickProps) {
    const full = String(payload?.value ?? '');
    const short = truncate(full, max);
    const slanted = angle !== 0;
    return createElement(
      'text',
      {
        x,
        y,
        dy: slanted ? '0.71em' : '0.355em',
        textAnchor: slanted ? 'end' : textAnchor,
        transform: slanted ? `rotate(${angle}, ${x}, ${y})` : undefined,
        fill: AXIS_TICK.fill,
        fontSize: AXIS_TICK.fontSize,
      },
      short !== full ? createElement('title', null, full) : null,
      short,
    );
  };
}
