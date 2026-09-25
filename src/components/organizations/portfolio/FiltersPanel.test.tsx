import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FiltersPanel } from './FiltersPanel';
import { parseParams } from '../../../features/organizations/portfolioParams';
import { FILTER_OPTIONS } from '../../../features/organizations/testPortfolio';

function renderPanel(search = '', isSm = true) {
  const props = {
    params: parseParams(new URLSearchParams(search)),
    update: vi.fn(),
    options: FILTER_OPTIONS,
    isSm,
    onClose: vi.fn(),
    onExport: vi.fn(),
    exporting: false,
    onAdd: vi.fn(),
  };
  render(<FiltersPanel {...props} />);
  return props;
}

describe('FiltersPanel', () => {
  it('filters by health, lifecycle and product with checkboxes', async () => {
    const { update } = renderPanel('health=average');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Poor' }));
    expect(update).toHaveBeenLastCalledWith({ health: ['average', 'poor'] });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Average' }));
    expect(update).toHaveBeenLastCalledWith({ health: [] });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Live' }));
    expect(update).toHaveBeenLastCalledWith({ lifecycle: ['live'] });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Hiring' }));
    expect(update).toHaveBeenLastCalledWith({ product: ['1'] });
  });

  it('filters by owner from the server options, Unassigned included once', async () => {
    const { update } = renderPanel();
    const owner = screen.getByRole('combobox', { name: 'Owner' });
    expect(screen.getAllByRole('option', { name: 'Unassigned' })).toHaveLength(1);
    await userEvent.selectOptions(owner, 'unassigned');
    expect(update).toHaveBeenLastCalledWith({ owner: 'unassigned' });
  });

  it('filters by renewal window, NPS band and churned', async () => {
    const { update } = renderPanel();
    await userEvent.click(screen.getByRole('radio', { name: '90 days' }));
    expect(update).toHaveBeenLastCalledWith({ renews_within: '90' });
    await userEvent.click(screen.getByRole('radio', { name: 'Detractors' }));
    expect(update).toHaveBeenLastCalledWith({ nps: 'detractor' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Include churned' }));
    expect(update).toHaveBeenLastCalledWith({ include_churned: true });
  });

  it('closes on Escape', async () => {
    const { onClose } = renderPanel();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('is a modal bottom sheet on phones, holding group, sort, export and add', async () => {
    const { update, onExport, onAdd } = renderPanel('', false);
    const sheet = screen.getByRole('dialog', { name: 'Filters' });
    expect(sheet).toHaveAttribute('aria-modal', 'true');
    expect(sheet).toContainElement(document.activeElement as HTMLElement);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Group' }), 'owner');
    expect(update).toHaveBeenLastCalledWith({ group: 'owner' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'name');
    expect(update).toHaveBeenLastCalledWith({ sort: '-name' });
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(onExport).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Add organization' }));
    expect(onAdd).toHaveBeenCalled();
  });

  it('keeps group and sort out of the desktop popover (the toolbar has them)', () => {
    renderPanel('', true);
    expect(screen.queryByRole('combobox', { name: 'Group' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Filters' })).not.toHaveAttribute('aria-modal');
  });
});
