import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { CurrencyPage } from './CurrencyPage';
import { capabilitiesForRole } from '../../test/capabilities';

// Integration tier (see the `testing` skill): a real Redux store (same
// convention as Profile.test.tsx's own — this page dispatches
// updateOrganisation, a thunk on the same slice) plus the fetch
// boundary mocked.

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function makeStore(role: 'admin' | 'csm' = 'admin', currency: 'USD' | 'EUR' = 'USD') {
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
          function: 'cs' as const, function_display: 'Customer Success', reports_to: null,
          organisation: {
            id: 1,
            name: 'Acme Inc',
            slug: 'acme-inc',
            currency,
            currency_display: currency === 'USD' ? 'US Dollar ($)' : 'Euro (€)',
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

function renderPage(store: ReturnType<typeof makeStore>) {
  render(
    <Provider store={store}>
      <CurrencyPage />
    </Provider>
  );
}

describe('CurrencyPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the tenant's own current currency", async () => {
    // Exchange Rates fetches GET /fx-rates/ on mount for an admin (see
    // FxRateListCreateView's own IsOrgAdmin-on-GET-too gate) — stubbed
    // to an empty list since this test isn't about that section.
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, []))));
    renderPage(makeStore('admin', 'EUR'));
    expect(screen.getByLabelText('Currency')).toHaveValue('EUR');
    expect(screen.getByText('€12,345.00')).toBeInTheDocument();
    await screen.findByText(/every customer is assumed to bill in EUR/);
  });

  it('an admin can change and save the currency', async () => {
    const fetchMock = vi.fn((_url: string, options?: { method?: string }) => {
      if (options?.method === 'PATCH') {
        return Promise.resolve(jsonResponse(200, {
          id: 1, name: 'Acme Inc', slug: 'acme-inc', currency: 'GBP', currency_display: 'British Pound (£)', default_lifecycle_stage: '',
        }));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage(makeStore('admin', 'USD'));

    await user.selectOptions(screen.getByLabelText('Currency'), 'GBP');
    expect(screen.getByText('£12,345.00')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved.')).toBeInTheDocument();
    const patchCall = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH')!;
    const [, options] = patchCall as [string, { body: string }];
    expect(JSON.parse(options.body)).toEqual({ currency: 'GBP' });
  });

  it('a CSM sees a read-only view with no Save button and never fetches exchange rates', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderPage(makeStore('csm', 'USD'));

    expect(screen.getByText(/You don't have permission to change this/)).toBeInTheDocument();
    expect(screen.getByLabelText('Currency')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    // Exchange Rates is admin-only both ways server-side (IsOrgAdmin on
    // GET too) — a CSM can't even fetch the list, so this page doesn't
    // render the section or attempt to at all.
    expect(screen.queryByText('Exchange Rates')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe('Exchange Rates', () => {
    it('shows the empty state when no rates are configured', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, []))));
      renderPage(makeStore('admin', 'USD'));
      expect(await screen.findByText(/every customer is assumed to bill in USD/)).toBeInTheDocument();
    });

    it('lists configured rates', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, [
        { id: 1, currency: 'EUR', currency_display: 'Euro (€)', rate_to_org_currency: '1.080000', updated_at: '2026-09-04T00:00:00Z' },
      ]))));
      renderPage(makeStore('admin', 'USD'));
      expect(await screen.findByText('1 EUR = 1.080000 USD')).toBeInTheDocument();
    });

    it('adding a rate POSTs for real and appends it to the list', async () => {
      const created = { id: 2, currency: 'EUR', currency_display: 'Euro (€)', rate_to_org_currency: '1.080000', updated_at: '2026-09-04T00:00:00Z' };
      const fetchMock = vi.fn((_url: string, options?: { method?: string }) => {
        if (options?.method === 'POST') return Promise.resolve(jsonResponse(201, created));
        return Promise.resolve(jsonResponse(200, []));
      });
      vi.stubGlobal('fetch', fetchMock);
      const user = userEvent.setup();
      renderPage(makeStore('admin', 'USD'));

      await screen.findByText(/every customer is assumed to bill in USD/);
      await user.click(screen.getByRole('button', { name: 'Add rate' }));
      await user.selectOptions(screen.getByDisplayValue('Select…'), 'EUR');
      await user.type(screen.getByPlaceholderText('USD amount'), '1.08');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(await screen.findByText('1 EUR = 1.080000 USD')).toBeInTheDocument();
      const postCall = fetchMock.mock.calls.find(([, o]) => o?.method === 'POST')!;
      expect(JSON.parse((postCall[1] as { body: string }).body)).toEqual({
        currency: 'EUR',
        rate_to_org_currency: '1.08',
      });
    });

    it('editing a rate PATCHes the new value in place', async () => {
      const fetchMock = vi.fn((_url: string, options?: { method?: string }) => {
        if (options?.method === 'PATCH') {
          return Promise.resolve(jsonResponse(200, {
            id: 1, currency: 'EUR', currency_display: 'Euro (€)', rate_to_org_currency: '1.120000', updated_at: '2026-09-04T00:00:00Z',
          }));
        }
        return Promise.resolve(jsonResponse(200, [
          { id: 1, currency: 'EUR', currency_display: 'Euro (€)', rate_to_org_currency: '1.080000', updated_at: '2026-09-04T00:00:00Z' },
        ]));
      });
      vi.stubGlobal('fetch', fetchMock);
      const user = userEvent.setup();
      renderPage(makeStore('admin', 'USD'));

      await screen.findByText('1 EUR = 1.080000 USD');
      await user.click(screen.getByRole('button', { name: 'Edit rate for EUR' }));
      const input = screen.getByDisplayValue('1.080000');
      await user.clear(input);
      await user.type(input, '1.12');
      await user.click(screen.getByRole('button', { name: 'Save rate' }));

      expect(await screen.findByText('1 EUR = 1.120000 USD')).toBeInTheDocument();
    });

    it('deleting a rate removes it after confirming', async () => {
      const fetchMock = vi.fn((_url: string, options?: { method?: string }) => {
        if (options?.method === 'DELETE') return Promise.resolve(jsonResponse(204, null));
        return Promise.resolve(jsonResponse(200, [
          { id: 1, currency: 'EUR', currency_display: 'Euro (€)', rate_to_org_currency: '1.080000', updated_at: '2026-09-04T00:00:00Z' },
        ]));
      });
      vi.stubGlobal('fetch', fetchMock);
      const user = userEvent.setup();
      renderPage(makeStore('admin', 'USD'));

      await screen.findByText('1 EUR = 1.080000 USD');
      await user.click(screen.getByRole('button', { name: 'Delete rate for EUR' }));
      await user.click(await screen.findByRole('button', { name: 'Delete' }));

      expect(await screen.findByText(/every customer is assumed to bill in USD/)).toBeInTheDocument();
    });

    it('warns that saving a currency change will clear existing rates', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, [
        { id: 1, currency: 'EUR', currency_display: 'Euro (€)', rate_to_org_currency: '1.08', updated_at: '2026-09-04T00:00:00Z' },
      ]))));
      const user = userEvent.setup();
      renderPage(makeStore('admin', 'USD'));

      await screen.findByText('1 EUR = 1.08 USD');
      expect(screen.queryByText(/Saving will clear/)).not.toBeInTheDocument();

      await user.selectOptions(screen.getByLabelText('Currency'), 'GBP');
      expect(screen.getByText(/Saving will clear your 1 existing exchange rate/)).toBeInTheDocument();
    });
  });
});
