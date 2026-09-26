import { describe, expect, it } from 'vitest';

// Spec §1 "House rules" and .claude/skills/revenact-design/SKILL.md §4, as one
// suite each folder points at its own sources (import.meta.glob must be
// written in the test file itself).

// The whole Tailwind colour palette, plus every prefix that can carry a
// colour utility. `-white`/`-black` are checked separately since they take
// no numeric shade.
const PALETTE =
  'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone';
const PREFIXES = 'bg|text|border|fill|stroke|ring|outline|from|via|to|divide|decoration|shadow|accent';
export const RAW = new RegExp(
  `#[0-9a-fA-F]{3,8}\\b|rgba?\\(|\\b(?:${PREFIXES})-(?:${PALETTE})-\\d+\\b|\\b(?:${PREFIXES})-(?:white|black)\\b`,
);

// Only 11/13/15/22 px arbitrary sizes are allowed; every other unit
// (rem/em/%) and every named Tailwind size is a violation.
const PX_SIZE = /text-\[(\d+(?:\.\d+)?)px\]/g;
const NON_PX_SIZE = /text-\[[\d.]+(?:rem|em|%)\]/g;
const NAMED_SIZE = /\btext-(?:xs|sm|base|lg|xl|2xl|3xl)\b/;

export function sizeOffenders(source: string): string[] {
  const offenders: string[] = [];
  for (const match of source.matchAll(PX_SIZE)) {
    if (!['11', '13', '15', '22'].includes(match[1])) offenders.push(match[0]);
  }
  for (const match of source.matchAll(NON_PX_SIZE)) offenders.push(match[0]);
  if (NAMED_SIZE.test(source)) offenders.push('named text size');
  return offenders;
}

/** The house rules over `files` (path → raw source); tests are skipped. */
export function houseRuleSuite(title: string, files: Record<string, string>): void {
  const sources = Object.entries(files).filter(([file]) => !file.includes('.test.'));

  describe(title, () => {
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

    it('keeps glass off (the Ask rail is the only glass surface)', () => {
      expect(sources.filter(([, s]) => /rv-card-glass|rv-glass-inner|backdrop-blur/.test(s)).map(([f]) => f)).toEqual([]);
    });

    it('dims behind sheets with the scrim token, which darkens in both themes', () => {
      expect(sources.filter(([, s]) => /\bbg-ink\/\d+/.test(s)).map(([f]) => f)).toEqual([]);
    });

    it('loads no third-party image (no Clearbit logo, no pravatar avatar)', () => {
      expect(sources.filter(([, s]) => /clearbit|pravatar/i.test(s)).map(([f]) => f)).toEqual([]);
    });
  });
}
