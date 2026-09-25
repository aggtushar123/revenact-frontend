import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DrillTargets } from './DrillTargets';

describe('DrillTargets', () => {
  it('gives keyboard users one button per drillable part', async () => {
    const onSelect = vi.fn();
    render(<DrillTargets label="Ticket priority" items={[{ name: 'High', figure: '135', onSelect }]} />);
    const list = screen.getByRole('list', { name: 'Ticket priority' });
    const button = screen.getByRole('button', { name: 'High 135, show accounts' });
    expect(list).toContainElement(button);
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(button);
  });

  it('keys items by their own key, so two parts with one name both render without a key warning', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <DrillTargets
        label="Origins"
        items={[
          { key: '1', name: 'Support', figure: '9', onSelect: vi.fn() },
          { key: '2', name: 'Support', figure: '7', onSelect: vi.fn() },
        ]}
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(errors.mock.calls.filter((call) => String(call[0]).includes('same key'))).toHaveLength(0);
    errors.mockRestore();
  });

  // Revealed on focus, the list used to become a static flex row with a
  // bottom margin, pushing the plot down inside a fixed-height card and
  // squashing it. It now stays out of flow and overlays the card's top edge.
  it('overlays the card when revealed instead of taking space from the chart', () => {
    render(<DrillTargets label="Priority" items={[{ name: 'High', figure: '3', onSelect: vi.fn() }]} />);
    const list = screen.getByRole('list', { name: 'Priority' });
    expect(list).toHaveClass('sr-only');
    expect(list.className).not.toMatch(/not-sr-only|focus-within:mb-/);
    expect(list).toHaveClass(
      'focus-within:top-0',
      'focus-within:inset-x-0',
      'focus-within:z-20',
      'focus-within:size-auto',
      'focus-within:bg-surface',
      'focus-within:flex',
    );
  });
});
