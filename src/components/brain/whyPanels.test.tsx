import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import metricsReducer from '../../features/metrics/metricsSlice';
import { SignalsPanel } from './SignalsPanel';
import { DriversPanel } from './DriversPanel';
import { MetricLayerPanel } from './MetricLayerPanel';
import { capabilitiesForRole } from '../../test/capabilities';

const metric = (key: string, label: string, unit: 'money' | 'percent' | 'count', better: 'up' | 'down' | 'none', dimensions: string[]) => ({
  key, label, unit, better, note: 'n', dimensions, value: 1, previous: null, change: null,
});

const list = {
  as_of: '2026-09-12',
  currency: 'USD' as const,
  metrics: [
    metric('active_arr', 'ARR', 'money', 'up', ['lifecycle', 'segment']),
    metric('at_risk_arr', 'ARR at risk', 'money', 'down', ['owner', 'product']),
    metric('open_tickets', 'Open support tickets', 'count', 'down', []),
  ],
};

const signals = {
  as_of: '2026-09-12',
  baseline: '2026-08-31',
  currency: 'USD' as const,
  signals: [
    {
      ...metric('at_risk_arr', 'ARR at risk', 'money', 'down', ['owner', 'product']),
      value: 114_540, previous: { period_end: '2026-08-31', value: 80_000 }, change: 34_540, improved: false,
      drivers: [
        { dimension: 'product', dimension_label: 'Product', member: '4', label: 'Product B', value: 64_090, change: 30_000 },
        { dimension: 'owner', dimension_label: 'Owner', member: '5', label: 'Carl CSM', value: 101_940, change: 28_000 },
      ],
    },
    {
      ...metric('nrr', 'Net revenue retention', 'percent', 'up', ['owner', 'product']),
      value: 99.6, previous: { period_end: '2026-08-31', value: 92.1 }, change: 7.5, improved: true, drivers: [],
    },
  ],
};

const byProduct = {
  metric: { key: 'at_risk_arr', label: 'ARR at risk', unit: 'money' as const, better: 'down' as const, note: 'n', dimensions: ['owner', 'product'] },
  dimension: { key: 'product', label: 'Product' },
  currency: 'USD' as const,
  members: [
    { member: '4', label: 'Product B', value: 64_090, previous: { period_end: '2026-08-31', value: 34_090 }, change: 30_000 },
    { member: '1', label: 'Product A', value: 37_850, previous: null, change: null },
  ],
};
const byOwner = { ...byProduct, dimension: { key: 'owner', label: 'Owner' }, members: [{ member: '5', label: 'Carl CSM', value: 101_940, previous: null, change: null }] };

function mockApi(overrides: { signals?: unknown } = {}) {
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>((url) => {
    const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => body });
    if (url.includes('/metrics/signals/')) return ok(overrides.signals ?? signals);
    if (url.includes('/by/product/')) return ok(byProduct);
    if (url.includes('/by/owner/')) return ok(byOwner);
    return ok(list);
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderAll(role: 'admin' | 'csm' = 'admin') {
  const store = configureStore({
    reducer: { auth: authReducer, metrics: metricsReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1, email: 'alice@acme.io', name: 'Alice', avatar: '', role, role_id: 1,
          role_name: role === 'admin' ? 'Admin' : 'CSM', permissions: capabilitiesForRole(role),
          organisation: {
            id: 1, name: 'Acme Inc', slug: 'acme-inc', currency: 'USD' as const, currency_display: 'US Dollar ($)',
            default_lifecycle_stage: '', ai_agent_enabled: true, ai_agent_tone: 'professional' as const, ai_agent_tone_display: 'Professional',
          },
          is_active: true,
        },
        accessToken: 'token', refreshToken: 'refresh', isAuthenticated: true, isLoading: false, error: null,
      },
    },
  });
  render(
    <Provider store={store}>
      <SignalsPanel />
      <MetricLayerPanel />
      <DriversPanel />
    </Provider>
  );
}

describe('SignalsPanel', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('lists what moved, bad news marked as such, with the drivers named', async () => {
    mockApi();
    renderAll();

    expect(await screen.findByText('What moved since Aug end')).toBeInTheDocument();
    const panel = screen.getByRole('region', { name: 'What moved' });
    const risk = within(panel).getByText('ARR at risk').closest('li') as HTMLElement;
    expect(within(risk).getByText('+$34.5K')).toBeInTheDocument();
    expect(within(risk).getByText('+$34.5K').closest('span')).toHaveClass('text-danger');
    expect(within(risk).getByText('Product B')).toBeInTheDocument();
    expect(within(risk).getByText('+$30.0K')).toBeInTheDocument();
    const nrr = within(panel).getByText('Net revenue retention').closest('li') as HTMLElement;
    expect(within(nrr).getByText('+7.5 pts').closest('span')).toHaveClass('text-success');
  });

  it('says there is nothing to compare against before the first month-end', async () => {
    mockApi({ signals: { ...signals, baseline: null, signals: [] } });
    renderAll();

    expect(await screen.findByText(/No month-end recorded yet/)).toBeInTheDocument();
  });

  it('says so when nothing moved', async () => {
    mockApi({ signals: { ...signals, signals: [] } });
    renderAll();

    expect(await screen.findByText('Nothing has moved materially since Aug end.')).toBeInTheDocument();
  });

  it('renders nothing for someone without view-all-accounts', () => {
    const spy = mockApi();
    renderAll('csm');

    expect(screen.queryByText(/What moved/)).not.toBeInTheDocument();
    expect(spy.mock.calls.some(([url]) => url.includes('/signals/'))).toBe(false);
  });
});

describe('DriversPanel', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('offers only the metrics that have cuts, and opens on ARR at risk by its first cut', async () => {
    const spy = mockApi();
    renderAll();

    const picker = (await screen.findByLabelText('Metric')) as HTMLSelectElement;
    expect([...picker.options].map((o) => o.textContent)).toEqual(['ARR', 'ARR at risk']);
    expect(picker.value).toBe('at_risk_arr');
    await waitFor(() =>
      expect(spy.mock.calls.some(([url]) => url.includes('/metrics/at_risk_arr/by/owner/'))).toBe(true)
    );
  });

  it('draws the cut largest first with each member’s move', async () => {
    mockApi();
    const user = userEvent.setup();
    renderAll();

    await screen.findByLabelText('Metric');
    await user.click(screen.getByRole('tab', { name: 'Product' }));

    const panel = screen.getByRole('region', { name: 'What moves it' });
    const row = (await within(panel).findByText('Product B')).closest('li') as HTMLElement;
    expect(within(row).getByText('$64.1K')).toBeInTheDocument();
    expect(within(row).getByText(/\+\$30\.0K since Aug end/)).toBeInTheDocument();
    const a = within(panel).getByText('Product A').closest('li') as HTMLElement;
    expect(within(a).queryByText(/since/)).not.toBeInTheDocument();
  });

  it('switching the metric resets to its own first cut', async () => {
    const spy = mockApi();
    const user = userEvent.setup();
    renderAll();

    await screen.findByLabelText('Metric');
    await user.selectOptions(screen.getByLabelText('Metric'), 'active_arr');

    expect(screen.getByRole('tab', { name: 'Lifecycle stage' })).toHaveAttribute('aria-selected', 'true');
    await waitFor(() =>
      expect(spy.mock.calls.some(([url]) => url.includes('/metrics/active_arr/by/lifecycle/'))).toBe(true)
    );
  });
});
