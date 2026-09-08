import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import authReducer from '../../features/auth/authSlice';
import { Board } from './Board';
import { ALL_CAPABILITIES } from '../../test/capabilities';

// Integration tier (see the `testing` skill): real store + real router
// context (cards navigate on click), network mocked at the fetch
// boundary with responses shaped exactly like revenact-backend's real
// paginated envelope — see List.test.tsx's own `globex` fixture, which
// this mirrors.
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
  currency: 'USD' as const,
  currency_display: 'US Dollar ($)',
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
  is_archived: false,
};

const initech = { ...globex, id: 2, name: 'Initech', lifecycle_stage: 'onboarding' as const };

function renderPage() {
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
      <MemoryRouter initialEntries={['/organizations/board']}>
        <Routes>
          <Route path="/organizations/board" element={<Board />} />
          <Route path="/organizations/:id" element={<div>ORG PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

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

// Same reasoning as List.test.tsx's own: MetricsPanel independently
// fetches renewals/stats in parallel with the board's own customers
// fetch, so every mock needs to answer those explicitly.
function makeFetchMock({ customers }: { customers: Array<{ status: number; body: unknown }> }) {
  const queue = [...customers];
  return vi.fn((url: string) => {
    if (url.includes('/customers/stats/')) return Promise.resolve(jsonResponse(200, ZERO_STATS));
    if (url.includes('renewal_within')) {
      return Promise.resolve(jsonResponse(200, { count: 0, next: null, previous: null, results: [] }));
    }
    // OrganizationFormModal fetches this for its own Owner dropdown.
    if (url.includes('/auth/members/')) return Promise.resolve(jsonResponse(200, []));
    const next = queue.length > 1 ? queue.shift()! : queue[0];
    return Promise.resolve(jsonResponse(next.status, next.body));
  });
}

describe('Organizations Board page', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the real paginated endpoint and groups organizations by lifecycle stage', async () => {
    const fetchMock = makeFetchMock({
      customers: [
        { status: 200, body: { count: 2, next: null, previous: null, results: [globex, initech] } },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('Globex Corp')).toBeInTheDocument();
    expect(screen.getByText('Initech')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/customers/'), expect.anything());
    // Live and Onboarding columns each show their own count.
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
  });

  it('shows the backend error message when the fetch fails', async () => {
    const fetchMock = makeFetchMock({ customers: [{ status: 500, body: { detail: 'Server error.' } }] });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('searching debounces and hits ?search=', async () => {
    const fetchMock = makeFetchMock({
      customers: [
        { status: 200, body: { count: 2, next: null, previous: null, results: [globex, initech] } },
        { status: 200, body: { count: 1, next: null, previous: null, results: [initech] } },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    expect(await screen.findByText('Globex Corp')).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText('Search by name, Revenact ID or External ID'),
      'init'
    );

    await waitFor(
      () => expect(screen.queryByText('Globex Corp')).not.toBeInTheDocument(),
      { timeout: 2000 }
    );
    expect(screen.getByText('Initech')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/v1/customers/?search=init'),
      expect.anything()
    );
  });

  it('clicking a card navigates to its Organization Details page', async () => {
    const fetchMock = makeFetchMock({
      customers: [{ status: 200, body: { count: 1, next: null, previous: null, results: [globex] } }],
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByText('Globex Corp'));

    expect(await screen.findByText('ORG PAGE')).toBeInTheDocument();
  });

  it('the Churn column has no "+" of its own — churning always goes through the dedicated modal', async () => {
    const fetchMock = makeFetchMock({
      customers: [{ status: 200, body: { count: 1, next: null, previous: null, results: [globex] } }],
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();
    await screen.findByText('Globex Corp');

    const churnHeader = screen.getByText('Churn').closest('div')!.parentElement!;
    expect(within(churnHeader).queryByRole('button')).not.toBeInTheDocument();
  });

  it('dragging a card onto Churn opens the Churn modal instead of silently PATCHing', async () => {
    const fetchMock = makeFetchMock({
      customers: [{ status: 200, body: { count: 1, next: null, previous: null, results: [globex] } }],
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();
    const card = await screen.findByText('Globex Corp');
    const churnColumn = screen.getByText('Churn').closest('div')!.parentElement!.parentElement!;

    fireEvent.dragStart(card);
    fireEvent.dragOver(churnColumn);
    fireEvent.drop(churnColumn);

    expect(await screen.findByText('Churn Globex Corp?')).toBeInTheDocument();
    // Not PATCHed yet — the modal still needs its own Confirm.
    expect(fetchMock).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ method: 'PATCH' }));
  });

  it('dragging a card to a non-Churn column PATCHes lifecycle_stage directly', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (url.includes('/customers/stats/')) return Promise.resolve(jsonResponse(200, ZERO_STATS));
      if (url.includes('renewal_within')) {
        return Promise.resolve(jsonResponse(200, { count: 0, next: null, previous: null, results: [] }));
      }
      if (method === 'PATCH' && url.endsWith('/customers/1/')) {
        const body = JSON.parse(options!.body!);
        return Promise.resolve(jsonResponse(200, { ...globex, ...body }));
      }
      return Promise.resolve(jsonResponse(200, { count: 1, next: null, previous: null, results: [globex] }));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();
    const card = await screen.findByText('Globex Corp');
    const expansionColumn = screen.getByText('Expansion').closest('div')!.parentElement!.parentElement!;

    fireEvent.dragStart(card);
    fireEvent.dragOver(expansionColumn);
    fireEvent.drop(expansionColumn);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/customers/1/'),
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ lifecycle_stage: 'expansion' }) })
      )
    );
  });

  it('a column\'s own + opens Add Organization with that column\'s stage preselected', async () => {
    const fetchMock = makeFetchMock({
      customers: [{ status: 200, body: { count: 0, next: null, previous: null, results: [] } }],
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Onboarding');

    const kickoffHeader = screen.getByText('Kickoff').closest('div')!.parentElement!;
    await user.click(within(kickoffHeader).getByRole('button'));

    expect(await screen.findByRole('heading', { name: 'Add Organization' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /lifecycle/i })).toHaveValue('kickoff');
  });

  it('adding an organization from the toolbar posts to /customers/ and shows it on the board', async () => {
    let data: unknown[] = [];
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (url.includes('/customers/stats/')) return Promise.resolve(jsonResponse(200, ZERO_STATS));
      if (url.includes('renewal_within')) {
        return Promise.resolve(jsonResponse(200, { count: 0, next: null, previous: null, results: [] }));
      }
      if (url.includes('/auth/members/')) return Promise.resolve(jsonResponse(200, []));
      if (method === 'POST' && url.endsWith('/customers/')) {
        const body = JSON.parse(options!.body!);
        const created = { ...globex, ...body, id: 99, owner: null };
        data = [...data, created];
        return Promise.resolve(jsonResponse(201, created));
      }
      return Promise.resolve(jsonResponse(200, { count: data.length, next: null, previous: null, results: data }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Onboarding');

    await user.click(screen.getByRole('button', { name: /Add Organization/ }));
    await user.type(screen.getByLabelText('Name *'), 'New Co');
    await user.click(screen.getByRole('button', { name: 'Create Organization' }));

    expect(await screen.findByText('New Co')).toBeInTheDocument();
  });
});
