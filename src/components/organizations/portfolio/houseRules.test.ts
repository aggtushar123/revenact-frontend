import { describe, expect, it } from 'vitest';

// Spec §1 "House rules", enforced over every portfolio component so a
// regression fails here rather than at design review.
const sources = Object.entries(
  import.meta.glob('./**/*.tsx', { query: '?raw', eager: true, import: 'default' }) as Record<string, string>,
).filter(([file]) => !file.includes('.test.'));

// The whole Tailwind colour palette, plus every prefix that can carry a
// colour utility. `-white`/`-black` are checked separately since they take
// no numeric shade.
const PALETTE =
  'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone';
const PREFIXES = 'bg|text|border|fill|stroke|ring|outline|from|via|to|divide|decoration|shadow|accent';
const RAW = new RegExp(
  `#[0-9a-fA-F]{3,8}\\b|rgba?\\(|\\b(?:${PREFIXES})-(?:${PALETTE})-\\d+\\b|\\b(?:${PREFIXES})-(?:white|black)\\b`,
);

// Only 11/13/15/22 px arbitrary sizes are allowed; every other unit
// (rem/em/%) and every named Tailwind size is a violation.
const PX_SIZE = /text-\[(\d+(?:\.\d+)?)px\]/g;
const NON_PX_SIZE = /text-\[[\d.]+(?:rem|em|%)\]/;
const NAMED_SIZE = /\btext-(?:xs|sm|base|lg|xl|2xl|3xl)\b/;

function sizeOffenders(source: string): string[] {
  const offenders: string[] = [];
  for (const match of source.matchAll(PX_SIZE)) {
    if (!['11', '13', '15', '22'].includes(match[1])) offenders.push(match[0]);
  }
  for (const match of source.matchAll(new RegExp(NON_PX_SIZE, 'g'))) {
    offenders.push(match[0]);
  }
  if (NAMED_SIZE.test(source)) offenders.push('named text size');
  return offenders;
}

describe('portfolio house rules', () => {
  it('has sources to check', () => expect(sources.length).toBeGreaterThan(0));

  it('uses tokens only: no hex, rgb() or named palette colours', () => {
    expect(sources.filter(([, s]) => RAW.test(s)).map(([f]) => f)).toEqual([]);
  });

  it('uses only the 11/13/15/22 px type sizes', () => {
    const offenders: string[] = [];
    for (const [file, source] of sources) {
      for (const bad of sizeOffenders(source)) offenders.push(`${file}: ${bad}`);
    }
    expect(offenders).toEqual([]);
  });

  it('keeps glass off the list (the Ask rail is the only glass surface)', () => {
    expect(sources.filter(([, s]) => /rv-card-glass|rv-glass-inner|backdrop-blur/.test(s)).map(([f]) => f)).toEqual([]);
  });

  it('self-check: the scanners flag real offenders and leave tokens alone', () => {
    expect(RAW.test('bg-orange-500')).toBe(true);
    expect(RAW.test('text-pink-600')).toBe(true);
    expect(RAW.test('bg-white')).toBe(true);
    expect(RAW.test('border-black')).toBe(true);
    expect(RAW.test('#fff')).toBe(true);
    expect(RAW.test('rgba(0,0,0,.5)')).toBe(true);
    expect(RAW.test('bg-surface')).toBe(false);
    expect(RAW.test('text-ink-muted')).toBe(false);
    expect(RAW.test('bg-danger-dim')).toBe(false);

    expect(sizeOffenders('text-[0.8rem]')).toEqual(['text-[0.8rem]']);
    expect(sizeOffenders('text-[10px]')).toEqual(['text-[10px]']);
    expect(sizeOffenders('text-[13px]')).toEqual([]);
    expect(sizeOffenders('text-sm')).toEqual(['named text size']);
    expect(sizeOffenders('text-[11px] text-ink')).toEqual([]);
  });
});
