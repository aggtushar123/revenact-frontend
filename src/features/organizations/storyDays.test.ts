import { describe, expect, it } from 'vitest';
import { dayKey, dayLabel, groupByDay, localDay, timeLabel } from './storyDays';

// Local times built with the Date constructor, so each lands on the stated
// calendar day in whatever time zone the tests run. A date-only record comes
// from the backend as midnight UTC with `all_day: true`.
const at = (y: number, m: number, d: number, h: number, min = 0) => ({
  occurred_at: new Date(y, m - 1, d, h, min).toISOString(),
  all_day: false,
});
const onDay = (date: string) => ({ occurred_at: `${date}T00:00:00+00:00`, all_day: true });

describe('story days', () => {
  it("reads a timed item in the viewer's zone and an all-day item as its UTC date", () => {
    expect(dayKey(at(2026, 9, 25, 14, 5))).toBe('2026-09-25');
    expect(dayKey(onDay('2026-08-31'))).toBe('2026-08-31');
    expect(localDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('shows a time only when the record keeps one', () => {
    expect(timeLabel(at(2026, 9, 25, 14, 5))).toBe('2:05 PM');
    expect(timeLabel(onDay('2026-08-31'))).toBe('');
  });

  it('names today, yesterday and older days', () => {
    expect(dayLabel('2026-09-26', '2026-09-26')).toBe('Today');
    expect(dayLabel('2026-09-25', '2026-09-26')).toBe('Yesterday');
    expect(dayLabel('2026-02-28', '2026-03-01')).toBe('Yesterday');
    expect(dayLabel('2026-08-31', '2026-09-26')).toBe('31 Aug 2026');
  });

  it('groups by day in the order the items came, one group per day', () => {
    const items = [
      { id: 1, ...at(2026, 9, 25, 15) },
      { id: 2, ...at(2026, 9, 25, 9) },
      { id: 3, ...onDay('2026-09-24') },
      { id: 4, ...at(2026, 9, 25, 8) },
    ];
    expect(groupByDay(items).map((g) => [g.key, g.items.map((i) => i.id)])).toEqual([
      ['2026-09-25', [1, 2, 4]],
      ['2026-09-24', [3]],
    ]);
  });
});
