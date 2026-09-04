import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import authReducer from '../../features/auth/authSlice';
import { Board } from './Board';

// Integration tier (see the `testing` skill): real store + real router
// context (cards navigate on click), network mocked at the fetch
// boundary — responses shaped exactly like revenact-backend's real
// AccountSerializer/AccountListView payloads, mirroring List.test.tsx's
// own fixtures.
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

const emea = { ...northAmerica, id: 2, customers: [{ id: 7, name: 'Pizza Hut' }], name: 'EMEA', lifecycle_stage: 'onboarding' };

const EMPTY_CUSTOMERS_PAGE = { count: 0, next: null, previous: null, results: [] };

// Shaped like revenact-backend's real AccountStatsView response — the
// MetricsPanel's own fetch, independent of the board's own accounts
// fetch, so every mock below needs to answer it explicitly.
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
      <MemoryRouter initialEntries={['/accounts/board']}>
        <Routes>
          <Route path="/accounts/board" element={<Board />} />
          <Route path="/accounts/:id" element={<div>ACCOUNT PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function makeFetchMock({
  accounts,
  customersPage = EMPTY_CUSTOMERS_PAGE,
}: {
  accounts: Array<{ status: number; body: unknown }>;
  customersPage?: unknown;
}) {
  const queue = [...accounts];
  return vi.fn((url: string) => {
    if (url.endsWith('/accounts/stats/')) return Promise.resolve(jsonResponse(200, EMPTY_STATS));
    if (url.includes('/auth/members/')) return Promise.resolve(jsonResponse(200, []));
    if (url.includes('/customers/') && !url.includes('/accounts/')) {
      return Promise.resolve(jsonResponse(200, customersPage));
    }
    const next = queue.length > 1 ? queue.shift()! : queue[0];
    return Promise.resolve(jsonResponse(next.status, next.body));
  });
}

describe('Accounts Board page (/accounts/board)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the real paginated endpoint and groups accounts by lifecycle stage', async () => {
    const fetchMock = makeFetchMock({
      accounts: [{ status: 200, body: { count: 2, next: null, previous: null, results: [northAmerica, emea] } }],
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('North America Enterprise')).toBeInTheDocument();
    expect(screen.getByText('EMEA')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/accounts/'), expect.anything());
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
    // Multi-org label, same companyLabel() convention as the table.
    expect(screen.getByText('Apple Inc')).toBeInTheDocument();
    expect(screen.getByText('Pizza Hut')).toBeInTheDocument();
  });

  it('shows the backend error message instead of crashing', async () => {
    const fetchMock = makeFetchMock({ accounts: [{ status: 500, body: { detail: 'Server error.' } }] });
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

    await user.type(screen.getByPlaceholderText('Search accounts by name'), 'EMEA');

    await waitFor(
      () => expect(screen.queryByText('North America Enterprise')).not.toBeInTheDocument(),
      { timeout: 2000 }
    );
    expect(screen.getByText('EMEA')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/v1/accounts/?search=EMEA'),
      expect.anything()
    );
  });

  it('clicking a card navigates to its Account Details page', async () => {
    const fetchMock = makeFetchMock({
      accounts: [{ status: 200, body: { count: 1, next: null, previous: null, results: [northAmerica] } }],
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByText('North America Enterprise'));

    expect(await screen.findByText('ACCOUNT PAGE')).toBeInTheDocument();
  });

  it('a column\'s own + opens Add Account with that column\'s stage preselected', async () => {
    const fetchMock = makeFetchMock({
      accounts: [{ status: 200, body: { count: 0, next: null, previous: null, results: [] } }],
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Onboarding');

    const churnHeader = screen.getByText('Churn').closest('div')!.parentElement!;
    await user.click(within(churnHeader).getByRole('button'));

    expect(await screen.findByRole('heading', { name: 'Add Account' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /lifecycle/i })).toHaveValue('churn');
  });

  it('dragging a card to another column PATCHes lifecycle_stage', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (url.endsWith('/accounts/stats/')) return Promise.resolve(jsonResponse(200, EMPTY_STATS));
      if (url.includes('/customers/') && !url.includes('/accounts/')) {
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

    renderPage();
    const card = await screen.findByText('North America Enterprise');
    const expansionColumn = screen.getByText('Expansion').closest('div')!.parentElement!.parentElement!;

    fireEvent.dragStart(card);
    fireEvent.dragOver(expansionColumn);
    fireEvent.drop(expansionColumn);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/customers/6/accounts/1/'),
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ lifecycle_stage: 'expansion' }) })
      )
    );
  });

  it('adding an account from the toolbar posts to /customers/<id>/accounts/ and shows it on the board', async () => {
    let data: unknown[] = [];
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (url.endsWith('/accounts/stats/')) return Promise.resolve(jsonResponse(200, EMPTY_STATS));
      if (url.includes('/auth/members/')) return Promise.resolve(jsonResponse(200, []));
      if (method === 'GET' && url.includes('/customers/') && !url.includes('/accounts/')) {
        return Promise.resolve(
          jsonResponse(200, { count: 1, next: null, previous: null, results: [{ id: 6, name: 'Apple Inc' }] })
        );
      }
      if (method === 'POST' && url.endsWith('/customers/6/accounts/')) {
        const body = JSON.parse(options!.body!);
        const created = { ...northAmerica, ...body, id: 99, owner: null };
        data = [...data, created];
        return Promise.resolve(jsonResponse(201, created));
      }
      return Promise.resolve(jsonResponse(200, { count: data.length, next: null, previous: null, results: data }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Onboarding');

    await user.click(screen.getByRole('button', { name: 'Add Account' }));
    await user.selectOptions(screen.getByLabelText('Organization *'), '6');
    await user.type(screen.getByLabelText('Name *'), 'New Account');
    const submitButton = screen
      .getAllByRole('button', { name: 'Create Account' })
      .find((btn) => btn.closest('form'))!;
    await user.click(submitButton);

    expect(await screen.findByText('New Account')).toBeInTheDocument();
  });
});
