import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import { MetricsPanel } from './MetricsPanel';

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
};

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function makeFetchMock(responsesByWindow: Record<number, unknown>) {
  return vi.fn((url: string) => {
    const match = /renewal_within=(\d+)/.exec(url);
    const days = match ? Number(match[1]) : null;
    const body = (days !== null && responsesByWindow[days]) || { count: 0, next: null, previous: null, results: [] };
    return Promise.resolve(jsonResponse(200, body));
  });
}

function renderPanel() {
  const store = configureStore({ reducer: { customers: customersReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/organizations']}>
        <Routes>
          <Route path="/organizations" element={<MetricsPanel totalCount={5} />} />
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
