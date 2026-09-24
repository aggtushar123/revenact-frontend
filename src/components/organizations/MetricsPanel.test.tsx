import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import authReducer from '../../features/auth/authSlice';
import { MetricsPanel } from './MetricsPanel';
import { ALL_CAPABILITIES } from '../../test/capabilities';

// Integration tier (see the `testing` skill): the Renewal card is the one
// part of this panel wired to real data (everything else here is still
// mock-derived — see MetricsPanel.tsx). Network mocked at the fetch
// boundary, dispatched on the URL since the component can fire more than
// one ?renewal_within= request across a test (initial mount + a window
// switch).
const globex = {
  id: 1,
  name: 'Globex Corp',
  address: '',
  domain: '',
  owner: null,
  created_by: null,
  modified_by: null,
  created_at: '2026-08-31T00:00:00Z',
  updated_at: '2026-08-31T00:00:00Z',
  lifecycle_stage: 'live' as const,
  health_score: '8.0',
  health_category: 'poor' as const,
  pulse: [],
  ai_pulse_score: '' as const,
  ai_pulse_reason: '',
  nps_score: null,
  csat_score: null,
  joined_date: null,
  // Far enough in the past to be reliably "overdue" for as long as this
  // test file exists, without needing to fake the system clock.
  renewal_date: '2020-01-01',
  contract_start_date: null,
  contract_end_date: null,
  arr_billed_at_account: '0.00',
  arr_billed_at_hq: '0.00',
  implementation_fee: '0.00',
  total_contract_value: '0.00',
  total_forecasted_renewal_revenue: '0.00',
  primary_product: null,
  primary_product_name: '',
  additional_products_count: null,
  top_source_channel: '',
  total_contracted_seats: null,
  total_active_seats: null,
  seat_utilization_percentage: null,
  total_hires: null,
  scope_web_app: '',
  ces_percentage: null,
  churn_date: null,
  churn_reason: '' as const,
  churn_reason_display: '',
  churn_comment: '',
  is_archived: false,
};

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const ZERO_STATS = {
  health: {
    good: { count: 0, mrr: 0, arr: 0 },
    average: { count: 0, mrr: 0, arr: 0 },
    poor: { count: 0, mrr: 0, arr: 0 },
  },
  nps: { promoters: 0, passives: 0, detractors: 0, score: 0 },
  lifecycle: Object.fromEntries(
    ['onboarding', 'kickoff', 'adoption', 'live', 'renewal', 'churn', 'expansion', 'other'].map((s) => [
      s,
      { count: 0, mrr: 0, arr: 0 },
    ])
  ),
};

// MetricsPanel also fires its own GET /customers/stats/ on mount (see
// fetchCustomerStats) — give it a well-shaped response rather than
// falling through to whatever the renewal_within default would be
// (RenewalPopover's own {count/next/previous/results} shape is not
// interchangeable with stats' {health/nps/lifecycle} shape).
function makeFetchMock(responsesByWindow: Record<number, unknown>) {
  return vi.fn((url: string) => {
    if (typeof url === 'string' && url.includes('/customers/stats/')) {
      return Promise.resolve(jsonResponse(200, ZERO_STATS));
    }
    const match = /renewal_within=(\d+)/.exec(url);
    const days = match ? Number(match[1]) : null;
    const body = (days !== null && responsesByWindow[days]) || { count: 0, next: null, previous: null, results: [] };
    return Promise.resolve(jsonResponse(200, body));
  });
}

function renderPanel() {
  const store = configureStore({
    reducer: { customers: customersReducer, auth: authReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1,
          email: 'alice@acme.io',
          name: 'Alice',
          avatar: '',
          role: 'admin' as const,
          role_id: 1,
          role_name: 'Admin',
          permissions: ALL_CAPABILITIES,
          function: 'cs' as const, function_display: 'Customer Success', reports_to: null,
          organisation: {
            id: 1,
            name: 'Acme Inc',
            slug: 'acme-inc',
            currency: 'USD' as const,
            currency_display: 'US Dollar ($)',
            default_lifecycle_stage: '',
            ai_agent_enabled: true,
            ai_agent_tone: 'professional' as const,
            ai_agent_tone_display: 'Professional',
          },
          is_active: true,
        },
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/organizations']}>
        <Routes>
          <Route path="/organizations" element={<MetricsPanel />} />
          <Route path="/organizations/:id" element={<div>Organization Detail Page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('MetricsPanel Renewal card', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the 1-month window on mount and shows the count', async () => {
    vi.stubGlobal('fetch', makeFetchMock({ 30: { count: 1, next: null, previous: null, results: [globex] } }));

    renderPanel();

    expect(await screen.findByText('Next 1 mo')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('1').length).toBeGreaterThan(0));
  });

  it('opens the popover on click and lists the organization with an overdue badge', async () => {
    vi.stubGlobal('fetch', makeFetchMock({ 30: { count: 1, next: null, previous: null, results: [globex] } }));
    const user = userEvent.setup();

    renderPanel();
    await screen.findByText('Next 1 mo');

    await user.click(screen.getByRole('button', { name: /View organizations renewing/ }));

    expect(await screen.findByText('Globex Corp')).toBeInTheDocument();
    expect(screen.getByText(/^Overdue by \d+ days$/)).toBeInTheDocument();
  });

  it('switching to the 3-month window refetches and updates the count without closing the popover', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchMock({
        30: { count: 1, next: null, previous: null, results: [globex] },
        90: { count: 2, next: null, previous: null, results: [globex, { ...globex, id: 2, name: 'Initech' }] },
      })
    );
    const user = userEvent.setup();

    renderPanel();
    await screen.findByText('Next 1 mo');
    await user.click(screen.getByRole('button', { name: /View organizations renewing/ }));
    await screen.findByText('Globex Corp');

    await user.click(screen.getByRole('button', { name: '3M' }));

    expect(await screen.findByText('Initech')).toBeInTheDocument();
    expect(screen.getByText('Globex Corp')).toBeInTheDocument();
    expect(screen.getByText('Next 3 mo')).toBeInTheDocument();
  });

  it('clicking an organization in the popover navigates to its detail page', async () => {
    vi.stubGlobal('fetch', makeFetchMock({ 30: { count: 1, next: null, previous: null, results: [globex] } }));
    const user = userEvent.setup();

    renderPanel();
    await screen.findByText('Next 1 mo');
    await user.click(screen.getByRole('button', { name: /View organizations renewing/ }));
    await user.click(await screen.findByText('Globex Corp'));

    expect(await screen.findByText('Organization Detail Page')).toBeInTheDocument();
  });
});

describe('MetricsPanel Health/NPS/Lifecycle sections', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders real numbers from GET /customers/stats/, not mock data', async () => {
    const customStats = {
      health: {
        good: { count: 11, mrr: 100, arr: 1200 },
        average: { count: 22, mrr: 200, arr: 2400 },
        poor: { count: 33, mrr: 300, arr: 3600 },
      },
      // Detractors is deliberately not 66 (11+22+33, the Health buckets'
      // own sum) — the "Number of Organizations" total below is also 66,
      // and a coincidental match would make getByText('66') ambiguous.
      nps: { promoters: 44, passives: 55, detractors: 68, score: 77 },
      lifecycle: {
        onboarding: { count: 1, mrr: 0, arr: 0 },
        kickoff: { count: 2, mrr: 0, arr: 0 },
        adoption: { count: 3, mrr: 0, arr: 0 },
        live: { count: 4, mrr: 0, arr: 0 },
        renewal: { count: 5, mrr: 0, arr: 0 },
        churn: { count: 6, mrr: 0, arr: 0 },
        expansion: { count: 7, mrr: 0, arr: 0 },
        other: { count: 8, mrr: 0, arr: 0 },
      },
    };
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/customers/stats/')) return Promise.resolve(jsonResponse(200, customStats));
      return Promise.resolve(jsonResponse(200, { count: 0, next: null, previous: null, results: [] }));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPanel();

    expect(await screen.findByText('11')).toBeInTheDocument(); // Health: Good
    expect(screen.getByText('22')).toBeInTheDocument(); // Health: Average
    expect(screen.getByText('33')).toBeInTheDocument(); // Health: Poor
    expect(screen.getByText('+77')).toBeInTheDocument(); // NPS score
    expect(screen.getByText('44')).toBeInTheDocument(); // NPS: Promoters
    expect(screen.getByText('55')).toBeInTheDocument(); // NPS: Passives
    expect(screen.getByText('68')).toBeInTheDocument(); // NPS: Detractors
    expect(screen.getByTitle('live: 4')).toBeInTheDocument(); // Lifecycle bar
    expect(screen.getByTitle('churn: 6')).toBeInTheDocument();
    // "Number of Organizations" — summed from the Health buckets, not a
    // prop from the table's own (possibly drill-filtered) fetch.
    expect(screen.getByTitle('Number of organizations')).toHaveTextContent('66');
  });

  it('shows an "excluded" caveat on MRR/ARR when some customers have no configured exchange rate', async () => {
    const statsWithUnconverted = {
      health: {
        good: { count: 1, mrr: 100, arr: 1200 },
        average: { count: 0, mrr: 0, arr: 0 },
        poor: { count: 0, mrr: 0, arr: 0 },
      },
      nps: { promoters: 0, passives: 0, detractors: 0, score: 0 },
      lifecycle: {
        onboarding: { count: 0, mrr: 0, arr: 0 },
        kickoff: { count: 0, mrr: 0, arr: 0 },
        adoption: { count: 0, mrr: 0, arr: 0 },
        live: { count: 1, mrr: 100, arr: 1200 },
        renewal: { count: 0, mrr: 0, arr: 0 },
        churn: { count: 0, mrr: 0, arr: 0 },
        expansion: { count: 0, mrr: 0, arr: 0 },
        other: { count: 0, mrr: 0, arr: 0 },
      },
      unconverted_count: 2,
    };
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/customers/stats/')) return Promise.resolve(jsonResponse(200, statsWithUnconverted));
      return Promise.resolve(jsonResponse(200, { count: 0, next: null, previous: null, results: [] }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPanel();
    // Health: Good count (1) and "Number of Organizations" (also 1, since
    // it's the only non-zero bucket) both render "1" — not ambiguous like
    // a single getByText('1') would be, before switching tabs.
    await waitFor(() => expect(screen.getAllByText('1').length).toBeGreaterThan(0));

    // COUNT tab (default) never shows the caveat — every customer is
    // counted regardless of whether its currency converts.
    expect(screen.queryByText(/excluded/)).not.toBeInTheDocument();

    const mrrButtons = screen.getAllByRole('button', { name: 'MRR' });
    await user.click(mrrButtons[0]); // Health section's own toggle
    expect(screen.getAllByText('2 excluded').length).toBeGreaterThan(0);

    await user.click(mrrButtons[1]); // Lifecycle Stages section's own toggle
    expect(screen.getAllByText('2 excluded').length).toBe(2);
  });

  it('shows a small error note on each section when stats fail to load, without crashing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/customers/stats/')) {
          return Promise.resolve(jsonResponse(500, { detail: 'Server error.' }));
        }
        return Promise.resolve(jsonResponse(200, { count: 0, next: null, previous: null, results: [] }));
      })
    );

    renderPanel();

    // One note each for Health, NPS, and Lifecycle Stages.
    expect(await screen.findAllByText("Couldn't load")).toHaveLength(3);
    // Falls back to zeroed sections rather than crashing.
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
