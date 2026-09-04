import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { CurrencyPage } from './CurrencyPage';

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
          organisation: {
            id: 1,
            name: 'Acme Inc',
            slug: 'acme-inc',
            currency,
            currency_display: currency === 'USD' ? 'US Dollar ($)' : 'Euro (€)',
            default_lifecycle_stage: '',
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

  it("shows the tenant's own current currency", () => {
    renderPage(makeStore('admin', 'EUR'));
    expect(screen.getByLabelText('Currency')).toHaveValue('EUR');
    expect(screen.getByText('€12,345.00')).toBeInTheDocument();
  });

  it('an admin can change and save the currency', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(200, {
      id: 1, name: 'Acme Inc', slug: 'acme-inc', currency: 'GBP', currency_display: 'British Pound (£)', default_lifecycle_stage: '',
    }))) as ReturnType<typeof vi.fn<(url: string, options?: { method?: string; body?: string }) => Promise<ReturnType<typeof jsonResponse>>>>;
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage(makeStore('admin', 'USD'));

    await user.selectOptions(screen.getByLabelText('Currency'), 'GBP');
    expect(screen.getByText('£12,345.00')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved.')).toBeInTheDocument();
    const [, options] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(JSON.parse(options.body)).toEqual({ currency: 'GBP' });
  });

  it('a CSM sees a read-only view with no Save button', () => {
    renderPage(makeStore('csm', 'USD'));

    expect(screen.getByText(/Only an organisation admin can change this/)).toBeInTheDocument();
    expect(screen.getByLabelText('Currency')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });
});
