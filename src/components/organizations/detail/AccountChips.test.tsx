import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ACCOUNTS } from '../../../features/organizations/testStory';
import { AccountChips } from './AccountChips';

function renderChips(props: Partial<ComponentProps<typeof AccountChips>> = {}) {
  const handlers = { onSelect: vi.fn(), onRetry: vi.fn(), onAdd: vi.fn(), onEdit: vi.fn() };
  render(
    <AccountChips
      accounts={ACCOUNTS}
      loading={false}
      error={null}
      counts={{ all: 5, none: 3, '31': 1, '32': 1 }}
      selected=""
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

const chips = () => within(screen.getByRole('group', { name: 'Filter by account' })).queryAllByRole('button');

describe('AccountChips (spec §1.4)', () => {
  it("shows All, each account and the organization itself with the story's counts", () => {
    renderChips();
    expect(chips().map((chip) => chip.textContent)).toEqual(['All 5', 'EMEA 1', 'North America 1', 'Organization 3']);
    expect(screen.getByRole('button', { name: 'All 5' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows no numbers until the story has counted', () => {
    renderChips({ counts: null });
    expect(chips().map((chip) => chip.textContent)).toEqual(['All', 'EMEA', 'North America']);
  });

  it('leaves out an account the story does not count (outside this viewer\'s scope), and hides Organization when it has none', () => {
    renderChips({ counts: { all: 2, none: 0, '31': 2 } });
    expect(chips().map((chip) => chip.textContent)).toEqual(['All 2', 'EMEA 2']);
  });

  it('keeps an in-scope account with nothing matching as 0', () => {
    renderChips({ counts: { all: 2, none: 0, '31': 2, '32': 0 } });
    expect(chips().map((chip) => chip.textContent)).toEqual(['All 2', 'EMEA 2', 'North America 0']);
  });

  it('chooses an account, and pressing it again goes back to All', async () => {
    const { onSelect } = renderChips({ selected: '31' });
    expect(screen.getByRole('button', { name: 'EMEA 1' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'North America 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'EMEA 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Organization 3' }));
    expect(onSelect.mock.calls.map(([value]) => value)).toEqual(['32', '', 'none']);
  });

  it('adds an account, and edits the chosen one', async () => {
    const { onAdd, onEdit } = renderChips({ selected: '31' });
    await userEvent.click(screen.getByRole('button', { name: 'Add account' }));
    expect(onAdd).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Edit EMEA' }));
    expect(onEdit).toHaveBeenCalledWith(ACCOUNTS[0]);
  });

  it('offers no edit while All is chosen, and only Add when there are no accounts', () => {
    renderChips({ accounts: [] });
    expect(chips()).toEqual([]);
    expect(screen.queryByRole('button', { name: /^Edit/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add account' })).toBeInTheDocument();
  });

  it('shows a skeleton while the accounts load', () => {
    renderChips({ accounts: [], loading: true });
    expect(screen.getByRole('status', { name: 'Loading accounts' })).toBeInTheDocument();
  });

  it('shows the error with Try again', async () => {
    const { onRetry } = renderChips({ accounts: [], error: 'Could not load accounts.' });
    expect(screen.getByText('Could not load accounts.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
