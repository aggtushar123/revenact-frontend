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

const EVIDENCE = { score: 0.1, calls: 6, emails: 2, tickets: 0, positive: 3, neutral: 2, negative: 1, latest_at: '2026-09-12T10:00:00Z' };

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
    expect(sentimentWhy('neutral', 'computed', EVIDENCE)).toBe(
      'Neutral: 3 positive · 2 neutral · 1 negative across 6 calls and 2 emails, latest 12 Sep',
    );
    expect(sentimentWhy('positive', 'computed', { ...EVIDENCE, calls: 1, emails: 1, tickets: 1, latest_at: null })).toBe(
      'Positive: 3 positive · 2 neutral · 1 negative across 1 call, 1 email and 1 ticket',
    );
    expect(sentimentWhy('negative', 'manual', {})).toBe('Negative, set by hand. Nothing of theirs has been analysed yet.');
    expect(sentimentWhy('neutral', 'computed', { ...EVIDENCE, calls: 0, emails: 0 })).toBe(
      'Neutral, set by hand. Nothing of theirs has been analysed yet.',
    );
  });

  it('counts calls beside the sentiment', () => {
    expect(callsLabel(LUKAS)).toBe('6 calls');
    expect(callsLabel({ ...LUKAS, sentiment_evidence: { ...EVIDENCE, calls: 1 } })).toBe('1 call');
    expect(callsLabel(MIRA)).toBe('set by hand');
    expect(callsLabel({ ...LUKAS, sentiment_evidence: { ...EVIDENCE, calls: 0 } })).toBe('no calls');
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
