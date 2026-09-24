import { describe, it, expect, vi, afterEach } from 'vitest';
import { ASK_PREFERENCE_KEY, readAskPreference, writeAskPreference } from './askPreference';

describe('askPreference', () => {
  afterEach(() => vi.restoreAllMocks());

  it('remembers open and closed, and knows nothing before a choice', () => {
    expect(readAskPreference()).toBeNull();
    writeAskPreference(false);
    expect(localStorage.getItem(ASK_PREFERENCE_KEY)).toBe('closed');
    expect(readAskPreference()).toBe(false);
    writeAskPreference(true);
    expect(readAskPreference()).toBe(true);
  });

  it('falls back to no choice when storage throws, and never throws itself', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    expect(readAskPreference()).toBeNull();
    expect(() => writeAskPreference(true)).not.toThrow();
  });
});
