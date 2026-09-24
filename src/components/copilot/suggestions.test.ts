import { describe, it, expect } from 'vitest';
import { SUGGESTIONS } from './suggestions';

describe('SUGGESTIONS', () => {
  it.each(['overview', 'revenue', 'health', 'support'] as const)('offers three distinct questions on %s', (area) => {
    const list = SUGGESTIONS[area];
    expect(list).toHaveLength(3);
    expect(new Set(list).size).toBe(3);
    for (const q of list) expect(q).toMatch(/\?$/);
  });
});
