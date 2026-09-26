import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { installIntersectionObserver } from '../../../test/intersection';
import { useEndSentinel } from './useEndSentinel';

function Paged({ onEnd, active }: { onEnd: () => void; active: boolean }) {
  const ref = useEndSentinel(onEnd, active);
  return (
    <ul>
      <li>Row</li>
      <li data-testid="end" ref={ref} />
    </ul>
  );
}

describe('useEndSentinel', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('calls onEnd when the end scrolls into view, only while active', () => {
    const io = installIntersectionObserver();
    const onEnd = vi.fn();
    const { rerender } = render(<Paged onEnd={onEnd} active />);
    const end = screen.getByTestId('end');
    expect(io.watching(end)).toBe(true);
    act(() => io.reveal(end));
    expect(onEnd).toHaveBeenCalledTimes(1);

    rerender(<Paged onEnd={onEnd} active={false} />);
    expect(io.watching(end)).toBe(false);
    act(() => io.reveal(end));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('calls the latest onEnd', () => {
    const io = installIntersectionObserver();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Paged onEnd={first} active />);
    rerender(<Paged onEnd={second} active />);
    act(() => io.reveal(screen.getByTestId('end')));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('does nothing without IntersectionObserver (Show more covers it)', () => {
    const onEnd = vi.fn();
    expect(() => render(<Paged onEnd={onEnd} active />)).not.toThrow();
    expect(onEnd).not.toHaveBeenCalled();
  });
});
