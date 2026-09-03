import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import { List } from './List';

// Integration tier (see the `testing` skill): real store, network mocked
// at the fetch boundary — responses shaped exactly like revenact-backend's
// real AccountSerializer/AccountListView payloads (see
// docs/API_CONTRACTS.md -> customers -> Account).
const northAmerica = {
  id: 1,
  customer: 6,
  customer_name: 'Apple Inc',
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
  customer: 7,
  customer_name: 'Pizza Hut',
  name: 'EMEA',
};

const EMPTY_CUSTOMERS_PAGE = { count: 0, next: null, previous: null, results: [] };

// A route stub for each click-through destination — just enough to
// assert "navigation actually happened", not to render the real page.
function renderPage() {
  const store = configureStore({ reducer: { customers: customersReducer } });
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

  it('renders real NPS/CSAT/MRR/ARR, not placeholders', async () => {
    const fetchMock = makeFetchMock({
      accounts: [{ status: 200, body: { count: 1, next: null, previous: null, results: [northAmerica] } }],
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();
    await screen.findByText('North America Enterprise');

    // nps_score: 100 -> "+100"; csat_score: "100.00" -> "100%";
    // arr: "33600.00" -> mrr = round(33600 / 12) = 2800 -> "$3K",
    // arr itself -> "$34K" (same $K tiering as the standalone Account
    // page's own formatArr).
    expect(screen.getByText('+100')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('$3K')).toBeInTheDocument();
    expect(screen.getByText('$34K')).toBeInTheDocument();
  });

  it('shows "0"/"N/A" (not a fabricated real-looking value) when NPS/CSAT are unset', async () => {
    const noScores = { ...northAmerica, nps_score: null, csat_score: null, arr: '0.00' };
    const fetchMock = makeFetchMock({
      accounts: [{ status: 200, body: { count: 1, next: null, previous: null, results: [noScores] } }],
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();
    await screen.findByText('North America Enterprise');

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(screen.getAllByText('$0')).toHaveLength(2); // MRR and ARR both real zeros
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
