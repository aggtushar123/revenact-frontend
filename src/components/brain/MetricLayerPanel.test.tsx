import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import metricsReducer from '../../features/metrics/metricsSlice';
import { MetricLayerPanel } from './MetricLayerPanel';
import { capabilitiesForRole } from '../../test/capabilities';

const payload = {
  as_of: '2026-09-12',
  currency: 'USD' as const,
  metrics: [
    { key: 'active_arr', label: 'ARR', unit: 'money' as const, better: 'up' as const, note: 'n', dimensions: [], value: 688_600, previous: { period_end: '2026-08-31', value: 640_200 }, change: 48_400 },
    { key: 'at_risk_arr', label: 'ARR at risk', unit: 'money' as const, better: 'down' as const, note: 'n', dimensions: [], value: 114_540, previous: { period_end: '2026-08-31', value: 100_000 }, change: 14_540 },
    { key: 'nrr', label: 'Net revenue retention', unit: 'percent' as const, better: 'up' as const, note: 'n', dimensions: [], value: 99.6, previous: null, change: null },
    { key: 'coverage', label: 'Coverage', unit: 'percent' as const, better: 'up' as const, note: 'n', dimensions: [], value: null, previous: { period_end: '2026-08-31', value: null }, change: null },
    { key: 'open_tickets', label: 'Open support tickets', unit: 'count' as const, better: 'down' as const, note: 'n', dimensions: [], value: 280, previous: { period_end: '2026-08-31', value: 280 }, change: 0 },
    { key: 'brand_new', label: 'Something new', unit: 'count' as const, better: 'none' as const, note: 'n', dimensions: [], value: 3, previous: null, change: null },
  ],
};

function mockFetch(body: unknown = payload, status = 200) {
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>((url) =>
    String(url).includes('/explanation/')
      ? Promise.resolve({ ok: true, status: 200, json: async () => ({ explanation: null }) })
      : Promise.resolve({ ok: status < 400, status, json: async () => body })
  );
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderPanel(role: 'admin' | 'csm' = 'admin') {
  const store = configureStore({
    reducer: { auth: authReducer, metrics: metricsReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1, email: 'alice@acme.io', name: 'Alice', avatar: '', role, role_id: 1,
          role_name: role === 'admin' ? 'Admin' : 'CSM', permissions: capabilitiesForRole(role),
          function: 'cs' as const, function_display: 'Customer Success', reports_to: null,
          organisation: {
            id: 1, name: 'Acme Inc', slug: 'acme-inc', currency: 'USD' as const,
            currency_display: 'US Dollar ($)', default_lifecycle_stage: '',
            ai_agent_enabled: true, ai_agent_tone: 'professional' as const, ai_agent_tone_display: 'Professional',
          },
          is_active: true,
        },
        accessToken: 'token', refreshToken: 'refresh', isAuthenticated: true, isLoading: false, error: null,
      },
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <MetricLayerPanel />
      </MemoryRouter>
    </Provider>
  );
}

const tile = (label: string) => screen.getByText(label).closest('div.bg-surface') as HTMLElement;

describe('MetricLayerPanel', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('fetches the registry and formats each metric by its unit', async () => {
    const spy = mockFetch();
    renderPanel();

    expect(await screen.findByText('ARR')).toBeInTheDocument();
    expect(String(spy.mock.calls[0][0])).toContain('/metrics/');
    expect(within(tile('ARR')).getByText('$688.6K')).toBeInTheDocument();
    expect(within(tile('Net revenue retention')).getByText('99.6%')).toBeInTheDocument();
    expect(within(tile('Open support tickets')).getByText('280')).toBeInTheDocument();
  });

  it('reads the move since the last month-end the way the metric says is good', async () => {
    mockFetch();
    renderPanel();

    await screen.findByText('ARR');
    // ARR up is good; ARR at risk up is bad — same arrow, opposite colour.
    expect(within(tile('ARR')).getByText('+$48.4K').closest('div')).toHaveClass('text-success');
    expect(within(tile('ARR at risk')).getByText('+$14.5K').closest('div')).toHaveClass('text-danger');
    expect(within(tile('Open support tickets')).getByText('unchanged')).toBeInTheDocument();
    expect(screen.getAllByText('since Aug end').length).toBeGreaterThan(0);
  });

  it('says so when there is no history yet or a side is unmeasured', async () => {
    mockFetch();
    renderPanel();

    await screen.findByText('ARR');
    expect(within(tile('Net revenue retention')).getByText('no month-end recorded yet')).toBeInTheDocument();
    expect(within(tile('Coverage')).getByText('—')).toBeInTheDocument();
    expect(within(tile('Coverage')).getByText('unmeasured at Aug end')).toBeInTheDocument();
  });

  it('seats a metric it has never heard of under Other rather than dropping it', async () => {
    mockFetch();
    renderPanel();

    await screen.findByText('Something new');
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it("opens one explanation at a time, full width under the tile's group", async () => {
    mockFetch();
    renderPanel();

    await screen.findByText('ARR');
    await userEvent.click(screen.getByRole('button', { name: 'Why ARR' }));
    expect(await screen.findByText('Nobody has asked why yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask Claude why' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Why ARR' })).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Why Net revenue retention' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Why ARR' })).toHaveAttribute('aria-expanded', 'false'));
    expect(screen.getAllByText('Nobody has asked why yet.')).toHaveLength(1);
  });

  it('does not fetch for someone without view-all-accounts, and says why', () => {
    const spy = mockFetch();
    renderPanel('csm');

    expect(screen.getByText(/need the view-all-accounts capability/)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('surfaces a failed load', async () => {
    mockFetch({ detail: 'Server exploded' }, 500);
    renderPanel();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Server exploded|Could not load/);
  });

  it('links each group to its dashboard home', async () => {
    mockFetch();
    renderPanel();

    expect(await screen.findByRole('link', { name: /Revenue in the dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard/revenue/forecast',
    );
  });
});
