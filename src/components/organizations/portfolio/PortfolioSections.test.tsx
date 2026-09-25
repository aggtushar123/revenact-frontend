import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PortfolioSections, sectionStartsOpen, type PortfolioRowRenderer } from './PortfolioSections';
import { usePortfolio, type PortfolioState } from './usePortfolio';
import { parseParams } from '../../../features/organizations/portfolioParams';
import { buildPortfolio, pizzaHut, portfolioQueries, stubPortfolio } from '../../../features/organizations/testPortfolio';
import type { PortfolioRow } from '../../../features/organizations/portfolioTypes';

const defaultRenderRow: PortfolioRowRenderer = (row) => <li key={row.id}>{row.name}</li>;

/** A row renderer that shows its own `loading` flag as a real, disableable
 *  checkbox, so a test can assert the wiring end to end without going
 *  through AccountRow (unit-tested for `selectDisabled` on its own). */
const checkboxRenderRow: PortfolioRowRenderer = (row, { loading }) => (
  <li key={row.id}>
    {row.name}
    <input type="checkbox" aria-label={`Select ${row.name}`} disabled={loading} readOnly />
  </li>
);

function Harness({
  search = '',
  onClearFilters = vi.fn(),
  onAdd = vi.fn(),
  renderRow = defaultRenderRow,
}: {
  search?: string;
  onClearFilters?: () => void;
  onAdd?: () => void;
  renderRow?: PortfolioRowRenderer;
}) {
  const params = parseParams(new URLSearchParams(search));
  const portfolio = usePortfolio(params, 0);
  return (
    <PortfolioSections
      params={params}
      version={0}
      portfolio={portfolio}
      currency="USD"
      filtered={search !== '' && !search.startsWith('group')}
      renderRow={renderRow}
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

  it('does not end a stale-data error in a double period', () => {
    // Exercises the "keep the last good list, banner the failure" branch
    // directly against a hand-built PortfolioState — every message this app
    // surfaces already ends in its own period (ApiError/errorMessage's
    // fallback included), so appending a sentence must not run two together.
    const params = parseParams(new URLSearchParams('include_churned=1'));
    const data = buildPortfolio(new URLSearchParams('include_churned=1'));
    const stalePortfolio: PortfolioState = {
      data,
      rows: [],
      next: null,
      loading: false,
      error: 'Could not load organizations.',
      loadingMore: false,
      moreError: null,
      loadMore: async () => {},
      retry: vi.fn(),
      loadedKey: 'stale',
      loadedQuery: 'include_churned=1',
      total: null,
    };
    render(
      <PortfolioSections
        params={params}
        version={0}
        portfolio={stalePortfolio}
        currency="USD"
        filtered={false}
        renderRow={defaultRenderRow}
        onRowsLoaded={() => {}}
        onClearFilters={() => {}}
        onAdd={() => {}}
      />,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not load organizations. Showing the last result.');
    expect(alert.textContent).not.toMatch(/\.\./);
  });

  it("disables a section's own rows while its own query is reloading, keeping the stale rows visible", async () => {
    stubPortfolio();
    const { rerender } = render(<Harness search="include_churned=1" renderRow={checkboxRenderRow} />);
    await screen.findByText('Initech');
    expect(screen.getByRole('checkbox', { name: 'Select Initech' })).not.toBeDisabled();

    // Same rows, same groups, but a different sort — the section's own query
    // changes, so it refetches under a stale-but-shown last result.
    rerender(<Harness search="include_churned=1&sort=name" renderRow={checkboxRenderRow} />);
    expect(screen.getByText('Initech')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Initech' })).toBeDisabled();

    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Select Initech' })).not.toBeDisabled());
  });

  it('does not fetch a collapsed section until it is opened', async () => {
    const lifecycleRows: PortfolioRow[] = [
      { ...pizzaHut, id: 201, name: 'Row A', lifecycle: { value: 'onboarding', label: 'Onboarding' } },
      { ...pizzaHut, id: 202, name: 'Row B', lifecycle: { value: 'kickoff', label: 'Kickoff' } },
      { ...pizzaHut, id: 203, name: 'Row C', lifecycle: { value: 'adoption', label: 'Adoption' } },
      { ...pizzaHut, id: 204, name: 'Row D', lifecycle: { value: 'live', label: 'Live' } },
      { ...pizzaHut, id: 205, name: 'Row E', lifecycle: { value: 'renewal', label: 'Renewal' } },
    ];
    const spy = stubPortfolio({ portfolio: (q) => buildPortfolio(q, lifecycleRows) });
    render(<Harness search="group=lifecycle" />);

    await screen.findByText('Row A');
    expect(
      portfolioQueries(spy)
        .filter((q) => q.get('group_value'))
        .map((q) => q.get('group_value')),
    ).toEqual(['onboarding']);

    const kickoff = screen.getByRole('button', { name: /^Kickoff/ });
    expect(kickoff).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Row B')).not.toBeInTheDocument();

    await userEvent.click(kickoff);
    expect(await screen.findByText('Row B')).toBeInTheDocument();
    expect(
      portfolioQueries(spy)
        .filter((q) => q.get('group_value'))
        .map((q) => q.get('group_value'))
        .sort(),
    ).toEqual(['kickoff', 'onboarding']);
  });

  it('retries one failed section without disturbing the others', async () => {
    let poorFails = true;
    stubPortfolio({
      portfolio: (q) =>
        q.get('group_value') === 'poor' && poorFails
          ? { status: 500, body: { detail: 'Section boom' } }
          : buildPortfolio(q),
    });
    render(<Harness search="include_churned=1" />);
    expect(await screen.findByText('Pizza Hut')).toBeInTheDocument();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Section boom');
    poorFails = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.queryByText('Section boom')).not.toBeInTheDocument());
    expect(await screen.findByText('Initech')).toBeInTheDocument();
  });
});
