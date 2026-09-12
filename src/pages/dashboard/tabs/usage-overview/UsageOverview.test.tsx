import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import usageReducer from '../../../../features/usage/usageSlice';
import { UsageOverviewContainer } from '../UsageOverviewContainer';
import { ControlsView } from './ControlsView';
import { niceMax } from './chartTheme';

// Integration tier: container + view + charts through the real router, with
// only the fetch boundary mocked. Recharts needs a sized container jsdom won't
// give it, so these assert on the numbers, the lists and the controls.

const account = (over = {}) => ({
  id: 1,
  name: 'Uber',
  owner: 'Carl CSM',
  lifecycle_stage: 'Live',
  health_category: 'average' as const,
  utilisation: 31.4,
  active_seats: 220,
  contracted_seats: 700,
  idle_seats: 480,
  arr: 95_000,
  shelfware_arr: 65_142,
  products: 2,
  renewal_date: '2027-03-01',
  band: 'low',
  ...over,
});

const stats = {
  kpis: {
    accounts: 12,
    contracted_seats: 8055,
    active_seats: 5228,
    utilisation: 64.9,
    idle_seats: 2827,
    shelfware_arr: 275_014.42,
    at_capacity_arr: 175_000,
    at_capacity_count: 1,
    unmeasured_count: 1,
    measured_count: 11,
    unpriced_count: 0,
  },
  bands: [
    { key: 'dormant', name: 'Dormant (<25%)', accounts: 3, arr: 135_600, idle_seats: 1141 },
    { key: 'low', name: 'Low (25–50%)', accounts: 2, arr: 184_400, idle_seats: 960 },
    { key: 'fair', name: 'Fair (50–75%)', accounts: 2, arr: 105_600, idle_seats: 405 },
    { key: 'healthy', name: 'Healthy (75–90%)', accounts: 3, arr: 324_100, idle_seats: 201 },
    { key: 'at_capacity', name: 'At capacity (90–100%)', accounts: 1, arr: 175_000, idle_seats: 120 },
    { key: 'over', name: 'Over-deployed (100%+)', accounts: 0, arr: 0, idle_seats: 0 },
  ],
  adoption: [
    { key: '0', name: 'No product recorded', accounts: 0, arr: 0 },
    { key: '1', name: '1 product', accounts: 4, arr: 277_500 },
    { key: '2', name: '2 products', accounts: 2, arr: 133_400 },
    { key: '3', name: '3 products', accounts: 4, arr: 321_200 },
    { key: '4+', name: '4+ products', accounts: 2, arr: 287_000 },
  ],
  scatter: [account(), account({ id: 2, name: 'Shopify', utilisation: 92, band: 'at_capacity' })],
  shelfware: [account()],
  at_capacity: [
    account({
      id: 2,
      name: 'Shopify',
      utilisation: 92,
      active_seats: 1380,
      contracted_seats: 1500,
      arr: 175_000,
      shelfware_arr: 0,
      band: 'at_capacity',
    }),
  ],
  currency: 'USD' as const,
  filters: {
    owners: [
      { value: '5', name: 'Carl CSM' },
      { value: 'unassigned', name: 'Unassigned' },
    ],
    lifecycles: [
      { value: 'live', name: 'Live' },
      { value: 'onboarding', name: 'Onboarding' },
    ],
    customers: [{ value: '1', name: 'Uber' }],
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
  const store = configureStore({ reducer: { usage: usageReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/usage/controls']}>
        <Routes>
          <Route path="/usage" element={<UsageOverviewContainer />}>
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

/** The stat tile carrying `label`. */
const tile = (label: string) => screen.getByText(label).parentElement as HTMLElement;

describe('Usage Overview', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches real usage on mount instead of reading a fixture', async () => {
    const fetchMock = mockFetch();
    renderDashboard();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/customers/usage/'),
        expect.objectContaining({ method: 'GET' })
      )
    );
  });

  it('leads with the book-wide utilisation and the seats behind it', async () => {
    mockFetch();
    renderDashboard();

    const card = await screen.findByText('Seat utilisation');
    expect(within(card.parentElement!).getByText('64.9%')).toBeInTheDocument();
    expect(
      within(card.parentElement!).getByText('5,228 of 8,055 seats active')
    ).toBeInTheDocument();
  });

  it('puts a number on the shelfware and on the capacity', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('Shelfware');
    expect(within(tile('Shelfware')).getByText('$275.0K')).toBeInTheDocument();
    expect(within(tile('Shelfware')).getByText(/2,827 idle seats/)).toBeInTheDocument();
    expect(within(tile('At capacity')).getByText('$175.0K')).toBeInTheDocument();
    expect(within(tile('At capacity')).getByText(/1 account is out of room/)).toBeInTheDocument();
  });

  it('says how many accounts it cannot speak for at all', async () => {
    // The whole screen is silent about these; the tile is where that is said.
    mockFetch();
    renderDashboard();

    await screen.findByText('No seat data');
    expect(within(tile('No seat data')).getByText('1')).toBeInTheDocument();
    expect(
      within(tile('No seat data')).getByText(/of 12 accounts · absent from every figure here/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no seat data and .*not counted here/i)
    ).toBeInTheDocument();
  });

  it('shows the shelfware work list ranked by money', async () => {
    mockFetch();
    renderDashboard();

    // "Uber" is also an option in the Account dropdown, so this finds the
    // one inside the work list.
    const list = (await screen.findByText('Shelfware — what to fix')).closest('div')!
      .parentElement!;
    const row = within(list).getByText('Uber').closest('tr')!;

    expect(within(row).getByText('31.4%')).toBeInTheDocument();
    expect(within(row).getByText('220 / 700')).toBeInTheDocument();
    expect(within(row).getByText('$65,142.00')).toBeInTheDocument();
  });

  it('shows the capacity list with what the account already pays', async () => {
    mockFetch();
    renderDashboard();

    const row = (await screen.findByText('Shopify')).closest('tr')!;

    expect(within(row).getByText('92%')).toBeInTheDocument();
    expect(within(row).getByText('$175,000.00')).toBeInTheDocument();
  });

  it('says so rather than drawing an empty list when there is no shelfware', async () => {
    mockFetch({ ...stats, shelfware: [], at_capacity: [] });
    renderDashboard();

    expect(
      await screen.findByText('Nothing in this selection is below 75% used.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Nobody in this selection is near their seat count.')
    ).toBeInTheDocument();
  });

  it('renders adoption breadth by ARR', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('Adoption breadth');
    expect(screen.getByText('1 product')).toBeInTheDocument();
    expect(screen.getByText(/\$287\.0K · 2 accounts/)).toBeInTheDocument();
  });

  // ── the filter bar ────────────────────────────────────────────────

  it('offers the real filter options rather than a hardcoded list', async () => {
    mockFetch();
    renderDashboard();

    const owner = await screen.findByLabelText('Primary Owner');
    expect(within(owner).getByRole('option', { name: 'Carl CSM' })).toBeInTheDocument();
    expect(within(owner).getByRole('option', { name: 'Unassigned' })).toBeInTheDocument();
    expect(
      within(screen.getByLabelText('Lifecycle Stage')).getByRole('option', { name: 'Live' })
    ).toBeInTheDocument();
  });

  it('refetches with a query string when a filter changes', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('Primary Owner');
    await user.selectOptions(screen.getByLabelText('Primary Owner'), '5');

    await waitFor(() => expect(lastUrl(fetchMock)).toContain('owner=5'));
  });

  it('sends unassigned as its own owner value', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('Primary Owner');
    await user.selectOptions(screen.getByLabelText('Primary Owner'), 'unassigned');

    await waitFor(() => expect(lastUrl(fetchMock)).toContain('owner=unassigned'));
  });

  it('counts the active filters and clears them', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('Primary Owner');
    await user.selectOptions(screen.getByLabelText('Primary Owner'), '5');
    await user.selectOptions(screen.getByLabelText('Lifecycle Stage'), 'live');

    await user.click(await screen.findByRole('button', { name: 'Clear 2' }));

    await waitFor(() => expect(lastUrl(fetchMock)).toMatch(/\/customers\/usage\/$/));
  });

  // ── failure and empty states ──────────────────────────────────────

  it('surfaces a failed fetch rather than rendering empty charts silently', async () => {
    mockFetch({ detail: 'Server exploded' }, 500);
    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Server exploded|Could not load/);
  });

  it('keeps the previous numbers when a refetch fails', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('64.9%');

    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: false, status: 500, json: async () => ({ detail: 'Nope' }) })
    );
    await user.selectOptions(screen.getByLabelText('Primary Owner'), '5');

    await screen.findByRole('alert');
    expect(screen.getByText('64.9%')).toBeInTheDocument();
  });

  it('shows a dash rather than 0% before anything has loaded', async () => {
    // "0% used" is a claim about the book; "—" is an admission that nothing
    // has loaded yet.
    mockFetch();
    renderDashboard();

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('says the selection is empty rather than charting nothing', async () => {
    mockFetch({
      ...stats,
      kpis: { ...stats.kpis, accounts: 0, unmeasured_count: 0 },
      scatter: [],
      shelfware: [],
      at_capacity: [],
    });
    renderDashboard();

    expect(await screen.findByText('No accounts match these filters.')).toBeInTheDocument();
    expect(
      screen.getByText('No account in this selection has seat data recorded.')
    ).toBeInTheDocument();
  });
});

describe('usage chartTheme', () => {
  it('niceMax rounds up past the data rather than clipping it', () => {
    expect(niceMax([324_100, 175_000])).toBe(400_000);
  });

  it('niceMax falls back rather than returning zero for an empty chart', () => {
    expect(niceMax([])).toBe(10);
  });
});
