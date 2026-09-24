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
});
