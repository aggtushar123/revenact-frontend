import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { WebhooksPage } from './WebhooksPage';
import { capabilitiesForRole } from '../../test/capabilities';

// Integration tier (see the `testing` skill): a real Redux store for
// role-gating (same convention as CurrencyPage.test.tsx's own) plus
// the fetch boundary mocked for the real webhooksApi.ts calls.

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function webhook(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    url: 'https://example.com/hook',
    event: 'customer.created',
    event_display: 'Organization Created',
    secret: 'shh',
    is_active: true,
    created_at: '2026-09-04T00:00:00Z',
    recent_deliveries: [],
    ...overrides,
  };
}

function makeStore(role: 'admin' | 'csm' = 'admin') {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1,
          email: 'alice@acme.io',
          name: 'Alice',
          avatar: '',
          role,
          role_id: 1,
          role_name: role === 'admin' ? 'Admin' : 'CSM',
          permissions: capabilitiesForRole(role),
          function: 'cs' as const, function_display: 'Customer Success',
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
}

function renderPage(role: 'admin' | 'csm' = 'admin') {
  render(
    <Provider store={makeStore(role)}>
      <WebhooksPage />
    </Provider>
  );
}

describe('WebhooksPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('a CSM sees a read-only notice and never fetches', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderPage('csm');

    expect(screen.getByText(/You don't have permission to view or manage webhooks/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the empty state when there are no webhooks', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, []))));
    renderPage();

    expect(await screen.findByText('No webhooks yet.')).toBeInTheDocument();
  });

  it('lists real webhooks with their event and active state', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, [webhook()]))));
    renderPage();

    expect(await screen.findByText('https://example.com/hook')).toBeInTheDocument();
    expect(screen.getByText('Organization Created')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('expanding a row shows its recent deliveries', async () => {
    const withDeliveries = webhook({
      recent_deliveries: [
        { id: 5, success: true, status_code: 200, error: '', sent_at: '2026-09-04T00:00:00Z' },
        { id: 6, success: false, status_code: null, error: 'Connection refused', sent_at: '2026-09-03T00:00:00Z' },
      ],
    });
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, [withDeliveries]))));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText('https://example.com/hook'));

    expect(screen.getByText(/HTTP 200/)).toBeInTheDocument();
    expect(screen.getByText(/Connection refused/)).toBeInTheDocument();
  });

  it('adding a webhook POSTs for real and prepends it to the list', async () => {
    const created = webhook({ id: 2, url: 'https://new.example.com/hook' });
    const fetchMock = vi.fn((_url: string, options?: { method?: string }) => {
      if (options?.method === 'POST') return Promise.resolve(jsonResponse(201, created));
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('No webhooks yet.');
    await user.click(screen.getByRole('button', { name: 'Add Webhook' }));
    await user.type(screen.getByLabelText('URL'), 'https://new.example.com/hook');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('https://new.example.com/hook')).toBeInTheDocument();
    const postCall = fetchMock.mock.calls.find(([, o]) => o?.method === 'POST')!;
    expect(JSON.parse((postCall[1] as { body: string }).body)).toEqual({
      url: 'https://new.example.com/hook',
      event: 'customer.created',
    });
  });

  it('toggling the switch PATCHes is_active', async () => {
    const fetchMock = vi.fn((_url: string, options?: { method?: string; body?: string }) => {
      if (options?.method === 'PATCH') {
        return Promise.resolve(jsonResponse(200, webhook({ is_active: false })));
      }
      return Promise.resolve(jsonResponse(200, [webhook()]));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('https://example.com/hook');
    await user.click(screen.getByRole('switch'));

    expect(await screen.findByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('deleting a webhook removes it after confirming', async () => {
    const fetchMock = vi.fn((_url: string, options?: { method?: string }) => {
      if (options?.method === 'DELETE') return Promise.resolve(jsonResponse(204, null));
      return Promise.resolve(jsonResponse(200, [webhook()]));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('https://example.com/hook');
    await user.click(screen.getByRole('button', { name: /Delete webhook for/ }));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('No webhooks yet.')).toBeInTheDocument();
  });

  it('surfaces a create error without adding a bogus row', async () => {
    const fetchMock = vi.fn((_url: string, options?: { method?: string }) => {
      if (options?.method === 'POST') {
        return Promise.resolve(jsonResponse(400, { url: ['That URL resolves to a private or internal address, which isn\'t allowed.'] }));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('No webhooks yet.');
    await user.click(screen.getByRole('button', { name: 'Add Webhook' }));
    await user.type(screen.getByLabelText('URL'), 'http://169.254.169.254/');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText(/private or internal address/)).toBeInTheDocument();
    expect(screen.getByText('No webhooks yet.')).toBeInTheDocument();
  });
});
