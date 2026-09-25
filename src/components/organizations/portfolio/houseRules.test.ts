import { describe, expect, it } from 'vitest';

// Spec §1 "House rules", enforced over every portfolio component so a
// regression fails here rather than at design review.
const sources = Object.entries(
  import.meta.glob('./**/*.tsx', { query: '?raw', eager: true, import: 'default' }) as Record<string, string>,
).filter(([file]) => !file.includes('.test.'));

describe('portfolio house rules', () => {
  it('has sources to check', () => expect(sources.length).toBeGreaterThan(0));

  it('uses tokens only: no hex, rgb() or named palette colours', () => {
    const RAW = /#[0-9a-fA-F]{3,8}\b|rgba?\(|\b(?:bg|text|border|fill|stroke)-(?:red|blue|green|amber|emerald|rose|purple|gray|slate|zinc|neutral)-\d/;
    expect(sources.filter(([, s]) => RAW.test(s)).map(([f]) => f)).toEqual([]);
  });

  it('uses only the 11/13/15/22 px type sizes', () => {
    const offenders: string[] = [];
    for (const [file, source] of sources) {
      for (const match of source.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)) {
        if (!['11', '13', '15', '22'].includes(match[1])) offenders.push(`${file}: ${match[0]}`);
      }
      if (/\btext-(?:xs|sm|base|lg|xl|2xl|3xl)\b/.test(source)) offenders.push(`${file}: named text size`);
    }
    expect(offenders).toEqual([]);
  });

  it('keeps glass off the list (the Ask rail is the only glass surface)', () => {
    expect(sources.filter(([, s]) => /rv-card-glass|rv-glass-inner|backdrop-blur/.test(s)).map(([f]) => f)).toEqual([]);
  });
});
