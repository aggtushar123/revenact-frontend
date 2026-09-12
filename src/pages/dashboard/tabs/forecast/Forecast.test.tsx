import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import forecastReducer from '../../../../features/forecast/forecastSlice';
import { ForecastContainer } from '../ForecastContainer';
import { ControlsView } from './ControlsView';

// Integration tier: container + view + charts through the real router, with
// only the fetch boundary mocked. The bridge is Recharts and needs a sized
// container jsdom won't give it, so it is asserted on through its own headline
// figures; the range, the table and the pipeline are plain DOM.

const stats = {
  horizon_days: 365,
  bridge: {
    opening_arr: 924_700,
    churn: 175_430,
    contraction: 33_120,
    expansion: 131_880,
    forecast_arr: 848_030,
    net_change: -76_670,
    nrr: 91.7,
  },
  scenarios: { worst: 150_200, likely: 848_030, best: 1_189_900 },
  pipeline: [
    { key: 'discovery', name: 'Discovery', open: 75_600, weighted: 7_560, count: 2 },
    { key: 'negotiation', name: 'Negotiation', open: 68_400, weighted: 54_720, count: 3 },
  ],
  swing: [
    {
      id: 14,
      name: 'Uber',
      owner: 'Carl CSM',
      arr: 95_000,
      renewal_date: '2027-01-10',
      days_to_renewal: 120,
      renews_in_horizon: true,
      risk: 0.6,
      factors: [
        { label: 'Poor health', points: 0.5 },
        { label: 'No contact in 95 days', points: 0.1 },
      ],
      churn_exposure: 57_000,
      risk_exposure: 0,
      downside: 57_000,
      expansion: 13_440,
      open_pipeline: 16_800,
      net: -43_560,
      health_category: 'poor' as const,
    },
    {
      id: 9,
      name: 'Shopify',
      owner: 'Carl CSM',
      arr: 175_000,
      renewal_date: '2027-05-15',
      days_to_renewal: 600,
      renews_in_horizon: false,
      risk: 0.05,
      factors: [{ label: 'Good health', points: 0.05 }],
      churn_exposure: 0,
      risk_exposure: 8_750,
      downside: 8_750,
      expansion: 31_080,
      open_pipeline: 38_850,
      net: 22_330,
      health_category: 'good' as const,
    },
  ],
  accounts: 12,
  renewing_count: 10,
  unpriced_count: 0,
  currency: 'USD' as const,
  filters: {
    owners: [{ value: '5', name: 'Carl CSM' }],
    lifecycles: [{ value: 'live', name: 'Live' }],
    customers: [{ value: '14', name: 'Uber' }],
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
  const store = configureStore({ reducer: { forecast: forecastReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/revenue/controls']}>
        <Routes>
          <Route path="/revenue" element={<ForecastContainer />}>
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

describe('Revenue Forecast', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the forecast on mount with an explicit horizon', async () => {
    // Always sent, so the number on screen and the window it covers can never
    // come from different requests.
    const fetchMock = mockFetch();
    renderDashboard();

    await waitFor(() => expect(lastUrl(fetchMock)).toContain('/customers/forecast/'));
    expect(lastUrl(fetchMock)).toContain('horizon_days=365');
  });

  it('leads with today, the forecast, and the gap between them', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('ARR today');
    expect(within(tile('ARR today')).getByText('$924.7K')).toBeInTheDocument();
    expect(within(tile('Forecast ARR')).getByText('$848.0K')).toBeInTheDocument();
    expect(within(tile('Forecast ARR')).getByText(/-\$76\.7K against today/)).toBeInTheDocument();
  });

  it('puts net revenue retention on the screen as its own number', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('Net revenue retention');
    expect(within(tile('Net revenue retention')).getByText('91.7%')).toBeInTheDocument();
  });

  it('shows a dash rather than a fake 100% when there is nothing to divide by', async () => {
    mockFetch({
      ...stats,
      accounts: 0,
      bridge: { ...stats.bridge, opening_arr: 0, forecast_arr: 0, net_change: 0, nrr: null },
    });
    renderDashboard();

    await screen.findByText('Net revenue retention');
    expect(within(tile('Net revenue retention')).getByText('—')).toBeInTheDocument();
  });

  it('draws the bridge with the net change and NRR on it', async () => {
    mockFetch();
    renderDashboard();

    expect(await screen.findByText('ARR bridge')).toBeInTheDocument();
    expect(screen.getByText('-$76.7K')).toBeInTheDocument();
    expect(screen.getByText('91.7% net revenue retention')).toBeInTheDocument();
  });

  it('presents the forecast as a range, not a single number', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('Forecast range');
    expect(screen.getByText('$150.2K')).toBeInTheDocument();
    expect(screen.getByText('$1.2M')).toBeInTheDocument();
    // And each scenario against where the book stands today.
    expect(screen.getByText('16% of today')).toBeInTheDocument();
  });

  it('ranks the swing list by how far each account moves the number', async () => {
    mockFetch();
    renderDashboard();

    const rows = (await screen.findAllByRole('row')).slice(1);

    expect(within(rows[0]).getByText('Uber')).toBeInTheDocument();
    expect(within(rows[0]).getByText('−$43,560.00')).toBeInTheDocument();
    expect(within(rows[1]).getByText('+$22,330.00')).toBeInTheDocument();
  });

  it('shows the reasons behind each risk, the same ones the Renewal tab prints', async () => {
    mockFetch();
    renderDashboard();

    // "Uber" is also an option in the Account dropdown, so this takes the
    // table's own first row.
    const row = (await screen.findAllByRole('row'))[1];

    expect(within(row).getByText('Poor health · No contact in 95 days')).toBeInTheDocument();
    expect(within(row).getByText('60%')).toBeInTheDocument();
  });

  it('shows weighted pipeline against what is actually open', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('Expansion pipeline');
    expect(screen.getByText('Negotiation')).toBeInTheDocument();
    expect(screen.getByText(/\$54\.7K of \$68\.4K · 3/)).toBeInTheDocument();
    // The totals line: what the forecast carries, of what exists.
    expect(screen.getByText('$62.3K of $144.0K')).toBeInTheDocument();
  });

  it('names accounts it had to leave out of the money', async () => {
    mockFetch({ ...stats, unpriced_count: 2 });
    renderDashboard();

    expect(
      await screen.findByText(/2 accounts excluded from every figure below/)
    ).toBeInTheDocument();
  });

  // ── the bar ───────────────────────────────────────────────────────

  it('refetches when the horizon changes', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('Horizon');
    await user.selectOptions(screen.getByLabelText('Horizon'), '90');

    await waitFor(() => expect(lastUrl(fetchMock)).toContain('horizon_days=90'));
  });

  it('refetches when a filter changes, keeping the horizon', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('Primary Owner');
    await user.selectOptions(screen.getByLabelText('Primary Owner'), '5');

    await waitFor(() => expect(lastUrl(fetchMock)).toContain('owner=5'));
    expect(lastUrl(fetchMock)).toContain('horizon_days=365');
  });

  it('clears the filters without resetting the horizon', async () => {
    // The horizon is the window being asked about, not a filter on the book.
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('Horizon');
    await user.selectOptions(screen.getByLabelText('Horizon'), '730');
    await user.selectOptions(screen.getByLabelText('Primary Owner'), '5');
    await user.click(await screen.findByRole('button', { name: 'Clear 1' }));

    await waitFor(() => expect(lastUrl(fetchMock)).not.toContain('owner='));
    expect(lastUrl(fetchMock)).toContain('horizon_days=730');
  });

  // ── failure and empty states ──────────────────────────────────────

  it('surfaces a failed fetch', async () => {
    mockFetch({ detail: 'Server exploded' }, 500);
    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Server exploded|Could not load/);
  });

  it('keeps the previous numbers when a refetch fails', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('$924.7K');

    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: false, status: 500, json: async () => ({ detail: 'Nope' }) })
    );
    await user.selectOptions(screen.getByLabelText('Primary Owner'), '5');

    await screen.findByRole('alert');
    expect(screen.getByText('$924.7K')).toBeInTheDocument();
  });

  it('says the selection is empty rather than charting nothing', async () => {
    mockFetch({
      ...stats,
      accounts: 0,
      swing: [],
      pipeline: [],
      bridge: { ...stats.bridge, opening_arr: 0, forecast_arr: 0, net_change: 0, nrr: null },
    });
    renderDashboard();

    expect(await screen.findByText('No accounts match these filters.')).toBeInTheDocument();
    expect(
      screen.getByText(/Nothing in this selection moves the forecast/)
    ).toBeInTheDocument();
    expect(screen.getByText('No open opportunities in this selection.')).toBeInTheDocument();
  });
});
