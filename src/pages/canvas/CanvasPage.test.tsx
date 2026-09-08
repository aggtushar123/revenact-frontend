import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import customersReducer from '../../features/customers/customersSlice';
import authReducer from '../../features/auth/authSlice';
import { CanvasPage } from './CanvasPage';
import { ALL_CAPABILITIES } from '../../test/capabilities';

// Integration tier (see the `testing` skill): real store, network mocked
// at the fetch boundary — responses shaped exactly like revenact-backend's
// real CanvasSerializer payloads (see docs/API_CONTRACTS.md -> customers
// -> Canvas).
const orgCanvas = {
  id: 1,
  name: 'Renewal Strategy Q3',
  nodes: [
    { id: 'n1', type: 'contact', position: { x: 0, y: 0 }, data: { contact_id: 5 } },
    { id: 'n2', type: 'contact', position: { x: 100, y: 0 }, data: { contact_id: 6 } },
  ],
  edges: [],
  companies: [{ id: 6, name: 'Apple Inc' }],
  account_id: null,
  account_name: null,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-05T00:00:00Z',
};

const accountCanvas = {
  ...orgCanvas,
  id: 2,
  name: 'Stakeholder Map',
  nodes: [],
  companies: [{ id: 8, name: 'WeWork' }],
  account_id: 17,
  account_name: 'North America',
};

const EMPTY_CUSTOMERS_PAGE = { count: 0, next: null, previous: null, results: [] };

// A stand-in for the CanvasEditor — asserting the real editor rendered
// here would drag in the whole React Flow tree; this only needs to
// prove which route a card click landed on.
function EditorStub() {
  const { pathname } = useLocation();
  return <div>Editor at {pathname}</div>;
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
      <MemoryRouter initialEntries={['/canvas']}>
        <Routes>
          <Route path="/canvas" element={<CanvasPage />} />
          <Route path="/canvas/:id" element={<EditorStub />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function makeFetchMock({
  canvases,
  customersPage = EMPTY_CUSTOMERS_PAGE,
}: {
  canvases: unknown[];
  customersPage?: unknown;
}) {
  return vi.fn((url: string, options?: { method?: string; body?: string }) => {
    const method = options?.method ?? 'GET';
    if (method === 'GET' && url.includes('/customers/') && !url.includes('/canvases/')) {
      return Promise.resolve(jsonResponse(200, customersPage));
    }
    if (method === 'GET' && url.endsWith('/canvases/')) {
      return Promise.resolve(jsonResponse(200, canvases));
    }
    return Promise.resolve(jsonResponse(200, []));
  });
}

describe('CanvasPage (/canvas)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the real, unpaginated endpoint on mount and renders a card per canvas', async () => {
    const fetchMock = makeFetchMock({ canvases: [orgCanvas, accountCanvas] });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('Renewal Strategy Q3')).toBeInTheDocument();
    expect(screen.getByText('Stakeholder Map')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/canvases/'), expect.anything());
    expect(screen.getByText('Apple Inc')).toBeInTheDocument();
    expect(screen.getByText('WeWork • North America')).toBeInTheDocument();
    expect(screen.getByText('2 contacts')).toBeInTheDocument();
    expect(screen.getByText('0 contacts')).toBeInTheDocument();
  });

  it('shows an empty state with no canvases', async () => {
    const fetchMock = makeFetchMock({ canvases: [] });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('No canvases yet.')).toBeInTheDocument();
  });

  it('shows the backend error instead of crashing', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith('/canvases/')) {
        return Promise.resolve(jsonResponse(500, { detail: 'Server error.' }));
      }
      return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('clicking a card navigates to its own editor route', async () => {
    const fetchMock = makeFetchMock({ canvases: [orgCanvas] });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByText('Renewal Strategy Q3'));

    expect(await screen.findByText('Editor at /canvas/1')).toBeInTheDocument();
  });

  it('"New Canvas" opens a company picker that navigates to /canvas/create with the chosen company', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith('/canvases/')) {
        return Promise.resolve(jsonResponse(200, []));
      }
      if (url.includes('/customers/') && !url.includes('/accounts/')) {
        return Promise.resolve(
          jsonResponse(200, { count: 1, next: null, previous: null, results: [{ id: 6, name: 'Apple Inc' }] })
        );
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('No canvases yet.');

    await user.click(screen.getByRole('button', { name: 'New Canvas' }));
    await user.selectOptions(screen.getByLabelText('Company *'), '6');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Editor at /canvas/create')).toBeInTheDocument();
  });

  it('deleting a canvas via the confirm dialog DELETEs it and removes the card', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'DELETE' && url.endsWith('/canvases/1/')) {
        return Promise.resolve({ ok: true, status: 204, json: async () => null });
      }
      if (method === 'GET' && url.endsWith('/canvases/')) {
        return Promise.resolve(jsonResponse(200, [orgCanvas]));
      }
      return Promise.resolve(jsonResponse(200, EMPTY_CUSTOMERS_PAGE));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Renewal Strategy Q3');

    await user.click(screen.getByTitle('Delete'));
    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/canvases/1/'),
        expect.objectContaining({ method: 'DELETE' })
      )
    );
    expect(screen.queryByText('Renewal Strategy Q3')).not.toBeInTheDocument();
  });
});
