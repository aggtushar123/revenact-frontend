import { describe, expect, it } from 'vitest';
import { RAW, sizeOffenders } from './houseRules';

describe('house-rules scanners', () => {
  it('flag real offenders and leave tokens alone', () => {
    expect(RAW.test('bg-orange-500')).toBe(true);
    expect(RAW.test('text-pink-600')).toBe(true);
    expect(RAW.test('bg-white')).toBe(true);
    expect(RAW.test('text-white')).toBe(true);
    expect(RAW.test('border-black')).toBe(true);
    expect(RAW.test('#fff')).toBe(true);
    expect(RAW.test('rgba(0,0,0,.5)')).toBe(true);
    expect(RAW.test('bg-surface')).toBe(false);
    expect(RAW.test('text-ink-muted')).toBe(false);
    expect(RAW.test('bg-danger-dim')).toBe(false);
    expect(RAW.test('accent-accent')).toBe(false);

    expect(sizeOffenders('text-[0.8rem]')).toEqual(['text-[0.8rem]']);
    expect(sizeOffenders('text-[10px]')).toEqual(['text-[10px]']);
    expect(sizeOffenders('text-[13px]')).toEqual([]);
    expect(sizeOffenders('text-sm')).toEqual(['named text size']);
    expect(sizeOffenders('text-[11px] text-ink')).toEqual([]);
  });
});
