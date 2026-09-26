import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ACCOUNTS } from '../../../features/organizations/testStory';
import { AccountsSection } from './AccountsSection';

function renderSection(props: Partial<ComponentProps<typeof AccountsSection>> = {}) {
  const handlers = { onRetry: vi.fn(), onAdd: vi.fn(), onEdit: vi.fn() };
  render(
    <MemoryRouter>
      <AccountsSection items={ACCOUNTS} loading={false} error={null} {...handlers} {...props} />
    </MemoryRouter>,
  );
  return handlers;
}

const item = (id: number) => document.querySelector(`[data-account="${id}"]`) as HTMLElement;

describe('AccountsSection (owner decision 2026-09-26: no account detail is lost)', () => {
  it('lists each connected account as an item, not a table, with what the accounts endpoint serves', () => {
    renderSection();
    const section = screen.getByRole('region', { name: 'Accounts' });
    expect(within(section).queryByRole('table')).not.toBeInTheDocument();
    expect(within(section).getAllByRole('listitem')).toHaveLength(2);
    const emea = item(31);
    expect(within(emea).getByRole('link', { name: 'EMEA' })).toHaveAttribute('href', '/accounts/31');
    expect(within(emea).getByText('Carl CSM · emea.pizzahut.example')).toBeInTheDocument();
    expect(within(emea).getByText('AI 4')).toBeInTheDocument();
    expect(within(emea).getByText('Satisfied')).toBeInTheDocument();
    expect(within(emea).getByRole('img', { name: 'Pulse history: good, good, mixed' })).toBeInTheDocument();
    expect(within(emea).getByText('Usage is steady and the renewal talks are friendly.')).toBeInTheDocument();
    // North America has no owner, domain, score or pulse: it says so, and invents nothing.
    const na = item(32);
    expect(within(na).getByRole('link', { name: 'North America' })).toHaveAttribute('href', '/accounts/32');
    expect(within(na).getByText('No owner')).toBeInTheDocument();
    expect(within(na).getByText('AI —')).toBeInTheDocument();
    expect(within(na).queryByRole('img')).not.toBeInTheDocument();
  });

  it('adds an account, and edits each one', async () => {
    const { onAdd, onEdit } = renderSection();
    await userEvent.click(screen.getByRole('button', { name: 'Add account' }));
    expect(onAdd).toHaveBeenCalledOnce();
    await userEvent.click(within(item(32)).getByRole('button', { name: 'Edit North America' }));
    expect(onEdit).toHaveBeenCalledWith(ACCOUNTS[1]);
  });

  it('gives every control a 44px target below sm', () => {
    renderSection();
    for (const control of [...screen.getAllByRole('button'), ...screen.getAllByRole('link')]) {
      expect(control).toHaveClass('min-h-11');
    }
  });

  it('shows a skeleton while the accounts load', () => {
    renderSection({ items: [], loading: true });
    expect(screen.getByRole('status', { name: 'Loading accounts' })).toBeInTheDocument();
  });

  it('shows the error with Try again', async () => {
    const { onRetry } = renderSection({ items: [], error: 'Could not load accounts.' });
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load accounts.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('says when no account is connected yet, and still offers Add account', () => {
    renderSection({ items: [] });
    expect(screen.getByText('No accounts yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add account' })).toBeInTheDocument();
  });
});
