import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import { List } from './List';

// Integration tier (see the `testing` skill): real store, network mocked
// at the fetch boundary — responses shaped exactly like revenact-backend's
// real ContactSerializer/ContactStatsView payloads (see
// docs/API_CONTRACTS.md -> customers -> Contact).
const sarahChen = {
  id: 1,
  name: 'Sarah Chen',
  role: 'executive_sponsor',
  role_display: 'Executive Sponsor',
  email: 'sarah.chen@apple.com',
  phone: '+1 (408) 555-0123',
  status: 'active',
  sentiment: 'positive',
  last_contacted_at: '2026-08-31T00:00:00Z',
  company_id: 6,
  company_name: 'Apple Inc',
  account_name: null,
};

const jamesWilson = {
  ...sarahChen,
  id: 2,
  name: 'James Wilson',
  company_id: 7,
  company_name: 'Pizza Hut',
};

const ZERO_STATS = {
  total: 0,
  active: 0,
  sentiment: { positive: 0, neutral: 0, negative: 0 },
  sentiment_pct: { positive: 0, neutral: 0, negative: 0 },
  growth_30d_pct: null,
};

const EMPTY_CUSTOMERS_PAGE = { count: 0, next: null, previous: null, results: [] };

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

// `contacts` responses are consumed one per call (repeating the last once
// exhausted) — same reasoning as the Organizations List page's own
// makeFetchMock, since MetricsPanel/the company dropdown fetch stats/
// customers in parallel with the table's own contacts fetch.
function makeFetchMock({
  contacts,
  stats = ZERO_STATS,
  customersPage = EMPTY_CUSTOMERS_PAGE,
}: {
  contacts: Array<{ status: number; body: unknown }>;
  stats?: unknown;
  customersPage?: unknown;
}) {
  const queue = [...contacts];
  return vi.fn((url: string) => {
    if (typeof url === 'string' && url.includes('/contacts/stats/')) {
      return Promise.resolve(jsonResponse(200, stats));
    }
    if (typeof url === 'string' && url.includes('/customers/') && !url.includes('/contacts/')) {
      return Promise.resolve(jsonResponse(200, customersPage));
    }
    const next = queue.length > 1 ? queue.shift()! : queue[0];
    return Promise.resolve(jsonResponse(next.status, next.body));
  });
}

describe('Contacts List page (/contacts/list)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the real paginated endpoint on mount and renders the fetched contacts', async () => {
    const fetchMock = makeFetchMock({
      contacts: [{ status: 200, body: { count: 1, next: null, previous: null, results: [sarahChen] } }],
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Executive Sponsor')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/contacts/'), expect.anything());
    expect(screen.getByText('Showing 1-1 of 1 contacts')).toBeInTheDocument();
  });

  it('shows the backend error message instead of crashing', async () => {
    const fetchMock = makeFetchMock({
      contacts: [{ status: 500, body: { detail: 'Server error.' } }],
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('searching debounces and hits ?search=', async () => {
    const fetchMock = makeFetchMock({
      contacts: [
        { status: 200, body: { count: 1, next: null, previous: null, results: [sarahChen] } },
        { status: 200, body: { count: 1, next: null, previous: null, results: [jamesWilson] } },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    expect(await screen.findByText('Sarah Chen')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search contacts by name, email or role'), 'james');

    await waitFor(() => expect(screen.getByText('James Wilson')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/contacts/?search=james'),
      expect.anything()
    );
  });

  it('paging to the next page fetches the server-supplied next URL and swaps the rows', async () => {
    const fetchMock = makeFetchMock({
      contacts: [
        {
          status: 200,
          body: {
            count: 2,
            next: 'http://localhost:8000/api/v1/contacts/?page=2',
            previous: null,
            results: [sarahChen],
          },
        },
        {
          status: 200,
          body: {
            count: 2,
            next: null,
            previous: 'http://localhost:8000/api/v1/contacts/',
            results: [jamesWilson],
          },
        },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    expect(await screen.findByText('Sarah Chen')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(screen.getByText('James Wilson')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8000/api/v1/contacts/?page=2',
      expect.anything()
    );
    expect(screen.getByText('Showing 2-2 of 2 contacts')).toBeInTheDocument();
  });

  it('renders real Total/Active/Sentiment/Growth numbers from the stats endpoint', async () => {
    const fetchMock = makeFetchMock({
      contacts: [{ status: 200, body: { count: 0, next: null, previous: null, results: [] } }],
      stats: {
        total: 16,
        active: 14,
        sentiment: { positive: 9, neutral: 3, negative: 4 },
        sentiment_pct: { positive: 56, neutral: 19, negative: 25 },
        growth_30d_pct: 433.3,
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('16')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('56%')).toBeInTheDocument();
    expect(screen.getByText('+433.3%')).toBeInTheDocument();
  });

  it('shows "New" (not a fabricated 0%) for growth when nothing existed 30 days ago', async () => {
    const fetchMock = makeFetchMock({
      contacts: [{ status: 200, body: { count: 0, next: null, previous: null, results: [] } }],
      stats: ZERO_STATS,
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('New')).toBeInTheDocument();
  });
});
