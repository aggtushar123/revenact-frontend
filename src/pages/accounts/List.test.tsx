import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import authReducer from '../../features/auth/authSlice';
import { List } from './List';
import { ALL_CAPABILITIES } from '../../test/capabilities';

// Integration tier (see the `testing` skill): real store, network mocked
// at the fetch boundary — responses shaped exactly like revenact-backend's
// real AccountSerializer/AccountListView payloads (see
// docs/API_CONTRACTS.md -> customers -> Account).
const northAmerica = {
  id: 1,
  customers: [{ id: 6, name: 'Apple Inc' }],
  name: 'North America Enterprise',
  domain: '',
  address: '',
  email: '',
  phone: '',
  owner: null,
  created_at: '2026-08-31T00:00:00Z',
  updated_at: '2026-08-31T00:00:00Z',
  lifecycle_stage: 'live',
  health_score: '9.5',
  health_category: 'good',
  pulse: [1, 1, 1, 1, 0],
  ai_pulse_score: 'very_satisfied',
  ai_pulse_reason: '',
  nps_score: 100,
  csat_score: '100.00',
  renewal_date: '2026-03-02',
  arr: '33600.00',
};

const emea = {
  ...northAmerica,
  id: 2,
  customers: [{ id: 7, name: 'Pizza Hut' }],
  name: 'EMEA',
};

const EMPTY_CUSTOMERS_PAGE = { count: 0, next: null, previous: null, results: [] };

// Shaped like revenact-backend's real AccountStatsView response (see
// docs/API_CONTRACTS.md -> GET /api/v1/accounts/stats/) — the
// MetricsPanel's own fetch, independent of the table's own accounts
// fetch, so every mock below needs to answer it explicitly rather than
// letting it fall through to a branch meant for the accounts list.
const EMPTY_STATS = {
  health: {
    good: { count: 0, mrr: 0, arr: 0 },
    average: { count: 0, mrr: 0, arr: 0 },
    poor: { count: 0, mrr: 0, arr: 0 },
  },
  nps: { promoters: 0, passives: 0, detractors: 0, score: 0 },
  lifecycle: {
    onboarding: { count: 0, mrr: 0, arr: 0 },
    kickoff: { count: 0, mrr: 0, arr: 0 },
    adoption: { count: 0, mrr: 0, arr: 0 },
    live: { count: 0, mrr: 0, arr: 0 },
    renewal: { count: 0, mrr: 0, arr: 0 },
    expansion: { count: 0, mrr: 0, arr: 0 },
    churn: { count: 0, mrr: 0, arr: 0 },
    other: { count: 0, mrr: 0, arr: 0 },
  },
};

// A route stub for each click-through destination — just enough to
// assert "navigation actually happened", not to render the real page.
function renderPage() {
  // MetricsPanel (rendered by List) now reads state.auth.user's own
  // organisation.currency for money formatting — needs the slice
  // present even for tests that don't assert on formatted amounts.
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
      <MemoryRouter initialEntries={['/accounts/list']}>
        <Routes>
          <Route path="/accounts/list" element={<List />} />
          <Route path="/organizations/:id" element={<div>ORG PAGE</div>} />
          <Route path="/accounts/:id" element={<div>ACCOUNT PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

// `accounts` responses are consumed one per call (repeating the last once
// exhausted) — same reasoning as the Contacts List page's own
// makeFetchMock, since the company dropdown fetches customers in
// parallel with the table's own accounts fetch.
function makeFetchMock({
  accounts,
  customersPage = EMPTY_CUSTOMERS_PAGE,
}: {
  accounts: Array<{ status: number; body: unknown }>;
  customersPage?: unknown;
}) {
  const queue = [...accounts];
  return vi.fn((url: string) => {
    if (typeof url === 'string' && url.endsWith('/accounts/stats/')) {
      return Promise.resolve(jsonResponse(200, EMPTY_STATS));
    }
    if (typeof url === 'string' && url.includes('/customers/') && !url.includes('/accounts/')) {
      return Promise.resolve(jsonResponse(200, customersPage));
    }
    const next = queue.length > 1 ? queue.shift()! : queue[0];
    return Promise.resolve(jsonResponse(next.status, next.body));
  });
}

describe('Accounts List page (/accounts/list)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the real paginated endpoint on mount and renders the fetched accounts', async () => {
    const fetchMock = makeFetchMock({
      accounts: [{ status: 200, body: { count: 1, next: null, previous: null, results: [northAmerica] } }],
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('North America Enterprise')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/accounts/'), expect.anything());
    expect(screen.getByText('Showing 1-1 of 1 accounts')).toBeInTheDocument();
  });

  it('shows the backend error message instead of crashing', async () => {
    const fetchMock = makeFetchMock({
      accounts: [{ status: 500, body: { detail: 'Server error.' } }],
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('searching debounces and hits ?search=', async () => {
    const fetchMock = makeFetchMock({
      accounts: [
        { status: 200, body: { count: 1, next: null, previous: null, results: [northAmerica] } },
        { status: 200, body: { count: 1, next: null, previous: null, results: [emea] } },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    expect(await screen.findByText('North America Enterprise')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search accounts by name'), 'emea');

    await waitFor(() => expect(screen.getByText('EMEA')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/accounts/?search=emea'),
      expect.anything()
    );
  });

  it('paging to the next page fetches the server-supplied next URL and swaps the rows', async () => {
    const fetchMock = makeFetchMock({
      accounts: [
        {
          status: 200,
          body: {
            count: 2,
            next: 'http://localhost:8000/api/v1/accounts/?page=2',
            previous: null,
            results: [northAmerica],
          },
        },
        {
          status: 200,
          body: {
            count: 2,
            next: null,
            previous: 'http://localhost:8000/api/v1/accounts/',
            results: [emea],
          },
        },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    expect(await screen.findByText('North America Enterprise')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(screen.getByText('EMEA')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8000/api/v1/accounts/?page=2',
      expect.anything()
    );
    expect(screen.getByText('Showing 2-2 of 2 accounts')).toBeInTheDocument();
  });

  it('clicking the organization name opens that organization\'s page', async () => {
    const fetchMock = makeFetchMock({
      accounts: [{ status: 200, body: { count: 1, next: null, previous: null, results: [northAmerica] } }],
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByText('Apple Inc'));

    expect(await screen.findByText('ORG PAGE')).toBeInTheDocument();
  });

  it('clicking the account name opens that account\'s page', async () => {
    const fetchMock = makeFetchMock({
      accounts: [{ status: 200, body: { count: 1, next: null, previous: null, results: [northAmerica] } }],
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByText('North America Enterprise'));

    expect(await screen.findByText('ACCOUNT PAGE')).toBeInTheDocument();
  });

  it('adding an account posts to /customers/<id>/accounts/ and refetches the list', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      // AccountFormModal's own owner-picker fetch.
      if (method === 'GET' && url.endsWith('/auth/members/')) {
        return Promise.resolve(jsonResponse(200, []));
      }
      if (method === 'GET' && url.endsWith('/accounts/stats/')) {
        return Promise.resolve(jsonResponse(200, EMPTY_STATS));
      }
      if (url.includes('/customers/') && !url.includes('/accounts/') && method === 'GET') {
        return Promise.resolve(
          jsonResponse(200, { count: 1, next: null, previous: null, results: [{ id: 6, name: 'Apple Inc' }] })
        );
      }
      if (method === 'POST' && url.endsWith('/customers/6/accounts/')) {
        return Promise.resolve(jsonResponse(201, { ...northAmerica, id: 99, name: 'New Account' }));
      }
      // Every GET /accounts/ (initial load, and the post-save refetch)
      // returns the same page — the second call proving a refetch
      // actually happened is what fetchMock.mock.calls asserts on below.
      return Promise.resolve(
        jsonResponse(200, { count: 1, next: null, previous: null, results: [northAmerica] })
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('North America Enterprise');
    const accountsCallsBeforeAdd = fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith('/accounts/')
    ).length;

    await user.click(screen.getByRole('button', { name: 'Add Account' }));
    await user.selectOptions(screen.getByLabelText('Organization *'), '6');
    await user.type(screen.getByLabelText('Name *'), 'New Account');
    const submitButton = screen
      .getAllByRole('button', { name: 'Create Account' })
      .find((btn) => btn.closest('form'))!;
    await user.click(submitButton);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/customers/6/accounts/'),
        expect.objectContaining({ method: 'POST' })
      )
    );
    await waitFor(() => {
      const after = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/accounts/')).length;
      expect(after).toBeGreaterThan(accountsCallsBeforeAdd);
    });
  });

  it('editing an account from its row PATCHes /customers/<id>/accounts/<id>/ and updates it in place', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'GET' && url.endsWith('/auth/members/')) {
        return Promise.resolve(jsonResponse(200, []));
      }
      if (method === 'GET' && url.endsWith('/accounts/stats/')) {
        return Promise.resolve(jsonResponse(200, EMPTY_STATS));
      }
      if (url.includes('/customers/') && !url.includes('/accounts/') && method === 'GET') {
        return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
      }
      if (method === 'PATCH' && url.endsWith('/customers/6/accounts/1/')) {
        const body = JSON.parse(options!.body!);
        return Promise.resolve(jsonResponse(200, { ...northAmerica, ...body }));
      }
      return Promise.resolve(
        jsonResponse(200, { count: 1, next: null, previous: null, results: [northAmerica] })
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('North America Enterprise');

    await user.click(screen.getByRole('button', { name: 'Edit North America Enterprise' }));
    const nameInput = await screen.findByLabelText('Name *');
    expect(nameInput).toHaveValue('North America Enterprise');
    await user.clear(nameInput);
    await user.type(nameInput, 'North America Renamed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/customers/6/accounts/1/'),
        expect.objectContaining({ method: 'PATCH' })
      )
    );
    expect(await screen.findByText('North America Renamed')).toBeInTheDocument();
  });
});
