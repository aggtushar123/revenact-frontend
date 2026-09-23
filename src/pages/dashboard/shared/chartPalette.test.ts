import { describe, it, expect } from 'vitest';
import * as ai from '../tabs/ai-trending/chartTheme';
import * as tickets from '../tabs/ticket-overview/chartTheme';
import * as usage from '../tabs/usage-overview/chartTheme';
import { niceMax, compact, percentOf, ticksTo } from './chartPalette';

const HEX = /#[0-9a-f]{3,8}\b|rgb\(/i;

describe('chart colours', () => {
  it('are tokens only', () => {
    for (const mod of [ai, tickets, usage]) {
      for (const value of Object.values(mod)) {
        if (value && typeof value === 'object') {
          expect(JSON.stringify(value)).not.toMatch(HEX);
        }
      }
    }
  });

  it('keep semantic colours for meaning only', () => {
    expect(ai.SOURCE_COLORS.Email).not.toMatch(/danger|success/);
    expect(ai.SENTIMENT_COLORS.Negative).toBe('var(--danger)');
    expect(tickets.PRIORITY_COLORS.Critical).toBe('var(--danger)');
  });

  // AssigneesStackedBar stacks all five statuses in one bar with no room for
  // a colour that repeats; UsageScatter plots six bands as bare dots with no
  // shape/pattern to fall back on. Both charts also carry a legend now (see
  // AssigneesStackedBar.test.tsx / UsageScatter.test.tsx), but the legend
  // only works if the colours it's keying off are actually distinct.
  it('no two ticket statuses share a colour', () => {
    const values = Object.values(tickets.STATUS_COLORS);
    expect(new Set(values).size).toBe(values.length);
    expect(tickets.STATUS_COLORS['On Hold']).not.toBe(tickets.STATUS_COLORS.Closed);
  });

  it('no two usage bands share a colour', () => {
    const values = Object.values(usage.BAND_COLORS);
    expect(new Set(values).size).toBe(values.length);
    expect(usage.BAND_COLORS.at_capacity).not.toBe(usage.BAND_COLORS.over);
  });
});

describe('helpers', () => {
  it('niceMax rounds up to a clean boundary', () => expect(niceMax([0, 37])).toBe(40));
  it('compact leaves small numbers plain', () => expect(compact(300)).toBe('300'));
  it('percentOf handles an empty total', () => expect(percentOf(1, 0)).toBe('0'));
  it('ticksTo spaces evenly', () => expect(ticksTo(40)).toEqual([0, 10, 20, 30, 40]));
});

// The three checks above only look at the three tab-local `chartTheme.ts`
// modules. Everything else that draws a chart — the `charts/*.tsx` files
// that call `fill`/`stroke`/`contentStyle` directly, and the Health tab's
// own page — is just as capable of smuggling a literal colour back in, and
// none of it is re-exported anywhere a targeted import would catch. This
// scans every non-test source file under both trees for the same pattern, so
// a regression in any chart file (not just the palette modules) fails here
// instead of at design review.
describe('tokens only, everywhere', () => {
  it('no dashboard or health source file has a raw hex or rgb()/rgba() colour', () => {
    const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;

    const modules = {
      ...import.meta.glob('../**/*.ts', { query: '?raw', eager: true, import: 'default' }),
      ...import.meta.glob('../**/*.tsx', { query: '?raw', eager: true, import: 'default' }),
      ...import.meta.glob('../../health/**/*.ts', {
        query: '?raw',
        eager: true,
        import: 'default',
      }),
      ...import.meta.glob('../../health/**/*.tsx', {
        query: '?raw',
        eager: true,
        import: 'default',
      }),
    } as Record<string, string>;

    const offenders = Object.entries(modules)
      .filter(([file]) => !file.includes('.test.'))
      .filter(([, source]) => RAW_COLOR.test(source))
      .map(([file]) => file);

    expect(offenders).toEqual([]);
  });
});
