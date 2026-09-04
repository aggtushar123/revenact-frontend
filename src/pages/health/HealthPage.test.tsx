import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import { HealthPage } from './HealthPage';

// Integration tier (see the `testing` skill): a real Redux store (this
// page dispatches fetchCustomerStats, same thunk MetricsPanel/
// LifecyclePage already use) plus the fetch boundary mocked — same
// convention as those tests' own.

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function customer(overrides: Record<string, unknown>) {
  return {
    id: 1,
    name: 'Globex Corp',
    address: '',
    domain: '',
    email: '',
    phone: '',
    owner: null,
    created_by: null,
    modified_by: null,
    created_at: '2026-08-31T00:00:00Z',
    updated_at: '2026-08-31T00:00:00Z',
    lifecycle_stage: 'live',
    health_score: '8.0',
    health_category: 'good',
    pulse: [],
    ai_pulse_score: 'satisfied',
    ai_pulse_reason: '',
    nps_score: 20,
    csat_score: null,
    joined_date: null,
    renewal_date: null,
    contract_start_date: null,
    contract_end_date: null,
    arr_billed_at_account: '0.00',
    arr_billed_at_hq: '0.00',
    implementation_fee: '0.00',
    total_contract_value: '0.00',
    total_forecasted_renewal_revenue: '0.00',
    primary_product: '',
    additional_products_count: null,
    top_source_channel: '',
    total_contracted_seats: null,
    total_active_seats: null,
    seat_utilization_percentage: null,
    total_hires: null,
    scope_web_app: '',
    ces_percentage: null,
    churn_date: null,
    churn_reason: '',
    churn_comment: '',
    is_archived: false,
    ...overrides,
  };
}

const STATS = {
  health: {
    good: { count: 5, mrr: 20000, arr: 240000 },
    average: { count: 2, mrr: 5000, arr: 60000 },
    poor: { count: 1, mrr: 500, arr: 6000 },
  },
  nps: { promoters: 4, passives: 1, detractors: 2, score: 25 },
  lifecycle: Object.fromEntries(
    ['onboarding', 'kickoff', 'adoption', 'live', 'renewal', 'churn', 'expansion', 'other'].map((s) => [
      s,
      { count: 0, mrr: 0, arr: 0 },
    ])
  ),
};

function renderPage() {
  const store = configureStore({ reducer: { customers: customersReducer } });
  render(
    <Provider store={store}>
      <HealthPage />
    </Provider>
  );
}

function fetchMockWith(customers: unknown[]) {
  return vi.fn((url: string) => {
    if (url.includes('/customers/stats/')) return Promise.resolve(jsonResponse(200, STATS));
    if (url.includes('/customers/')) {
      return Promise.resolve(jsonResponse(200, { count: customers.length, next: null, previous: null, results: customers }));
    }
    return Promise.resolve(jsonResponse(404, {}));
  });
}

describe('HealthPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders real per-category counts from the stats endpoint', async () => {
    vi.stubGlobal('fetch', fetchMockWith([]));
    renderPage();

    const goodCard = (await screen.findByText('Good')).closest('button')!;
    expect(within(goodCard).getByText('5')).toBeInTheDocument();

    const poorCard = screen.getByText('Poor').closest('button')!;
    expect(within(poorCard).getByText('1')).toBeInTheDocument();
  });

  it('switching to MRR shows compact money values instead of counts', async () => {
    vi.stubGlobal('fetch', fetchMockWith([]));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Good');
    await user.click(screen.getByRole('button', { name: /mrr/i }));

    const goodCard = screen.getByText('Good').closest('button')!;
    expect(within(goodCard).getByText('$20.0K')).toBeInTheDocument();
  });

  it('renders the real NPS breakdown', async () => {
    vi.stubGlobal('fetch', fetchMockWith([]));
    renderPage();

    expect(await screen.findByText('+25')).toBeInTheDocument();
    expect(screen.getByText(/4 Promoters/)).toBeInTheDocument();
    expect(screen.getByText(/2 Detractors/)).toBeInTheDocument();
  });

  it('renders real AI Pulse counts derived from the fetched organizations', async () => {
    const customers = [
      customer({ id: 1, name: 'Globex', ai_pulse_score: 'satisfied' }),
      customer({ id: 2, name: 'Initech', ai_pulse_score: 'high_risk' }),
    ];
    vi.stubGlobal('fetch', fetchMockWith(customers));
    renderPage();

    expect(await screen.findByText('Satisfied · 1')).toBeInTheDocument();
    expect(screen.getByText('High Risk · 1')).toBeInTheDocument();
    expect(screen.getByText('Very Satisfied · 0')).toBeInTheDocument();
  });

  it('clicking a health category filters the organization table to just that category', async () => {
    const customers = [
      customer({ id: 1, name: 'Globex', health_category: 'good' }),
      customer({ id: 2, name: 'Initech', health_category: 'poor' }),
    ];
    vi.stubGlobal('fetch', fetchMockWith(customers));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Globex');
    expect(screen.getByText('Initech')).toBeInTheDocument();

    const poorCard = screen.getAllByText('Poor').map((el) => el.closest('button')).find(Boolean)!;
    await user.click(poorCard);

    expect(screen.getByText('Initech')).toBeInTheDocument();
    expect(screen.queryByText('Globex')).not.toBeInTheDocument();

    await user.click(screen.getByText('Clear filter'));
    expect(await screen.findByText('Globex')).toBeInTheDocument();
  });

  it('surfaces a stats fetch failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/customers/stats/')) return Promise.resolve(jsonResponse(500, { detail: 'Server error.' }));
        return Promise.resolve(jsonResponse(200, { count: 0, next: null, previous: null, results: [] }));
      })
    );
    renderPage();

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });
});
