import { describe, expect, it } from 'vitest';
import { LUKAS, MIRA } from './testContacts';
import {
  callsLabel,
  classificationLabel,
  contactsSummaryParts,
  dayLabel,
  dayMonth,
  placeLabel,
  placeOf,
  readingOf,
  safeUrl,
  sentimentWhy,
} from './contactsFormat';

// The readable shape (revenact-backend PR fix/contacts-readable-evidence):
// counted only over the viewer's readable analysed records.
const READABLE = { calls: 6, emails: 2, tickets: 0, positive: 3, neutral: 2, negative: 1, latest_at: '2026-09-12T10:00:00Z', others: false };
// The old shape, kept only to prove callsLabel's fallback.
const OLD_EVIDENCE = { score: 0.1, calls: 4, emails: 2, tickets: 0, positive: 2, neutral: 1, negative: 1, latest_at: '2026-09-01T00:00:00Z' };

describe('contactsFormat (spec 2026-09-28 §3, §5)', () => {
  it('words the summary line', () => {
    expect(contactsSummaryParts({ total: 142, positive: 87, neutral: 43, negative: 12, decision_makers: 38 })).toEqual([
      { value: '142', label: 'people' },
      { value: '38', label: 'decision makers' },
      { value: '61%', label: 'positive' },
      { value: '12', label: 'negative' },
    ]);
    expect(contactsSummaryParts({ total: 1, positive: 0, neutral: 1, negative: 0, decision_makers: 1 }).map((p) => p.label)).toEqual([
      'person',
      'decision maker',
      'positive',
      'negative',
    ]);
    expect(contactsSummaryParts({ total: 0, positive: 0, neutral: 0, negative: 0, decision_makers: 0 })[2].value).toBe('0%');
  });

  it('adds how many are active and the 30-day growth when the summary carries them', () => {
    const base = { total: 142, positive: 87, neutral: 43, negative: 12, decision_makers: 38 };
    const text = (parts: { value: string; label: string }[]) => parts.map((p) => `${p.value} ${p.label}`).join(' · ');
    expect(text(contactsSummaryParts({ ...base, active: 120, growth_30d_pct: 12.5 }))).toBe(
      '142 people · 38 decision makers · 120 active · 61% positive · 12 negative · +12.5% growth (30d)',
    );
    expect(text(contactsSummaryParts({ ...base, active: 120, growth_30d_pct: -3 }))).toContain('-3% growth (30d)');
    expect(text(contactsSummaryParts({ ...base, active: 120, growth_30d_pct: 0 }))).toContain('0% growth (30d)');
    // No contacts 30 days ago: growth is undefined, not zero.
    expect(text(contactsSummaryParts({ ...base, active: 120, growth_30d_pct: null }))).not.toContain('growth');
    expect(text(contactsSummaryParts(base))).toBe('142 people · 38 decision makers · 61% positive · 12 negative');
  });

  it('reads a record: its sentiment, "Not enough to analyse", or nothing while pending', () => {
    expect(readingOf({ analysis: 'analysed', sentiment: 'negative' })).toEqual({ label: 'Negative', tone: 'bg-danger-dim text-danger' });
    expect(readingOf({ analysis: 'not_analysable', sentiment: null })).toEqual({
      label: 'Not enough to analyse',
      tone: 'bg-subtle text-ink-muted',
    });
    // The org page's calls still carry the model's default `neutral` while
    // pending: it is not a reading.
    expect(readingOf({ analysis: 'pending', sentiment: 'neutral' })).toBeNull();
    expect(readingOf({ sentiment: 'positive' })?.label).toBe('Positive');
    expect(readingOf({ sentiment: '' })).toBeNull();
  });

  it('dates in UTC', () => {
    expect(dayMonth('2026-09-12T23:30:00Z')).toBe('12 Sep');
    expect(dayLabel('2026-01-02T00:00:00Z')).toBe('2 Jan 2026');
  });

  it('says why a person reads as they do', () => {
    expect(sentimentWhy('neutral', 'computed', READABLE)).toBe(
      'Neutral: 3 positive · 2 neutral · 1 negative across 6 calls and 2 emails, latest 12 Sep',
    );
    expect(sentimentWhy('positive', 'computed', { ...READABLE, calls: 1, emails: 1, tickets: 1, latest_at: null })).toBe(
      'Positive: 3 positive · 2 neutral · 1 negative across 1 call, 1 email and 1 ticket',
    );
    // Set by hand: it never claims nothing was analysed, and says their
    // analysed calls are read again tonight. A hand-set sentiment's
    // evidence is null (spec: sentiment_readable is null for it).
    expect(sentimentWhy('negative', 'manual', null)).toBe('Negative. Set by hand.');
    expect(sentimentWhy('negative', 'manual', null, 2)).toBe('Negative. Set by hand; their calls will be read again tonight.');
    expect(sentimentWhy('negative', 'manual', READABLE, 1)).not.toMatch(/nothing/i);
    // Computed, but from nothing readable and nothing hidden either: not
    // "set by hand".
    expect(sentimentWhy('neutral', 'computed', { ...READABLE, calls: 0, emails: 0 })).toBe(
      'Neutral. Nothing of theirs has been analysed yet.',
    );
    expect(sentimentWhy('neutral', 'computed', null)).toBe('Neutral. Nothing of theirs has been analysed yet.');
    // The stored sentiment also rests on records the viewer cannot open.
    expect(sentimentWhy('neutral', 'computed', { ...READABLE, others: true })).toBe(
      "Neutral: 3 positive · 2 neutral · 1 negative across 6 calls and 2 emails, latest 12 Sep Also rests on records you can't open.",
    );
    // Nothing readable at all, but the stored sentiment rests on records
    // the viewer cannot open.
    expect(sentimentWhy('negative', 'computed', { ...READABLE, calls: 0, emails: 0, tickets: 0, others: true })).toBe(
      "Negative, from records you can't open.",
    );
  });

  it('counts calls beside the sentiment', () => {
    expect(callsLabel(LUKAS)).toBe('6 calls');
    expect(callsLabel({ ...LUKAS, calls: 1 })).toBe('1 call');
    expect(callsLabel(MIRA)).toBe('set by hand');
    expect(callsLabel({ ...LUKAS, calls: 0 })).toBe('no calls');
    // The old shape (no `calls`, `sentiment_evidence.calls` instead): the
    // fallback this guards against a crash for.
    expect(callsLabel({ ...LUKAS, calls: undefined, sentiment_evidence: OLD_EVIDENCE })).toBe('4 calls');
    expect(callsLabel({ ...LUKAS, calls: undefined, sentiment_evidence: { ...OLD_EVIDENCE, calls: 0 } })).toBe('no calls');
    // Neither field at all: must never throw.
    const bareLukas = { ...LUKAS, calls: undefined, sentiment_evidence: undefined };
    expect(() => callsLabel(bareLukas)).not.toThrow();
    expect(callsLabel(bareLukas)).toBe('no calls');
  });

  it('names a classification, blanks left out', () => {
    expect(classificationLabel({ area: 'Customer Success', category: 'Account Management', subcategory: '' })).toBe(
      'Customer Success › Account Management',
    );
    expect(classificationLabel({ area: '', category: '', subcategory: '' })).toBe('');
  });

  it('places a person: the served refs, or the older fields', () => {
    expect(placeLabel(placeOf(LUKAS))).toBe('Kraft Heinz › Kraft Heinz EMEA');
    expect(placeLabel(placeOf(MIRA))).toBe('Pizza Hut');
    const older = { ...LUKAS, organisation: undefined, account: undefined };
    expect(placeOf(older)).toEqual({ organisation: { id: 6, name: 'Kraft Heinz' }, account: { id: 31, name: 'Kraft Heinz EMEA' } });
  });

  it('links only http(s)', () => {
    expect(safeUrl('https://zoom.us/rec/1')).toBe('https://zoom.us/rec/1');
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    expect(safeUrl(null)).toBeNull();
  });
});
