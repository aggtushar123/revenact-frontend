import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import { List } from './List';

// Integration tier (see the `testing` skill): real store + real router
// context (OrganizationsTable navigates on row click), network mocked at
// the fetch boundary with responses shaped exactly like revenact-backend's
// real paginated envelope — see docs/API_CONTRACTS.md -> customers.
const globex = {
  id: 1,
  name: 'Globex Corp',
  address: 'Chicago, IL',
  domain: 'globex.com',
  owner: null,
  created_by: null,
  modified_by: null,
  created_at: '2026-08-31T00:00:00Z',
  updated_at: '2026-08-31T00:00:00Z',
  lifecycle_stage: 'live' as const,
  health_score: '8.0',
  health_category: 'good' as const,
  pulse: [1, 1, 1, 0, 0],
  ai_pulse_score: 'satisfied' as const,
  ai_pulse_reason: 'Steady usage.',
  nps_score: 40,
  csat_score: '80.00',
  joined_date: '2024-01-01',
  renewal_date: '2026-01-01',
  contract_start_date: '2024-01-01',
  contract_end_date: '2026-01-01',
  arr_billed_at_account: '60000.00',
  arr_billed_at_hq: '60000.00',
  implementation_fee: '10000.00',
  total_contract_value: '70000.00',
  total_forecasted_renewal_revenue: '73500.00',
  primary_product: 'Product A',
  additional_products_count: null,
  top_source_channel: 'Direct Sales',
  total_contracted_seats: 100,
  total_active_seats: 80,
  seat_utilization_percentage: 80,
  total_hires: 10,
  scope_web_app: 'N/A',
  ces_percentage: '90.00',
  churn_date: null,
  churn_reason: '',
  churn_comment: '',
};

const initech = { ...globex, id: 2, name: 'Initech' };

function renderPage() {
  const store = configureStore({ reducer: { customers: customersReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <List />
      </MemoryRouter>
    </Provider>
  );
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('Organizations List page', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the real paginated endpoint on mount and renders the fetched organizations', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { count: 1, next: null, previous: null, results: [globex] }));
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('Globex Corp')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/customers/'),
      expect.anything()
    );
    expect(screen.getByText('Showing 1-1 of 1 organizations')).toBeInTheDocument();
  });

  it('shows the backend error message when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(500, { detail: 'Server error.' })));

    renderPage();

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('paging to the next page fetches the server-supplied next URL and swaps the rows', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          count: 2,
          next: 'http://localhost:8000/api/v1/customers/?page=2',
          previous: null,
          results: [globex],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, { count: 2, next: null, previous: 'http://localhost:8000/api/v1/customers/', results: [initech] })
      );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    expect(await screen.findByText('Globex Corp')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() => expect(screen.getByText('Initech')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8000/api/v1/customers/?page=2',
      expect.anything()
    );
    expect(screen.getByText('Showing 2-2 of 2 organizations')).toBeInTheDocument();
  });

  it('searching debounces, hits ?search=, and resets pagination to the first page', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { count: 2, next: null, previous: null, results: [globex, initech] }))
      .mockResolvedValueOnce(jsonResponse(200, { count: 1, next: null, previous: null, results: [initech] }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    expect(await screen.findByText('Globex Corp')).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText('Search by name, Revenact ID or External ID'),
      'init'
    );

    // Typing alone shouldn't fire a request per keystroke — only after the
    // 300ms debounce settles.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await waitFor(
      () => expect(screen.queryByText('Globex Corp')).not.toBeInTheDocument(),
      { timeout: 2000 }
    );
    expect(screen.getByText('Initech')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/v1/customers/?search=init'),
      expect.anything()
    );
    expect(screen.getByText('Showing 1-1 of 1 organizations')).toBeInTheDocument();
  });
});
