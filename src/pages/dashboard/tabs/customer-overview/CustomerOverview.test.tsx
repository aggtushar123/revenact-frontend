import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import portfolioReducer from '../../../../features/portfolio/portfolioSlice';
import { CustomerOverviewContainer } from '../CustomerOverviewContainer';
import { ControlsView } from './ControlsView';

// Integration tier: container + view + charts through the real router, with
// only the fetch boundary mocked. The two Recharts charts need a sized
// container jsdom won't give them, so they're asserted on through their own
// headline text; the lists and tiles are plain DOM.

const stats = {
  kpis: {
    active: 9,
    active_arr: 688_600,
    average_arr: 76_511.11,
    churned: 4,
    churned_arr: 236_100,
    churned_12m: 3,
    churned_arr_12m: 212_100,
    logo_retention: 69.2,
    unpriced: 0,
  },
  concentration: {
    rows: [
      {
        rank: 1,
        id: 9,
        name: 'Shopify',
        arr: 175_000,
        share: 25.4,
        cumulative_share: 25.4,
        owner: 'Carl CSM',
        health_category: 'good' as const,
      },
      {
        rank: 2,
        id: 11,
        name: 'Stripe',
        arr: 112_000,
        share: 16.3,
        cumulative_share: 41.7,
        owner: 'Carl CSM',
        health_category: 'good' as const,
      },
      {
        rank: 3,
        id: 14,
        name: 'Uber',
        arr: 95_000,
        share: 13.8,
        cumulative_share: 55.5,
        owner: 'Carl CSM',
        health_category: 'poor' as const,
      },
    ],
    total_arr: 688_600,
    counted: 9,
    rest_count: 6,
    rest_arr: 306_600,
    top_three_share: 55.5,
  },
  cohorts: {
    rows: [
      { year: 2023, joined: 5, retained: 4, churned: 1, retention: 80.0 },
      { year: 2024, joined: 6, retained: 4, churned: 2, retention: 66.7 },
      { year: 2025, joined: 3, retained: 3, churned: 0, retention: 100.0 },
    ],
    undated: 1,
  },
  churn_reasons: [
    { reason: 'Budget cuts', customers: 2, arr: 212_100, spellings: 2 },
    { reason: 'Budget Cut', customers: 1, arr: 24_000, spellings: 1 },
  ],
  segments: {
    rows: [
      { key: 'under_25k', name: 'Under $25K', customers: 1, arr: 0 },
      { key: '25k_50k', name: '$25K – $50K', customers: 2, arr: 80_400 },
      { key: '50k_100k', name: '$50K – $100K', customers: 4, arr: 321_200 },
      { key: 'over_100k', name: '$100K and above', customers: 2, arr: 287_000 },
    ],
    unplaced: 0,
  },
  lifecycle: [
    { key: 'live', name: 'Live', customers: 1, arr: 67_200 },
    { key: 'renewal', name: 'Renewal', customers: 2, arr: 137_000 },
  ],
  currency: 'USD' as const,
  filters: {
    owners: [{ value: '5', name: 'Carl CSM' }],
    lifecycles: [{ value: 'live', name: 'Live' }],
    customers: [
      { value: '14', name: 'Uber' },
      { value: '21', name: 'WeWork' },
    ],
  },
};

function mockFetch(body: unknown = stats, status = 200) {
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>(() =>
    Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body })
  );
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderDashboard() {
  const store = configureStore({ reducer: { portfolio: portfolioReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/customer/controls']}>
        <Routes>
          <Route path="/customer" element={<CustomerOverviewContainer />}>
            <Route path="controls" element={<ControlsView />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return store;
}

const lastUrl = (spy: ReturnType<typeof mockFetch>) =>
  spy.mock.calls[spy.mock.calls.length - 1][0];

const tile = (label: string) => screen.getByText(label).parentElement as HTMLElement;

describe('Customer Overview', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the portfolio on mount', async () => {
    const fetchMock = mockFetch();
    renderDashboard();

    await waitFor(() => expect(lastUrl(fetchMock)).toContain('/customers/overview/'));
  });

  it('leads with how many customers there are and what they average', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('Customers');
    expect(within(tile('Customers')).getByText('9')).toBeInTheDocument();
    expect(within(tile('Customers')).getByText(/\$688\.6K · \$76\.5K average/)).toBeInTheDocument();
  });

  it('reports logo retention against every logo ever signed', async () => {
    // The figure only means something because churned customers are counted;
    // over survivors alone it would always be 100%.
    mockFetch();
    renderDashboard();

    await screen.findByText('Logo retention');
    expect(within(tile('Logo retention')).getByText('69.2%')).toBeInTheDocument();
    expect(
      within(tile('Logo retention')).getByText('4 of 13 ever signed have left')
    ).toBeInTheDocument();
  });

  it('separates churn in the last year from churn all time', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('Churned in 12 months');
    expect(within(tile('Churned in 12 months')).getByText('3')).toBeInTheDocument();
    expect(
      within(tile('Churned in 12 months')).getByText('$212.1K left · $236.1K all time')
    ).toBeInTheDocument();
  });

  it('puts concentration on its own tile and flags it when it is high', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('Top 3 concentration');
    const card = tile('Top 3 concentration');
    expect(within(card).getByText('55.5%')).toBeInTheDocument();
    expect(within(card).getByText('of ARR in the three largest accounts')).toBeInTheDocument();
  });

  it('shows a dash rather than a flattering number on an empty book', async () => {
    mockFetch({
      ...stats,
      kpis: { ...stats.kpis, active: 0, churned: 0, logo_retention: null, average_arr: null },
      concentration: { ...stats.concentration, rows: [], top_three_share: null },
    });
    renderDashboard();

    await screen.findByText('Logo retention');
    expect(within(tile('Logo retention')).getByText('—')).toBeInTheDocument();
    expect(within(tile('Top 3 concentration')).getByText('—')).toBeInTheDocument();
    expect(screen.getByText('No customers match these filters.')).toBeInTheDocument();
  });

  it('draws the concentration Pareto and names the folded tail', async () => {
    mockFetch();
    renderDashboard();

    expect(await screen.findByText('Revenue concentration')).toBeInTheDocument();
    expect(screen.getByText('top 3 = 55.5% of ARR')).toBeInTheDocument();
    expect(
      screen.getByText('6 smaller accounts hold the remaining $306.6K.')
    ).toBeInTheDocument();
  });

  it('draws cohorts and counts the undated apart', async () => {
    mockFetch();
    renderDashboard();

    expect(await screen.findByText('Cohort survival')).toBeInTheDocument();
    expect(
      screen.getByText('1 customer with no join date recorded, counted in no cohort.')
    ).toBeInTheDocument();
  });

  it('ranks churn reasons by money and admits the field is free text', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('Why they left');
    expect(screen.getByText('Budget cuts')).toBeInTheDocument();
    expect(screen.getByText(/\$212\.1K · 2/)).toBeInTheDocument();
    // The footnote is the argument for giving the field choices.
    expect(screen.getByText(/similar wordings stay separate/)).toBeInTheDocument();
    expect(screen.getByText(/1 row here already merges several spellings/)).toBeInTheDocument();
  });

  it('says so when nothing has churned', async () => {
    mockFetch({ ...stats, churn_reasons: [] });
    renderDashboard();

    expect(
      await screen.findByText('No customers in this selection have churned.')
    ).toBeInTheDocument();
  });

  it('shows composition by size and by lifecycle, with counts and money', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('By size');
    expect(screen.getByText(/\$321\.2K · 4 customers/)).toBeInTheDocument();
    expect(screen.getByText('By lifecycle stage')).toBeInTheDocument();
    expect(screen.getByText(/\$137\.0K · 2 customers/)).toBeInTheDocument();
  });

  it('names customers left out of the money figures', async () => {
    mockFetch({ ...stats, kpis: { ...stats.kpis, unpriced: 2 } });
    renderDashboard();

    expect(
      await screen.findByText(/2 customers counted in the logo figures and in none of the money/)
    ).toBeInTheDocument();
  });

  // ── the bar ───────────────────────────────────────────────────────

  it('offers churned customers in the Account filter, unlike the other dashboards', async () => {
    mockFetch();
    renderDashboard();

    const accounts = await screen.findByLabelText('Account');
    // WeWork is churned on the real book; this screen is about it.
    expect(within(accounts).getByRole('option', { name: 'WeWork' })).toBeInTheDocument();
  });

  it('refetches with a query string when a filter changes', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('Primary Owner');
    await user.selectOptions(screen.getByLabelText('Primary Owner'), '5');

    await waitFor(() => expect(lastUrl(fetchMock)).toContain('owner=5'));
  });

  it('clears the filters', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('Primary Owner');
    await user.selectOptions(screen.getByLabelText('Primary Owner'), '5');
    await user.click(await screen.findByRole('button', { name: 'Clear 1' }));

    await waitFor(() => expect(lastUrl(fetchMock)).toMatch(/\/customers\/overview\/$/));
  });

  it('surfaces a failed fetch', async () => {
    mockFetch({ detail: 'Server exploded' }, 500);
    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Server exploded|Could not load/);
  });
});
