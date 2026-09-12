import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route, useLocation, useParams } from 'react-router-dom';
import customersReducer from '../../features/customers/customersSlice';
import authReducer from '../../features/auth/authSlice';
import { SurveysPage } from './SurveysPage';
import { ALL_CAPABILITIES } from '../../test/capabilities';

// Integration tier (see the `testing` skill): real store, network mocked
// at the fetch boundary — responses shaped exactly like revenact-backend's
// real SurveySerializer payloads (see docs/API_CONTRACTS.md -> customers
// -> Survey).
const sentNps = {
  id: 1,
  survey_type: 'nps',
  survey_type_display: 'NPS',
  status: 'sent',
  status_display: 'Sent',
  score: null,
  sent_at: '2026-08-01',
  responded_at: null,
  companies: [{ id: 6, name: 'Shopify' }],
  account_id: null,
  account_name: null,
  created_at: '2026-08-01T00:00:00Z',
};

const respondedCsat = {
  id: 2,
  survey_type: 'csat',
  survey_type_display: 'CSAT',
  status: 'responded',
  status_display: 'Responded',
  score: 85,
  sent_at: '2026-08-05',
  responded_at: '2026-08-07',
  companies: [{ id: 8, name: 'WeWork' }],
  account_id: null,
  account_name: null,
  created_at: '2026-08-05T00:00:00Z',
};

const EMPTY_CUSTOMERS_PAGE = { count: 0, next: null, previous: null, results: [] };

// A stand-in for OrganizationDetails — asserting the real Details page
// rendered here would drag in the whole ActivityFeed tree; this only needs
// to prove *which* route SurveysPage's row-click landed on and with what
// nav state, same as any other "does the link work" check.
function DetailsStub() {
  const { id } = useParams();
  const location = useLocation();
  const state = location.state as { activityFilter?: string } | null;
  return (
    <div>
      Organization {id} — filter: {state?.activityFilter ?? 'none'}
    </div>
  );
}

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
      <MemoryRouter initialEntries={['/surveys']}>
        <Routes>
          <Route path="/surveys" element={<SurveysPage />} />
          <Route path="/organizations/:id" element={<DetailsStub />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function makeFetchMock({
  surveys,
  customersPage = EMPTY_CUSTOMERS_PAGE,
}: {
  surveys: unknown[];
  customersPage?: unknown;
}) {
  return vi.fn((url: string, options?: { method?: string; body?: string }) => {
    const method = options?.method ?? 'GET';
    if (method === 'GET' && url.includes('/customers/') && !url.includes('/surveys/')) {
      return Promise.resolve(jsonResponse(200, customersPage));
    }
    if (method === 'GET' && url.endsWith('/surveys/')) {
      return Promise.resolve(jsonResponse(200, surveys));
    }
    return Promise.resolve(jsonResponse(200, []));
  });
}

describe('SurveysPage (/surveys)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the real, unpaginated endpoint on mount and renders the rollup cards + table', async () => {
    const fetchMock = makeFetchMock({ surveys: [sentNps, respondedCsat] });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('Shopify')).toBeInTheDocument();
    expect(screen.getByText('WeWork')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/surveys/'), expect.anything());

    // NPS card: 1 sent, no responses yet.
    expect(screen.getByText('No responses yet')).toBeInTheDocument();
    // CSAT card: 1 sent, 1 responded (100%), avg score 85.
    expect(screen.getByText('100% responded · avg 85')).toBeInTheDocument();
  });

  it('clicking a rollup card filters the table to that survey type', async () => {
    const fetchMock = makeFetchMock({ surveys: [sentNps, respondedCsat] });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Shopify');

    await user.click(screen.getByRole('button', { name: /^NPS/ }));

    expect(screen.getByText('Shopify')).toBeInTheDocument();
    expect(screen.queryByText('WeWork')).not.toBeInTheDocument();
    expect(screen.getByText('Clear filter')).toBeInTheDocument();

    await user.click(screen.getByText('Clear filter'));
    expect(screen.getByText('WeWork')).toBeInTheDocument();
  });

  it('shows the backend error instead of crashing', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith('/surveys/')) {
        return Promise.resolve(jsonResponse(500, { detail: 'Server error.' }));
      }
      return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('logging a survey posts to /surveys/ with customer_id and shows it in the table', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'GET' && url.includes('/customers/') && !url.includes('/surveys/') && !url.includes('/accounts/')) {
        return Promise.resolve(
          jsonResponse(200, { count: 1, next: null, previous: null, results: [{ id: 6, name: 'Shopify' }] })
        );
      }
      if (method === 'GET' && url.endsWith('/customers/6/accounts/')) {
        return Promise.resolve(jsonResponse(200, []));
      }
      if (method === 'POST' && url.endsWith('/surveys/')) {
        const body = JSON.parse(options!.body!);
        expect(body.customer_id).toBe(6);
        expect(body.survey_type).toBe('nps');
        return Promise.resolve(
          jsonResponse(201, {
            ...sentNps,
            id: 99,
            companies: [{ id: 6, name: 'Shopify' }],
          })
        );
      }
      if (method === 'GET' && url.endsWith('/surveys/')) {
        return Promise.resolve(jsonResponse(200, []));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('No surveys logged yet.');

    await user.click(screen.getByRole('button', { name: 'Log Survey' }));
    await user.selectOptions(screen.getByLabelText('Company *'), '6');
    const submitButton = screen
      .getAllByRole('button', { name: 'Log Survey' })
      .find((btn) => btn.closest('form'))!;
    await user.click(submitButton);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/surveys/'),
        expect.objectContaining({ method: 'POST' })
      )
    );
    expect(await screen.findByText('Shopify')).toBeInTheDocument();
  });

  it('clicking a row navigates to its Customer\'s Details page with the Surveys filter active', async () => {
    const fetchMock = makeFetchMock({ surveys: [sentNps] });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByText('Shopify'));

    expect(await screen.findByText('Organization 6 — filter: Surveys')).toBeInTheDocument();
  });

  it('editing a survey from the Actions column PATCHes it and updates the row, without navigating', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'GET' && url.includes('/customers/') && !url.includes('/surveys/')) {
        return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
      }
      if (method === 'PATCH' && url.endsWith('/surveys/1/')) {
        const body = JSON.parse(options!.body!);
        expect(body.survey_type).toBe('nps');
        expect(body.sent_at).toBe('2026-08-10');
        return Promise.resolve(jsonResponse(200, { ...sentNps, sent_at: '2026-08-10' }));
      }
      if (method === 'GET' && url.endsWith('/surveys/')) {
        return Promise.resolve(jsonResponse(200, [sentNps]));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Shopify');

    await user.click(screen.getByTitle('Edit'));
    expect(screen.getByText('Edit NPS Survey')).toBeInTheDocument();

    const sentInput = screen.getByDisplayValue('2026-08-01');
    await user.clear(sentInput);
    await user.type(sentInput, '2026-08-10');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/surveys/1/'),
        expect.objectContaining({ method: 'PATCH' })
      )
    );
    // Didn't fall through to the row-click navigation.
    expect(screen.queryByText(/Organization \d+/)).not.toBeInTheDocument();
    expect(screen.getByText('10 Aug 2026')).toBeInTheDocument();
  });

  it('marking a sent survey Expired PATCHes its status without a confirm step', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'GET' && url.includes('/customers/') && !url.includes('/surveys/')) {
        return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
      }
      if (method === 'PATCH' && url.endsWith('/surveys/1/')) {
        const body = JSON.parse(options!.body!);
        expect(body).toEqual({ status: 'expired' });
        return Promise.resolve(
          jsonResponse(200, { ...sentNps, status: 'expired', status_display: 'Expired' })
        );
      }
      if (method === 'GET' && url.endsWith('/surveys/')) {
        return Promise.resolve(jsonResponse(200, [sentNps]));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Shopify');

    await user.click(screen.getByTitle('Mark Expired'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/surveys/1/'),
        expect.objectContaining({ method: 'PATCH' })
      )
    );
    expect(await screen.findByText('Expired')).toBeInTheDocument();
  });

  it('deleting a survey via the Actions column\'s confirm dialog DELETEs it and removes the row', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'GET' && url.includes('/customers/') && !url.includes('/surveys/')) {
        return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
      }
      if (method === 'DELETE' && url.endsWith('/surveys/1/')) {
        return Promise.resolve({ ok: true, status: 204, json: async () => null });
      }
      if (method === 'GET' && url.endsWith('/surveys/')) {
        return Promise.resolve(jsonResponse(200, [sentNps]));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Shopify');

    await user.click(screen.getByTitle('Delete'));
    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/surveys/1/'),
        expect.objectContaining({ method: 'DELETE' })
      )
    );
    expect(screen.queryByText('Shopify')).not.toBeInTheDocument();
    expect(await screen.findByText('No surveys logged yet.')).toBeInTheDocument();
  });

  it('renders a placeholder when there are no responses yet, and the trend chart otherwise', async () => {
    const fetchMock = makeFetchMock({ surveys: [sentNps] });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();
    await screen.findByText('Shopify');

    expect(screen.getByText('Score Trend')).toBeInTheDocument();
    expect(screen.getByText('Not enough responses yet.')).toBeInTheDocument();
  });

  it('shows the trend chart (no placeholder) once there are responded surveys', async () => {
    const anotherMonthCsat = { ...respondedCsat, id: 3, responded_at: '2026-09-01' };
    const fetchMock = makeFetchMock({ surveys: [respondedCsat, anotherMonthCsat] });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();
    await screen.findAllByText('WeWork');

    expect(screen.getByText('Score Trend')).toBeInTheDocument();
    expect(screen.queryByText('Not enough responses yet.')).not.toBeInTheDocument();
  });
});
