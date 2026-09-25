import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PortfolioSections, sectionStartsOpen } from './PortfolioSections';
import { usePortfolio } from './usePortfolio';
import { parseParams } from '../../../features/organizations/portfolioParams';
import { buildPortfolio, portfolioQueries, stubPortfolio } from '../../../features/organizations/testPortfolio';
import type { PortfolioRow } from '../../../features/organizations/portfolioTypes';

function Harness({ search = '', onClearFilters = vi.fn(), onAdd = vi.fn() }: { search?: string; onClearFilters?: () => void; onAdd?: () => void }) {
  const params = parseParams(new URLSearchParams(search));
  const portfolio = usePortfolio(params, 0);
  return (
    <PortfolioSections
      params={params}
      version={0}
      portfolio={portfolio}
      currency="USD"
      filtered={search !== '' && !search.startsWith('group')}
      renderRow={(row: PortfolioRow) => <li key={row.id}>{row.name}</li>}
      onRowsLoaded={() => {}}
      onClearFilters={onClearFilters}
      onAdd={onAdd}
    />
  );
}

describe('PortfolioSections', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows row-shaped skeletons first', () => {
    stubPortfolio();
    render(<Harness />);
    expect(screen.getByRole('status', { name: 'Loading organizations' })).toBeInTheDocument();
  });

  it('groups by health in the server order, each section reading its own rows', async () => {
    const spy = stubPortfolio();
    render(<Harness search="include_churned=1" />);
    const poor = await screen.findByRole('button', { name: /^Poor · 1 · \$30\.0K/ });
    expect(poor).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByText('Initech')).toBeInTheDocument();
    expect(await screen.findByText('Pizza Hut')).toBeInTheDocument();
    const sectionQueries = portfolioQueries(spy).filter((q) => q.has('group_value'));
    expect(sectionQueries.map((q) => q.get('group_value')).sort()).toEqual(['average', 'good', 'poor']);
    expect(sectionQueries.every((q) => q.get('limit') === '25')).toBe(true);

    await userEvent.click(poor);
    expect(poor).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Initech')).not.toBeInTheDocument();
  });

  it('opens every section when there are four or fewer, else only the first', () => {
    expect(sectionStartsOpen(3, 4)).toBe(true);
    expect(sectionStartsOpen(0, 5)).toBe(true);
    expect(sectionStartsOpen(1, 5)).toBe(false);
  });

  it('lists ungrouped rows with Show more', async () => {
    stubPortfolio({
      portfolio: (q) => {
        const two = new URLSearchParams(q);
        two.set('limit', '2');
        return buildPortfolio(two);
      },
    });
    render(<Harness search="group=none&include_churned=1" />);
    expect(await screen.findByText('Globex')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show more organizations' }));
    expect(await screen.findByText('Initech')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more organizations' })).not.toBeInTheDocument();
  });

  it('designs the empty states', async () => {
    stubPortfolio();
    const onClearFilters = vi.fn();
    const { unmount } = render(<Harness search="search=zzz" onClearFilters={onClearFilters} />);
    expect(await screen.findByText('No organizations match these filters')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClearFilters).toHaveBeenCalled();
    unmount();

    stubPortfolio({ portfolio: (q) => buildPortfolio(q, []) });
    const onAdd = vi.fn();
    render(<Harness onAdd={onAdd} />);
    expect(await screen.findByText('No organizations yet')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add organization' }));
    expect(onAdd).toHaveBeenCalled();
  });

  it('shows an error with Try again', async () => {
    let fail = true;
    stubPortfolio({ portfolio: (q) => (fail ? { status: 500, body: { detail: 'Boom' } } : buildPortfolio(q)) });
    render(<Harness />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(await screen.findByText('Pizza Hut')).toBeInTheDocument();
  });
});
