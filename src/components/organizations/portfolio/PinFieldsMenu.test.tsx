import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PinFieldsMenu } from './PinFieldsMenu';

describe('PinFieldsMenu', () => {
  it('lists the 28 panel fields and toggles one', async () => {
    const onToggle = vi.fn();
    render(<PinFieldsMenu pins={[]} onToggle={onToggle} onClose={vi.fn()} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(28);
    await userEvent.click(screen.getByRole('checkbox', { name: 'NPS' }));
    expect(onToggle).toHaveBeenCalledWith('nps');
  });

  it('stops at three pins', () => {
    render(<PinFieldsMenu pins={['nps', 'tcv', 'domain']} onToggle={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('3 of 3 pinned')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'CES' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'NPS' })).toBeEnabled();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(<PinFieldsMenu pins={[]} onToggle={vi.fn()} onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
