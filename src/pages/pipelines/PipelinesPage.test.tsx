import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import authReducer from '../../features/auth/authSlice';
import { PipelinesPage } from './PipelinesPage';
import { ALL_CAPABILITIES } from '../../test/capabilities';

// Integration tier (see the `testing` skill): real store, network mocked
// at the fetch boundary — responses shaped exactly like revenact-backend's
// real OpportunitySerializer payloads (see docs/API_CONTRACTS.md ->
// customers -> Opportunity).
const discoveryOpp = {
  id: 1,
  title: 'Digital First Account Expansion',
  mrr: '18500.00',
  stage: 'discovery',
  stage_display: 'Discovery',
  priority: 'low',
  priority_display: 'Low',
  companies: [{ id: 6, name: 'Shopify' }],
  account_name: null,
};

const negotiationOpp = {
  ...discoveryOpp,
  id: 2,
  title: 'Payments API Upsell',
  stage: 'negotiation',
  stage_display: 'Negotiation',
  companies: [{ id: 6, name: 'Stripe' }],
};

// Same reasoning, shaped exactly like revenact-backend's real
// RiskSerializer payloads (see docs/API_CONTRACTS.md -> customers -> Risk).
const openRisk = {
  id: 1,
  title: 'Renewal Risk — Contract Expiry',
  mrr: '8500.00',
  stage: 'open',
  stage_display: 'Open',
  priority: 'high',
  priority_display: 'High',
  companies: [{ id: 8, name: 'WeWork' }],
  account_name: null,
};

const mitigatedRisk = {
  ...openRisk,
  id: 2,
  title: 'Budget Freeze Risk',
  stage: 'mitigated',
  stage_display: 'Mitigated',
  companies: [{ id: 8, name: 'Oracle' }],
};

const EMPTY_CUSTOMERS_PAGE = { count: 0, next: null, previous: null, results: [] };

function renderPage(view: 'board' | 'list' = 'board') {
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
      <PipelinesPage view={view} />
    </Provider>
  );
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function makeFetchMock({
  opportunities,
  customersPage = EMPTY_CUSTOMERS_PAGE,
}: {
  opportunities: unknown[];
  customersPage?: unknown;
}) {
  return vi.fn((url: string, options?: { method?: string; body?: string }) => {
    const method = options?.method ?? 'GET';
    if (method === 'GET' && url.includes('/customers/') && !url.includes('/opportunities/')) {
      return Promise.resolve(jsonResponse(200, customersPage));
    }
    if (method === 'GET' && url.endsWith('/opportunities/')) {
      return Promise.resolve(jsonResponse(200, opportunities));
    }
    return Promise.resolve(jsonResponse(200, []));
  });
}

function makeRiskFetchMock({
  risks,
  customersPage = EMPTY_CUSTOMERS_PAGE,
}: {
  risks: unknown[];
  customersPage?: unknown;
}) {
  return vi.fn((url: string, options?: { method?: string; body?: string }) => {
    const method = options?.method ?? 'GET';
    if (method === 'GET' && url.includes('/customers/') && !url.includes('/risks/')) {
      return Promise.resolve(jsonResponse(200, customersPage));
    }
    if (method === 'GET' && url.endsWith('/risks/')) {
      return Promise.resolve(jsonResponse(200, risks));
    }
    return Promise.resolve(jsonResponse(200, []));
  });
}

describe('Pipelines board — Opportunities tab', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the real, unpaginated endpoint on mount and renders cards in the right columns', async () => {
    const fetchMock = makeFetchMock({ opportunities: [discoveryOpp, negotiationOpp] });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('Digital First Account Expansion')).toBeInTheDocument();
    expect(screen.getByText('Payments API Upsell')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/opportunities/'), expect.anything());
    // Real per-column counts (1 each), not the old mock's hardcoded ones.
    expect(screen.getByText('Discovery')).toBeInTheDocument();
    expect(screen.getAllByText('(1)', { exact: true })).toHaveLength(2);
  });

  it('the overview banner\'s MRR toggle sums MRR across every opportunity and risk', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith('/opportunities/')) {
        return Promise.resolve(jsonResponse(200, [discoveryOpp, negotiationOpp]));
      }
      if (url.endsWith('/risks/')) {
        return Promise.resolve(jsonResponse(200, [openRisk, mitigatedRisk]));
      }
      return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();
    await screen.findByText('Digital First Account Expansion');

    // COUNT is the default — the banner's own Opportunities/Risks
    // counts, not their $18500.00-a-piece MRR.
    expect(screen.getAllByText('2', { exact: true })).toHaveLength(2);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'MRR' }));

    // discoveryOpp + negotiationOpp = 18500 + 18500; openRisk +
    // mitigatedRisk = 8500 + 8500 — summed, not just the first card's.
    expect(screen.getByText('$37,000.00')).toBeInTheDocument();
    expect(screen.getByText('$17,000.00')).toBeInTheDocument();
  });

  it('shows the backend error instead of crashing', async () => {
    const fetchMock = makeFetchMock({ opportunities: [] });
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/opportunities/')) {
        return Promise.resolve(jsonResponse(500, { detail: 'Server error.' }));
      }
      if (url.endsWith('/risks/')) {
        return Promise.resolve(jsonResponse(200, []));
      }
      return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('searching filters cards by title client-side', async () => {
    const fetchMock = makeFetchMock({ opportunities: [discoveryOpp, negotiationOpp] });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Digital First Account Expansion');

    await user.type(screen.getByPlaceholderText('Search opportunities by title'), 'Payments');

    expect(screen.queryByText('Digital First Account Expansion')).not.toBeInTheDocument();
    expect(screen.getByText('Payments API Upsell')).toBeInTheDocument();
  });

  it('the list view renders the same real data in a table', async () => {
    const fetchMock = makeFetchMock({ opportunities: [discoveryOpp] });
    vi.stubGlobal('fetch', fetchMock);

    renderPage('list');

    expect(await screen.findByText('Digital First Account Expansion')).toBeInTheDocument();
    expect(screen.getByText('$18,500.00')).toBeInTheDocument();
  });

  it('adding an opportunity posts to /opportunities/ with customer_id and shows it on the board', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'GET' && url.includes('/customers/') && !url.includes('/opportunities/')) {
        return Promise.resolve(
          jsonResponse(200, { count: 1, next: null, previous: null, results: [{ id: 6, name: 'Shopify' }] })
        );
      }
      if (method === 'GET' && url.endsWith('/customers/6/accounts/')) {
        return Promise.resolve(jsonResponse(200, []));
      }
      if (method === 'POST' && url.endsWith('/opportunities/')) {
        const body = JSON.parse(options!.body!);
        expect(body.customer_id).toBe(6);
        return Promise.resolve(jsonResponse(201, { ...discoveryOpp, id: 99, title: 'New Opp' }));
      }
      if (method === 'GET' && url.endsWith('/opportunities/')) {
        return Promise.resolve(jsonResponse(200, []));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Discovery');

    await user.click(screen.getByRole('button', { name: 'Add Opportunity' }));
    await user.type(screen.getByLabelText('Title *'), 'New Opp');
    await user.selectOptions(screen.getByLabelText('Company *'), '6');
    const submitButton = screen
      .getAllByRole('button', { name: 'Add Opportunity' })
      .find((btn) => btn.closest('form'))!;
    await user.click(submitButton);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/opportunities/'),
        expect.objectContaining({ method: 'POST' })
      )
    );
    expect(await screen.findByText('New Opp')).toBeInTheDocument();
  });

  it('editing an opportunity PATCHes /api/v1/opportunities/<id>/ and updates it in place', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'GET' && url.includes('/customers/') && !url.includes('/opportunities/')) {
        return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
      }
      if (method === 'PATCH' && url.endsWith('/opportunities/1/')) {
        const body = JSON.parse(options!.body!);
        return Promise.resolve(jsonResponse(200, { ...discoveryOpp, ...body }));
      }
      if (method === 'GET' && url.endsWith('/opportunities/')) {
        return Promise.resolve(jsonResponse(200, [discoveryOpp]));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByText('Digital First Account Expansion'));

    const titleInput = screen.getByLabelText('Title *');
    await user.clear(titleInput);
    await user.type(titleInput, 'Renamed Opportunity');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/opportunities/1/'),
        expect.objectContaining({ method: 'PATCH' })
      )
    );
    expect(await screen.findByText('Renamed Opportunity')).toBeInTheDocument();
  });

  it('deleting an opportunity from its edit modal DELETEs /api/v1/opportunities/<id>/ and removes the card', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'GET' && url.includes('/customers/') && !url.includes('/opportunities/')) {
        return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
      }
      if (method === 'DELETE' && url.endsWith('/opportunities/1/')) {
        return Promise.resolve({ ok: true, status: 204, json: async () => null });
      }
      if (method === 'GET' && url.endsWith('/opportunities/')) {
        return Promise.resolve(jsonResponse(200, [discoveryOpp]));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByText('Digital First Account Expansion'));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/opportunities/1/'),
        expect.objectContaining({ method: 'DELETE' })
      )
    );
    expect(screen.queryByText('Digital First Account Expansion')).not.toBeInTheDocument();
  });

  it('dragging a card to another column PATCHes its stage', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'GET' && url.includes('/customers/') && !url.includes('/opportunities/')) {
        return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
      }
      if (method === 'PATCH' && url.endsWith('/opportunities/1/')) {
        const body = JSON.parse(options!.body!);
        return Promise.resolve(jsonResponse(200, { ...discoveryOpp, ...body, stage_display: 'Negotiation' }));
      }
      if (method === 'GET' && url.endsWith('/opportunities/')) {
        return Promise.resolve(jsonResponse(200, [discoveryOpp]));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();
    const card = await screen.findByText('Digital First Account Expansion');
    const negotiationColumn = screen.getByText('Negotiation').closest('div')!.parentElement!.parentElement!;

    fireEvent.dragStart(card);
    fireEvent.dragOver(negotiationColumn);
    fireEvent.drop(negotiationColumn);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/opportunities/1/'),
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ stage: 'negotiation' }) })
      )
    );
  });
});

describe('Pipelines board — Risks tab', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the real, unpaginated endpoint on mount and renders cards in the right columns', async () => {
    const fetchMock = makeRiskFetchMock({ risks: [openRisk, mitigatedRisk] });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Risks' }));

    expect(await screen.findByText('Renewal Risk — Contract Expiry')).toBeInTheDocument();
    expect(screen.getByText('Budget Freeze Risk')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/risks/'), expect.anything());
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getAllByText('(1)', { exact: true })).toHaveLength(2);
  });

  it('shows the backend error instead of crashing', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith('/risks/')) {
        return Promise.resolve(jsonResponse(500, { detail: 'Server error.' }));
      }
      // The Opportunities tab (the default one, still mounted underneath
      // until the click below switches away from it) needs its own real
      // array here too, not EMPTY_CUSTOMERS_PAGE's object shape.
      if (url.endsWith('/opportunities/')) {
        return Promise.resolve(jsonResponse(200, []));
      }
      return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Risks' }));

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('searching filters cards by title client-side', async () => {
    const fetchMock = makeRiskFetchMock({ risks: [openRisk, mitigatedRisk] });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Risks' }));
    await screen.findByText('Renewal Risk — Contract Expiry');

    await user.type(screen.getByPlaceholderText('Search risks by title'), 'Budget');

    expect(screen.queryByText('Renewal Risk — Contract Expiry')).not.toBeInTheDocument();
    expect(screen.getByText('Budget Freeze Risk')).toBeInTheDocument();
  });

  it('the list view renders the same real data in a table', async () => {
    const fetchMock = makeRiskFetchMock({ risks: [openRisk] });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage('list');
    await user.click(screen.getByRole('button', { name: 'Risks' }));

    expect(await screen.findByText('Renewal Risk — Contract Expiry')).toBeInTheDocument();
    expect(screen.getByText('$8,500.00')).toBeInTheDocument();
  });

  it('adding a risk posts to /risks/ with customer_id and shows it on the board', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'GET' && url.includes('/customers/') && !url.includes('/risks/')) {
        return Promise.resolve(
          jsonResponse(200, { count: 1, next: null, previous: null, results: [{ id: 8, name: 'WeWork' }] })
        );
      }
      if (method === 'GET' && url.endsWith('/customers/8/accounts/')) {
        return Promise.resolve(jsonResponse(200, []));
      }
      if (method === 'POST' && url.endsWith('/risks/')) {
        const body = JSON.parse(options!.body!);
        expect(body.customer_id).toBe(8);
        return Promise.resolve(jsonResponse(201, { ...openRisk, id: 99, title: 'New Risk' }));
      }
      if (method === 'GET' && url.endsWith('/risks/')) {
        return Promise.resolve(jsonResponse(200, []));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Risks' }));
    await screen.findByText('Open');

    await user.click(screen.getByRole('button', { name: 'Add Risk' }));
    await user.type(screen.getByLabelText('Title *'), 'New Risk');
    await user.selectOptions(screen.getByLabelText('Company *'), '8');
    const submitButton = screen
      .getAllByRole('button', { name: 'Add Risk' })
      .find((btn) => btn.closest('form'))!;
    await user.click(submitButton);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/risks/'),
        expect.objectContaining({ method: 'POST' })
      )
    );
    expect(await screen.findByText('New Risk')).toBeInTheDocument();
  });

  it('editing a risk PATCHes /api/v1/risks/<id>/ and updates it in place', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'GET' && url.includes('/customers/') && !url.includes('/risks/')) {
        return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
      }
      if (method === 'PATCH' && url.endsWith('/risks/1/')) {
        const body = JSON.parse(options!.body!);
        return Promise.resolve(jsonResponse(200, { ...openRisk, ...body }));
      }
      if (method === 'GET' && url.endsWith('/risks/')) {
        return Promise.resolve(jsonResponse(200, [openRisk]));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Risks' }));
    await user.click(await screen.findByText('Renewal Risk — Contract Expiry'));

    const titleInput = screen.getByLabelText('Title *');
    await user.clear(titleInput);
    await user.type(titleInput, 'Renamed Risk');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/risks/1/'),
        expect.objectContaining({ method: 'PATCH' })
      )
    );
    expect(await screen.findByText('Renamed Risk')).toBeInTheDocument();
  });

  it('deleting a risk from its edit modal DELETEs /api/v1/risks/<id>/ and removes the card', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'GET' && url.includes('/customers/') && !url.includes('/risks/')) {
        return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
      }
      if (method === 'DELETE' && url.endsWith('/risks/1/')) {
        return Promise.resolve({ ok: true, status: 204, json: async () => null });
      }
      if (method === 'GET' && url.endsWith('/risks/')) {
        return Promise.resolve(jsonResponse(200, [openRisk]));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Risks' }));
    await user.click(await screen.findByText('Renewal Risk — Contract Expiry'));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/risks/1/'),
        expect.objectContaining({ method: 'DELETE' })
      )
    );
    expect(screen.queryByText('Renewal Risk — Contract Expiry')).not.toBeInTheDocument();
  });

  it('dragging a card to another column PATCHes its stage', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'GET' && url.includes('/customers/') && !url.includes('/risks/')) {
        return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
      }
      if (method === 'PATCH' && url.endsWith('/risks/1/')) {
        const body = JSON.parse(options!.body!);
        return Promise.resolve(jsonResponse(200, { ...openRisk, ...body, stage_display: 'Mitigated' }));
      }
      if (method === 'GET' && url.endsWith('/risks/')) {
        return Promise.resolve(jsonResponse(200, [openRisk]));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Risks' }));
    const card = await screen.findByText('Renewal Risk — Contract Expiry');
    const mitigatedColumn = screen.getByText('Mitigated').closest('div')!.parentElement!.parentElement!;

    fireEvent.dragStart(card);
    fireEvent.dragOver(mitigatedColumn);
    fireEvent.drop(mitigatedColumn);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/risks/1/'),
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ stage: 'mitigated' }) })
      )
    );
  });
});
