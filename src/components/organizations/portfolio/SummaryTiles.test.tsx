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
      expect(screen.getByRole('group', { name })).toBeInTheDocument();
    }
    const accounts = screen.getByRole('group', { name: 'Accounts · ARR' });
    expect(accounts).toHaveTextContent('2');
    expect(accounts).toHaveTextContent('$189.6K ARR');
    expect(accounts).not.toHaveTextContent('exchange rate');
  });

  it('says how many accounts have no exchange rate', () => {
    render(<SummaryTiles summary={{ ...summary, unconverted_count: 2 }} currency="USD" params={parseParams(new URLSearchParams())} onFilter={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Accounts · ARR' })).toHaveTextContent('2 without an exchange rate, left out of ARR');
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
    const health = screen.getByRole('group', { name: 'Health' });
    await userEvent.click(within(health).getByRole('button', { name: 'ARR' }));
    expect(within(health).getByRole('button', { name: 'Average $69.6K' })).toBeInTheDocument();
    await userEvent.click(within(health).getByRole('button', { name: 'MRR' }));
    expect(within(health).getByRole('button', { name: 'Average $5.8K' })).toBeInTheDocument();
  });

  it('filters by NPS band and lifecycle stage', async () => {
    const onFilter = renderTiles();
    expect(screen.getByRole('group', { name: 'NPS' })).toHaveTextContent('+44');
    await userEvent.click(screen.getByRole('button', { name: 'Detractors 2' }));
    expect(onFilter).toHaveBeenLastCalledWith({ nps: 'detractor' });
    await userEvent.click(screen.getByRole('button', { name: 'Live 1' }));
    expect(onFilter).toHaveBeenLastCalledWith({ lifecycle: ['live'] });
  });

  it('counts renewals in 30 or 90 days and filters to that window', async () => {
    const onFilter = renderTiles();
    const renewing = screen.getByRole('group', { name: 'Renewing' });
    await userEvent.click(within(renewing).getByRole('button', { name: '90d' }));
    await userEvent.click(within(renewing).getByRole('button', { name: 'Renewing within 90 days: 1' }));
    expect(onFilter).toHaveBeenLastCalledWith({ renews_within: '90' });
  });

  it('names each tile as a group, not a landmark region', () => {
    renderTiles();
    expect(screen.queryAllByRole('region')).toHaveLength(0);
    expect(screen.getByRole('group', { name: 'Lifecycle' })).toBeInTheDocument();
  });

  it('lists only the stages in use, without an inner scroll, and titles each label', () => {
    const withEmpty = { ...summary, lifecycle: [...summary.lifecycle, { value: 'expansion' as const, label: 'Expansion', count: 0, arr: 0 }] };
    render(<SummaryTiles summary={withEmpty} currency="USD" params={parseParams(new URLSearchParams())} onFilter={vi.fn()} />);
    const lifecycle = screen.getByRole('group', { name: 'Lifecycle' });
    // Live and Adoption have accounts; Expansion has none, so it is left out.
    expect(within(lifecycle).getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent)).toEqual(['Live 1', 'Adoption 1']);
    expect(lifecycle.querySelector('.overflow-y-auto')).toBeNull();
    expect(within(lifecycle).getByText('Live')).toHaveAttribute('title', 'Live');
  });

  it('fits many stages in two columns', () => {
    const stages = ['onboarding', 'kickoff', 'adoption', 'live', 'renewal', 'expansion', 'other'] as const;
    const many = { ...summary, lifecycle: stages.map((value, i) => ({ value, label: value, count: i + 1, arr: 0 })) };
    render(<SummaryTiles summary={many} currency="USD" params={parseParams(new URLSearchParams())} onFilter={vi.fn()} />);
    const lifecycle = screen.getByRole('group', { name: 'Lifecycle' });
    expect(within(lifecycle).getAllByRole('button')).toHaveLength(7);
    expect(lifecycle.querySelector('.grid-cols-2')).not.toBeNull();
  });

  it('shows the 180-day window when that filter is active', () => {
    renderTiles('renews_within=180');
    const renewing = screen.getByRole('group', { name: 'Renewing' });
    expect(within(renewing).getByRole('button', { name: '180d' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(renewing).getByRole('button', { name: /Renewing within 180 days/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('says the summary is unavailable after a failed first load, instead of loading forever', () => {
    render(<SummaryTiles summary={null} failed currency="USD" params={parseParams(new URLSearchParams())} onFilter={vi.fn()} />);
    expect(screen.queryByRole('status', { name: 'Loading summary' })).not.toBeInTheDocument();
    expect(screen.getByText('Summary unavailable')).toBeInTheDocument();
  });

  it('shows tile-shaped skeletons while loading', () => {
    render(<SummaryTiles summary={null} currency="USD" params={parseParams(new URLSearchParams())} onFilter={vi.fn()} />);
    expect(screen.getByRole('status', { name: 'Loading summary' })).toBeInTheDocument();
  });
});
