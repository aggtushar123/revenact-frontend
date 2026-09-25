import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SummaryTiles } from './SummaryTiles';
import { parseParams } from '../../../features/organizations/portfolioParams';
import { buildPortfolio } from '../../../features/organizations/testPortfolio';

const summary = buildPortfolio(new URLSearchParams()).summary;

function renderTiles(search = '') {
  const onFilter = vi.fn();
  render(<SummaryTiles summary={summary} currency="USD" params={parseParams(new URLSearchParams(search))} onFilter={onFilter} />);
  return onFilter;
}

describe('SummaryTiles', () => {
  it('shows the five tiles', () => {
    renderTiles();
    for (const name of ['Health', 'NPS', 'Lifecycle', 'Accounts · ARR', 'Renewing']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
    const accounts = screen.getByRole('region', { name: 'Accounts · ARR' });
    expect(accounts).toHaveTextContent('2');
    expect(accounts).toHaveTextContent('$189.6K ARR');
    expect(accounts).not.toHaveTextContent('exchange rate');
  });

  it('says how many accounts have no exchange rate', () => {
    render(<SummaryTiles summary={{ ...summary, unconverted_count: 2 }} currency="USD" params={parseParams(new URLSearchParams())} onFilter={vi.fn()} />);
    expect(screen.getByRole('region', { name: 'Accounts · ARR' })).toHaveTextContent('2 without an exchange rate, left out of ARR');
  });

  it('filters to a health band on click, and clears it on a second click', async () => {
    const onFilter = renderTiles();
    await userEvent.click(screen.getByRole('button', { name: 'Average 1' }));
    expect(onFilter).toHaveBeenLastCalledWith({ health: ['average'] });

    const again = vi.fn();
    render(<SummaryTiles summary={summary} currency="USD" params={parseParams(new URLSearchParams('health=average'))} onFilter={again} />);
    const pressed = screen.getAllByRole('button', { name: 'Average 1' }).find((b) => b.getAttribute('aria-pressed') === 'true')!;
    await userEvent.click(pressed);
    expect(again).toHaveBeenCalledWith({ health: [] });
  });

  it('switches health between count, MRR and ARR', async () => {
    renderTiles();
    const health = screen.getByRole('region', { name: 'Health' });
    await userEvent.click(within(health).getByRole('button', { name: 'ARR' }));
    expect(within(health).getByRole('button', { name: 'Average $69.6K' })).toBeInTheDocument();
    await userEvent.click(within(health).getByRole('button', { name: 'MRR' }));
    expect(within(health).getByRole('button', { name: 'Average $5.8K' })).toBeInTheDocument();
  });

  it('filters by NPS band and lifecycle stage', async () => {
    const onFilter = renderTiles();
    expect(screen.getByRole('region', { name: 'NPS' })).toHaveTextContent('+44');
    await userEvent.click(screen.getByRole('button', { name: 'Detractors 2' }));
    expect(onFilter).toHaveBeenLastCalledWith({ nps: 'detractor' });
    await userEvent.click(screen.getByRole('button', { name: 'Live 1' }));
    expect(onFilter).toHaveBeenLastCalledWith({ lifecycle: ['live'] });
  });

  it('counts renewals in 30 or 90 days and filters to that window', async () => {
    const onFilter = renderTiles();
    const renewing = screen.getByRole('region', { name: 'Renewing' });
    await userEvent.click(within(renewing).getByRole('button', { name: '90d' }));
    await userEvent.click(within(renewing).getByRole('button', { name: 'Renewing within 90 days: 1' }));
    expect(onFilter).toHaveBeenLastCalledWith({ renews_within: '90' });
  });

  it('shows tile-shaped skeletons while loading', () => {
    render(<SummaryTiles summary={null} currency="USD" params={parseParams(new URLSearchParams())} onFilter={vi.fn()} />);
    expect(screen.getByRole('status', { name: 'Loading summary' })).toBeInTheDocument();
  });
});
