import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AccountSheet } from './AccountSheet';
import { pizzaHut } from '../../../features/organizations/testPortfolio';

describe('AccountSheet', () => {
  it('opens as a modal sheet with the header signals and the panels', () => {
    render(
      <MemoryRouter>
        <AccountSheet row={pizzaHut} currency="USD" onClose={vi.fn()} onEdit={vi.fn()} />
      </MemoryRouter>,
    );
    const sheet = screen.getByRole('dialog', { name: 'Pizza Hut' });
    expect(sheet).toHaveAttribute('aria-modal', 'true');
    expect(within(sheet).getByRole('button', { name: 'Close' })).toHaveFocus();
    expect(sheet).toHaveTextContent('AI 1 · CSM 3');
    expect(sheet).toHaveTextContent('47d overdue');
    expect(within(sheet).getByRole('heading', { name: 'Commercial' })).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: 'Edit details' })).toBeInTheDocument();
    expect(within(sheet).getByRole('link', { name: 'Open organization page' })).toHaveAttribute('href', '/organizations/7');
  });

  it('closes on Escape and returns focus to the opener', async () => {
    const onClose = vi.fn();
    function Page({ open }: { open: boolean }) {
      return (
        <MemoryRouter>
          <button type="button">Open Pizza Hut</button>
          {open ? <AccountSheet row={pizzaHut} currency="USD" onClose={onClose} /> : null}
        </MemoryRouter>
      );
    }
    const { rerender } = render(<Page open={false} />);
    screen.getByRole('button', { name: 'Open Pizza Hut' }).focus();
    rerender(<Page open />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
    rerender(<Page open={false} />);
    expect(screen.getByRole('button', { name: 'Open Pizza Hut' })).toHaveFocus();
  });
});
