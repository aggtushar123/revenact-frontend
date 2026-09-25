import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSelection } from './useSelection';

describe('useSelection', () => {
  it('toggles, replaces and clears', () => {
    const { result } = renderHook(() => useSelection('a'));
    expect(result.current.selecting).toBe(false);
    act(() => result.current.toggle(7));
    act(() => result.current.toggle(1));
    expect([...result.current.selected]).toEqual([7, 1]);
    expect(result.current.selecting).toBe(true);
    act(() => result.current.toggle(7));
    expect([...result.current.selected]).toEqual([1]);
    act(() => result.current.replace([2, 3]));
    expect([...result.current.selected]).toEqual([2, 3]);
    act(() => result.current.clear());
    expect(result.current.selecting).toBe(false);
  });

  it('clears when the filters change', () => {
    const { result, rerender } = renderHook(({ key }) => useSelection(key), { initialProps: { key: 'owner=2' } });
    act(() => result.current.toggle(7));
    rerender({ key: 'owner=3' });
    expect(result.current.selected.size).toBe(0);
  });
});
