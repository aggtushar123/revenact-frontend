import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PortfolioToolbar } from './PortfolioToolbar';
import { parseParams } from '../../../features/organizations/portfolioParams';
import { FILTER_OPTIONS } from '../../../features/organizations/testPortfolio';

function renderToolbar(search = '', isSm = true) {
  const props = {
    params: parseParams(new URLSearchParams(search)),
    update: vi.fn(),
    options: FILTER_OPTIONS,
    isSm,
    pins: [],
    onTogglePin: vi.fn(),
    onExport: vi.fn(),
    exporting: false,
    onAdd: vi.fn(),
    searchRef: createRef<HTMLInputElement>(),
  };
  render(<PortfolioToolbar {...props} />);
  return props;
}

describe('PortfolioToolbar', () => {
  it('debounces search into one update', async () => {
    const { update } = renderToolbar();
    const input = screen.getByRole('searchbox', { name: 'Search by name or Revenact ID' });
    expect(input).toHaveAttribute('placeholder', 'Search by name or Revenact ID');
    await userEvent.type(input, 'pizza');
    await waitFor(() => expect(update).toHaveBeenCalledWith({ search: 'pizza' }));
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('groups and sorts', async () => {
    const { update } = renderToolbar();
    const group = screen.getByRole('combobox', { name: 'Group' });
    expect(group).toHaveValue('health');
    await userEvent.selectOptions(group, 'none');
    expect(update).toHaveBeenLastCalledWith({ group: '' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'renewal');
    expect(update).toHaveBeenLastCalledWith({ sort: '-renewal' });
    await userEvent.click(screen.getByRole('button', { name: 'Descending' }));
    expect(update).toHaveBeenLastCalledWith({ sort: 'arr' });
  });

  it('counts active filters on the Filters button and opens the panel', async () => {
    renderToolbar('health=poor&owner=2');
    const button = screen.getByRole('button', { name: /^Filters/ });
    expect(button).toHaveTextContent('2');
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
  });

  it('exports, adds and opens the pin menu', async () => {
    const { onExport, onAdd } = renderToolbar();
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(onExport).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Add organization' }));
    expect(onAdd).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Pin fields' }));
    expect(screen.getByRole('dialog', { name: 'Pin fields' })).toBeInTheDocument();
  });

  it('collapses to Search and Filters on phones', () => {
    renderToolbar('', false);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Filters/ })).toBeInTheDocument();
    for (const name of ['Export', 'Add organization', 'Pin fields']) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole('combobox', { name: 'Group' })).not.toBeInTheDocument();
  });
});
