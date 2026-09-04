import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import authReducer from '../../features/auth/authSlice';
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

const initech = { ...globex, id: 2, name: 'Initech' };

function renderPage(defaultLifecycleStage = '', currency: 'USD' | 'EUR' = 'USD') {
  // ActionBar (rendered by List) now reads state.auth.user's own
  // organisation for Global Presets' default lifecycle stage — needs
  // the slice present even for tests that don't exercise that path.
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
            currency,
            currency_display: currency === 'USD' ? 'US Dollar ($)' : 'Euro (€)',
            default_lifecycle_stage: defaultLifecycleStage,
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
      <MemoryRouter>
        <List />
      </MemoryRouter>
    </Provider>
  );
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

// MetricsPanel independently fetches upcoming renewals (?renewal_within=)
// in parallel with the table's own customers fetch, so a plain queued
// mockResolvedValueOnce sequence isn't reliable — dispatch on the URL
// instead. `customers` is consumed one response per call (repeating the
// last once exhausted); every `?renewal_within=` request gets its own
// fixed (empty, by default) response, since these tests aren't about it.
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

function makeFetchMock({
  customers,
  renewals = { count: 0, next: null, previous: null, results: [] },
  stats = ZERO_STATS,
}: {
  customers: Array<{ status: number; body: unknown }>;
  renewals?: unknown;
  stats?: unknown;
}) {
  const queue = [...customers];
  return vi.fn((url: string) => {
    if (typeof url === 'string' && url.includes('/customers/stats/')) {
      return Promise.resolve(jsonResponse(200, stats));
    }
    if (typeof url === 'string' && url.includes('renewal_within')) {
      return Promise.resolve(jsonResponse(200, renewals));
    }
    const next = queue.length > 1 ? queue.shift()! : queue[0];
    return Promise.resolve(jsonResponse(next.status, next.body));
  });
}

describe('Organizations List page', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the real paginated endpoint on mount and renders the fetched organizations', async () => {
    const fetchMock = makeFetchMock({
      customers: [{ status: 200, body: { count: 1, next: null, previous: null, results: [globex] } }],
    });
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
    const fetchMock = makeFetchMock({
      customers: [{ status: 500, body: { detail: 'Server error.' } }],
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('paging to the next page fetches the server-supplied next URL and swaps the rows', async () => {
    const fetchMock = makeFetchMock({
      customers: [
        {
          status: 200,
          body: {
            count: 2,
            next: 'http://localhost:8000/api/v1/customers/?page=2',
            previous: null,
            results: [globex],
          },
        },
        {
          status: 200,
          body: {
            count: 2,
            next: null,
            previous: 'http://localhost:8000/api/v1/customers/',
            results: [initech],
          },
        },
      ],
    });
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

    // Typing alone shouldn't fire a request per keystroke — only after the
    // 300ms debounce settles. (MetricsPanel's separate renewals fetch on
    // mount is excluded — it's unrelated to the search box.)
    const customersCalls = fetchMock.mock.calls.filter(
      ([url]) => !String(url).includes('renewal_within') && !String(url).includes('/customers/stats/')
    );
    expect(customersCalls).toHaveLength(1);

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

// A tiny in-memory "backend" for POST/PATCH so these tests exercise the
// real create/update thunks end-to-end (List -> table/ActionBar -> modal
// -> thunk -> store -> re-render), not just a canned response.
function makeMutationFetchMock(initial: (typeof globex)[]) {
  let customers = [...initial];
  let nextId = 1 + Math.max(0, ...customers.map((c) => c.id));
  return vi.fn((url: string, options?: { method?: string; body?: string }) => {
    const method = options?.method ?? 'GET';
    if (url.includes('/customers/stats/')) return Promise.resolve(jsonResponse(200, ZERO_STATS));
    if (url.includes('renewal_within')) {
      return Promise.resolve(jsonResponse(200, { count: 0, next: null, previous: null, results: [] }));
    }
    if (url.includes('/auth/members/')) return Promise.resolve(jsonResponse(200, []));

    if (method === 'POST' && url.endsWith('/customers/')) {
      const body = JSON.parse(options!.body!);
      const created = { ...globex, ...body, id: nextId++, owner: null, created_by: null, modified_by: null };
      customers = [created, ...customers];
      return Promise.resolve(jsonResponse(201, created));
    }
    const patchMatch = /\/customers\/(\d+)\/$/.exec(url);
    if (method === 'PATCH' && patchMatch) {
      const id = Number(patchMatch[1]);
      const body = JSON.parse(options!.body!);
      customers = customers.map((c) => (c.id === id ? { ...c, ...body } : c));
      return Promise.resolve(jsonResponse(200, customers.find((c) => c.id === id)));
    }
    return Promise.resolve(
      jsonResponse(200, { count: customers.length, next: null, previous: null, results: customers })
    );
  });
}

describe('Organizations List page — Add/Edit/Churn/Archive', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('adding an organization posts to /customers/ and shows it in the table', async () => {
    vi.stubGlobal('fetch', makeMutationFetchMock([]));
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('No organizations yet.');

    await user.click(screen.getByRole('button', { name: /Add Organization/ }));
    await user.type(screen.getByLabelText('Name *'), 'New Co');
    await user.click(screen.getByRole('button', { name: 'Create Organization' }));

    expect(await screen.findByText('New Co')).toBeInTheDocument();
    expect(screen.queryByText('Create Organization')).not.toBeInTheDocument(); // modal closed
  });

  it("Add Organization pre-selects Settings > Global Presets' own tenant default stage", async () => {
    vi.stubGlobal('fetch', makeMutationFetchMock([]));
    const user = userEvent.setup();

    renderPage('adoption');
    await screen.findByText('No organizations yet.');

    await user.click(screen.getByRole('button', { name: /Add Organization/ }));

    expect(await screen.findByLabelText('Lifecycle Stage')).toHaveValue('adoption');
  });

  it("Add Organization pre-selects the org's own currency (Tier 1)", async () => {
    vi.stubGlobal('fetch', makeMutationFetchMock([]));
    const user = userEvent.setup();

    renderPage('', 'EUR');
    await screen.findByText('No organizations yet.');

    await user.click(screen.getByRole('button', { name: /Add Organization/ }));

    expect(await screen.findByLabelText('Currency')).toHaveValue('EUR');
  });

  it('adding an organization sends its own chosen currency, distinct from the org default', async () => {
    const fetchMock = makeMutationFetchMock([]);
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage('', 'USD');
    await screen.findByText('No organizations yet.');

    await user.click(screen.getByRole('button', { name: /Add Organization/ }));
    await user.type(screen.getByLabelText('Name *'), 'Globex EU');
    await user.selectOptions(screen.getByLabelText('Currency'), 'EUR');
    await user.click(screen.getByRole('button', { name: 'Create Organization' }));

    await screen.findByText('Globex EU');
    const postCall = fetchMock.mock.calls.find(([, o]: [string, { method?: string }?]) => o?.method === 'POST')!;
    const body = JSON.parse((postCall[1] as { body: string }).body);
    expect(body.currency).toBe('EUR');
  });

  it('editing an organization prefills the form and PATCHes the change', async () => {
    vi.stubGlobal('fetch', makeMutationFetchMock([globex]));
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Globex Corp');

    await user.click(screen.getByRole('button', { name: 'Actions for Globex Corp' }));
    await user.click(await screen.findByRole('button', { name: 'Edit Organization' }));

    const nameInput = await screen.findByLabelText('Name *');
    expect(nameInput).toHaveValue('Globex Corp');
    await user.clear(nameInput);
    await user.type(nameInput, 'Globex Renamed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Globex Renamed')).toBeInTheDocument();
  });

  it('churning an organization sets lifecycle_stage=churn and stays visible', async () => {
    vi.stubGlobal('fetch', makeMutationFetchMock([globex]));
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Globex Corp');

    await user.click(screen.getByRole('button', { name: 'Actions for Globex Corp' }));
    await user.click(await screen.findByRole('button', { name: 'Churn Organization' }));
    await user.type(screen.getByLabelText('Reason'), 'Budget Cut');
    await user.click(screen.getByRole('button', { name: 'Confirm Churn' }));

    await waitFor(() => expect(screen.getByText('Churn')).toBeInTheDocument());
    expect(screen.getByText('Globex Corp')).toBeInTheDocument();
  });

  it('archiving an organization removes it from the list after confirming', async () => {
    vi.stubGlobal('fetch', makeMutationFetchMock([globex]));
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Globex Corp');

    await user.click(screen.getByRole('button', { name: 'Actions for Globex Corp' }));
    await user.click(await screen.findByRole('button', { name: 'Archive Organization' }));
    await user.click(await screen.findByRole('button', { name: 'Archive' }));

    await waitFor(() => expect(screen.queryByText('Globex Corp')).not.toBeInTheDocument());
    expect(screen.getByText('No organizations yet.')).toBeInTheDocument();
  });

  it("the settings gear's Edit/Archive/Churn are disabled until something is checkbox-selected", async () => {
    vi.stubGlobal('fetch', makeMutationFetchMock([globex]));
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Globex Corp');

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(await screen.findByRole('button', { name: 'Edit Organization' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Archive Organization' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Churn Organization' })).toBeDisabled();
  });

  it('checking a row and using the settings gear edits that organization', async () => {
    vi.stubGlobal('fetch', makeMutationFetchMock([globex]));
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Globex Corp');

    await user.click(screen.getByRole('checkbox', { name: 'Select Globex Corp' }));
    await user.click(screen.getByRole('button', { name: 'Actions for 1 selected organization' }));
    await user.click(await screen.findByRole('button', { name: 'Edit Organization' }));

    const nameInput = await screen.findByLabelText('Name *');
    expect(nameInput).toHaveValue('Globex Corp');
  });

  it('selecting two rows and archiving from the settings gear removes both', async () => {
    vi.stubGlobal('fetch', makeMutationFetchMock([globex, initech]));
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Globex Corp');
    await screen.findByText('Initech');

    await user.click(screen.getByRole('checkbox', { name: 'Select Globex Corp' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select Initech' }));
    await user.click(screen.getByRole('button', { name: 'Actions for 2 selected organizations' }));

    // Edit doesn't make sense for a multi-selection.
    expect(await screen.findByRole('button', { name: 'Edit Organization' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Archive Organization' }));
    expect(await screen.findByText('Archive 2 organizations?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Archive' }));

    await waitFor(() => expect(screen.queryByText('Globex Corp')).not.toBeInTheDocument());
    expect(screen.queryByText('Initech')).not.toBeInTheDocument();
  });

  it('the header checkbox selects and deselects every row on the page', async () => {
    vi.stubGlobal('fetch', makeMutationFetchMock([globex, initech]));
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Globex Corp');
    await screen.findByText('Initech');

    await user.click(screen.getByRole('checkbox', { name: 'Select all organizations on this page' }));
    expect(screen.getByRole('checkbox', { name: 'Select Globex Corp' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select Initech' })).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Select all organizations on this page' }));
    expect(screen.getByRole('checkbox', { name: 'Select Globex Corp' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select Initech' })).not.toBeChecked();
  });
});
