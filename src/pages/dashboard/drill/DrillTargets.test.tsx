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
});
