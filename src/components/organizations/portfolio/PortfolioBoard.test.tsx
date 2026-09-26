import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import {
  ALL_ROWS,
  buildPortfolio,
  pizzaHut,
  portfolioQueries,
  stubPortfolio,
} from '../../../features/organizations/testPortfolio';
import { BOARD_GROUP, boardParams, parseParams, toApiQuery } from '../../../features/organizations/portfolioParams';
import type { PortfolioRow } from '../../../features/organizations/portfolioTypes';
import { installIntersectionObserver } from '../../../test/intersection';
import { PortfolioBoard, type PortfolioBoardProps } from './PortfolioBoard';
import type { PortfolioState } from './usePortfolio';

// Component tier: the board with a ready frame (built by the test stub's own
// buildPortfolio), while every column reads through the real
// usePagedPortfolio against stubPortfolio.

type Options = Partial<PortfolioBoardProps> & { rows?: PortfolioRow[]; frame?: Partial<PortfolioState> };

function renderBoard(search = '', { rows = ALL_ROWS, frame = {}, ...overrides }: Options = {}) {
  const params = boardParams(parseParams(new URLSearchParams(search), BOARD_GROUP));
  const query = toApiQuery(params, { limit: '1' });
  const portfolio: PortfolioState = {
    data: buildPortfolio(new URLSearchParams(query), rows),
    rows: [],
    next: null,
    loading: false,
    error: null,
    loadingMore: false,
    moreError: null,
    loadMore: async () => {},
    retry: vi.fn(),
    loadedKey: `${query}#0#0`,
    loadedQuery: query,
    total: null,
    ...frame,
  };
  const props: PortfolioBoardProps = {
    params,
    portfolio,
    version: 0,
    columnBumps: {},
    currency: 'USD',
    isSm: true,
    filtered: false,
    move: null,
    saving: false,
    openId: null,
    onOpen: vi.fn(),
    onMove: vi.fn(),
    onRowsLoaded: vi.fn(),
    onClearFilters: vi.fn(),
    onAdd: vi.fn(),
    onShowChurned: vi.fn(),
    ...overrides,
  };
  render(
    <MemoryRouter>
      <PortfolioBoard {...props} />
    </MemoryRouter>,
  );
  return props;
}

const column = (key: string) => document.querySelector(`[data-column="${key}"]`) as HTMLElement;
const heading = (key: string) => within(column(key)).getByRole('heading');
const card = (id: number) => document.querySelector(`[data-card-id="${id}"]`) as HTMLElement;
const dataTransfer = () => ({ setData: vi.fn(), effectAllowed: 'all', dropEffect: 'none' });
const moveButton = (id: number) => within(card(id)).queryByRole('button', { name: 'Move to…' });
const many = Array.from({ length: 30 }, (_, i) => ({ ...pizzaHut, id: 100 + i, name: `Account ${i + 1}` }));

describe('PortfolioBoard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  it('gives every lifecycle stage a column in order with count and ARR, and reads only the non-empty ones', async () => {
    const spy = stubPortfolio();
    renderBoard();
    expect([...document.querySelectorAll('[data-column]')].map((el) => el.getAttribute('data-column'))).toEqual([
      'onboarding', 'kickoff', 'adoption', 'live', 'renewal', 'churn', 'expansion', 'other',
    ]);
    expect(heading('live')).toHaveTextContent('Live · 1 · $69.6K');
    expect(heading('kickoff')).toHaveTextContent('Kickoff · 0 · $0');
    expect(await within(column('live')).findByRole('link', { name: 'Pizza Hut' })).toBeInTheDocument();
    expect(await within(column('adoption')).findByRole('link', { name: 'Globex' })).toBeInTheDocument();
    expect(within(column('kickoff')).getByText('No organizations in Kickoff.')).toBeInTheDocument();
    expect(portfolioQueries(spy).map((q) => q.get('group_value')).sort()).toEqual(['adoption', 'live']);
    const live = portfolioQueries(spy).find((q) => q.get('group_value') === 'live')!;
    expect(live.get('group')).toBe('lifecycle');
    expect(live.get('limit')).toBe('25');
    expect(live.get('sort')).toBe('-arr');
  });

  it('keeps Churn a drop target only while churned accounts are hidden', async () => {
    stubPortfolio();
    const { onShowChurned } = renderBoard();
    const churn = column('churn');
    expect(heading('churn').textContent).toBe('Churn');
    expect(within(churn).getByText('Churned accounts are hidden.')).toBeInTheDocument();
    expect(within(churn).getByText('Drop a card here to churn it.')).toBeInTheDocument();
    await userEvent.click(within(churn).getByRole('button', { name: 'Show churned' }));
    expect(onShowChurned).toHaveBeenCalled();
  });

  it('lists churned accounts in Churn when the view includes them', async () => {
    const spy = stubPortfolio();
    renderBoard('include_churned=1');
    expect(heading('churn')).toHaveTextContent('Churn · 1 · $30.0K');
    expect(await within(column('churn')).findByRole('link', { name: 'Initech' })).toBeInTheDocument();
    expect(portfolioQueries(spy).find((q) => q.get('group_value') === 'churn')!.get('include_churned')).toBe('1');
  });

  it('loads the next page when a column end scrolls into view', async () => {
    const io = installIntersectionObserver();
    const spy = stubPortfolio({ portfolio: (q) => buildPortfolio(q, many) });
    renderBoard('', { rows: many });
    const live = column('live');
    await waitFor(() => expect(within(live).getAllByRole('link')).toHaveLength(25));
    await act(async () => io.reveal(live.querySelector('[data-sentinel]')!));
    await waitFor(() => expect(within(live).getAllByRole('link')).toHaveLength(30));
    expect(portfolioQueries(spy).some((q) => q.get('group_value') === 'live' && q.get('cursor') === '25')).toBe(true);
    expect(within(live).queryByRole('button', { name: 'Show more Live' })).not.toBeInTheDocument();
  });

  it('falls back to a visible Show more without IntersectionObserver', async () => {
    stubPortfolio({ portfolio: (q) => buildPortfolio(q, many) });
    renderBoard('', { rows: many });
    const live = column('live');
    await userEvent.click(await within(live).findByRole('button', { name: 'Show more Live' }));
    await waitFor(() => expect(within(live).getAllByRole('link')).toHaveLength(30));
  });

  it('shows a column that fails with its own Try again', async () => {
    let fail = true;
    stubPortfolio({
      portfolio: (q) => (fail && q.get('group_value') === 'live' ? { status: 500, body: { detail: 'Server error' } } : buildPortfolio(q)),
    });
    renderBoard();
    const live = column('live');
    expect(await within(live).findByRole('alert')).toHaveTextContent('Server error');
    fail = false;
    await userEvent.click(within(live).getByRole('button', { name: 'Try again' }));
    expect(await within(live).findByRole('link', { name: 'Pizza Hut' })).toBeInTheDocument();
  });

  it('moves a dragged card onto another lifecycle column, never onto its own', async () => {
    stubPortfolio();
    const { onMove } = renderBoard();
    await within(column('live')).findByRole('link', { name: 'Pizza Hut' });
    const dt = dataTransfer();
    fireEvent.dragStart(card(7), { dataTransfer: dt });
    fireEvent.dragOver(column('live'), { dataTransfer: dt });
    fireEvent.drop(column('live'), { dataTransfer: dt });
    expect(onMove).not.toHaveBeenCalled();

    fireEvent.dragStart(card(7), { dataTransfer: dt });
    fireEvent.dragOver(column('renewal'), { dataTransfer: dt });
    expect(column('renewal')).toHaveClass('ring-2', 'ring-accent');
    fireEvent.drop(column('renewal'), { dataTransfer: dt });
    expect(onMove).toHaveBeenCalledWith(pizzaHut, 'renewal');
    expect(column('renewal')).not.toHaveClass('ring-2');
  });

  it('takes a drop on the drop-only Churn column (the page opens the churn modal)', async () => {
    stubPortfolio();
    const { onMove } = renderBoard();
    await within(column('live')).findByRole('link', { name: 'Pizza Hut' });
    const dt = dataTransfer();
    fireEvent.dragStart(card(7), { dataTransfer: dt });
    fireEvent.dragOver(column('churn'), { dataTransfer: dt });
    fireEvent.drop(column('churn'), { dataTransfer: dt });
    expect(onMove).toHaveBeenCalledWith(pizzaHut, 'churn');
  });

  it('takes no drops while a move is saving', async () => {
    stubPortfolio();
    const { onMove } = renderBoard('', { saving: true });
    await within(column('live')).findByRole('link', { name: 'Pizza Hut' });
    const dt = dataTransfer();
    fireEvent.dragStart(card(7), { dataTransfer: dt });
    fireEvent.dragOver(column('renewal'), { dataTransfer: dt });
    fireEvent.drop(column('renewal'), { dataTransfer: dt });
    expect(onMove).not.toHaveBeenCalled();
    expect(moveButton(7)).toBeDisabled();
  });

  it('shows the server groups and moves nothing for other groupings', async () => {
    stubPortfolio();
    renderBoard('group=health');
    expect([...document.querySelectorAll('[data-column]')].map((el) => el.getAttribute('data-column'))).toEqual(['average', 'good']);
    expect(heading('average')).toHaveTextContent('Average · 1 · $69.6K');
    await within(column('average')).findByRole('link', { name: 'Pizza Hut' });
    expect(moveButton(7)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Add organization to/ })).not.toBeInTheDocument();
    expect(card(7)).toHaveAttribute('draggable', 'false');
  });

  it('shows a move in the header counts and its new column at once', async () => {
    stubPortfolio();
    renderBoard('', { move: { token: 1, row: pizzaHut, from: 'live', to: 'renewal' }, saving: true });
    expect(heading('renewal')).toHaveTextContent('Renewal · 1 · $69.6K');
    expect(heading('live')).toHaveTextContent('Live · 0 · $0');
    expect(within(column('renewal')).getByRole('link', { name: 'Pizza Hut' })).toBeInTheDocument();
    expect(within(column('renewal')).getByRole('button', { name: 'Move to…' })).toBeDisabled();
  });

  it('moves a card from its Move to… menu without dragging', async () => {
    stubPortfolio();
    const { onMove } = renderBoard();
    await within(column('live')).findByRole('link', { name: 'Pizza Hut' });
    await userEvent.click(moveButton(7)!);
    const menu = screen.getByRole('menu', { name: 'Move Pizza Hut to' });
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Renewal' }));
    expect(onMove).toHaveBeenCalledWith(pizzaHut, 'renewal');
  });

  it('adds an organization straight into a lifecycle column, but not into Churn', async () => {
    stubPortfolio();
    const { onAdd } = renderBoard('include_churned=1');
    await userEvent.click(within(column('kickoff')).getByRole('button', { name: 'Add organization to Kickoff' }));
    expect(onAdd).toHaveBeenCalledWith('kickoff');
    expect(screen.getAllByRole('button', { name: /^Add organization to/ })).toHaveLength(7);
    expect(within(column('churn')).queryByRole('button', { name: /^Add organization/ })).not.toBeInTheDocument();
  });

  it('marks the open card', async () => {
    stubPortfolio();
    renderBoard('', { openId: 7 });
    expect(await within(column('live')).findByRole('button', { name: 'Close Pizza Hut' })).toHaveAttribute('aria-expanded', 'true');
  });

  describe('phones', () => {
    it('lays columns out as snapping panels with a strip of column tabs', async () => {
      stubPortfolio();
      renderBoard('', { isSm: false });
      const tabs = screen.getByRole('navigation', { name: 'Board columns' });
      expect(within(tabs).getAllByRole('button').map((button) => button.textContent)).toEqual([
        'Onboarding 0', 'Kickoff 0', 'Adoption 1', 'Live 1', 'Renewal 0', 'Churn', 'Expansion 0', 'Other 0',
      ]);
      expect(within(tabs).getByRole('button', { name: 'Onboarding 0' })).toHaveAttribute('aria-current', 'true');
      expect(column('live')).toHaveClass('w-full', 'snap-start');
      expect(within(column('live')).getByRole('button', { name: 'Add organization to Live' })).toHaveClass('min-h-11');
      expect(within(column('churn')).getByText('Use a card’s Move to… menu to churn it.')).toBeInTheDocument();
      await within(column('live')).findByRole('link', { name: 'Pizza Hut' });
      expect(card(7)).toHaveAttribute('draggable', 'false');
    });

    it('jumps to a column from its tab and follows a swipe', async () => {
      stubPortfolio();
      renderBoard('', { isSm: false });
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      const tabs = screen.getByRole('navigation', { name: 'Board columns' });
      await userEvent.click(within(tabs).getByRole('button', { name: 'Live 1' }));
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      expect(scrollIntoView.mock.contexts[0]).toBe(column('live'));
      expect(within(tabs).getByRole('button', { name: 'Live 1' })).toHaveAttribute('aria-current', 'true');

      const panels = document.querySelector('[data-part="panels"]') as HTMLElement;
      Object.defineProperty(panels, 'clientWidth', { configurable: true, value: 375 });
      Object.defineProperty(panels, 'scrollLeft', { configurable: true, value: 2 * (375 + 12) });
      fireEvent.scroll(panels);
      expect(within(tabs).getByRole('button', { name: 'Adoption 1' })).toHaveAttribute('aria-current', 'true');
    });

    it('has no tabs from sm', () => {
      stubPortfolio();
      renderBoard();
      expect(screen.queryByRole('navigation', { name: 'Board columns' })).not.toBeInTheDocument();
      expect(column('live')).toHaveClass('w-72');
    });
  });

  describe('states', () => {
    it('shows the frame error with Try again', async () => {
      stubPortfolio();
      const { portfolio } = renderBoard('', { frame: { data: null, error: 'Could not load organizations.' } });
      expect(screen.getByText('Could not load organizations.')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(portfolio.retry).toHaveBeenCalled();
    });

    it('shows a board-shaped skeleton while the frame loads', () => {
      stubPortfolio();
      renderBoard('', { frame: { data: null, loading: true } });
      expect(screen.getByRole('status', { name: 'Loading the board' })).toBeInTheDocument();
    });

    it('offers Clear filters when nothing matches', async () => {
      stubPortfolio({ portfolio: (q) => buildPortfolio(q, []) });
      const filtered = renderBoard('owner=9', { rows: [], filtered: true });
      expect(screen.getByText('No organizations match these filters')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
      expect(filtered.onClearFilters).toHaveBeenCalled();
    });

    it('offers Add organization for an empty book', async () => {
      stubPortfolio({ portfolio: (q) => buildPortfolio(q, []) });
      const empty = renderBoard('', { rows: [] });
      expect(screen.getByText('No organizations yet')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Add organization' }));
      expect(empty.onAdd).toHaveBeenCalledWith();
    });
  });
});
