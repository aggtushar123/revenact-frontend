import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { GlobalPresetsPage } from './GlobalPresetsPage';

// Integration tier (see the `testing` skill): same convention as
// CurrencyPage.test.tsx's own — a real Redux store, fetch boundary
// mocked.

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function makeStore(role: 'admin' | 'csm' = 'admin', defaultLifecycleStage = '') {
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
            currency: 'USD' as const,
            currency_display: 'US Dollar ($)',
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
}

function renderPage(store: ReturnType<typeof makeStore>) {
  render(
    <Provider store={store}>
      <GlobalPresetsPage />
    </Provider>
  );
}

describe('GlobalPresetsPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows "no default" when the tenant has never set one', () => {
    renderPage(makeStore('admin', ''));
    expect(screen.getByLabelText(/Default Lifecycle Stage/)).toHaveValue('');
  });

  it("shows the tenant's own saved default", () => {
    renderPage(makeStore('admin', 'adoption'));
    expect(screen.getByLabelText(/Default Lifecycle Stage/)).toHaveValue('adoption');
  });

  it('an admin can change and save the default stage', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(200, {
      id: 1, name: 'Acme Inc', slug: 'acme-inc', currency: 'USD', currency_display: 'US Dollar ($)', default_lifecycle_stage: 'live',
    }))) as ReturnType<typeof vi.fn<(url: string, options?: { method?: string; body?: string }) => Promise<ReturnType<typeof jsonResponse>>>>;
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage(makeStore('admin', ''));

    await user.selectOptions(screen.getByLabelText(/Default Lifecycle Stage/), 'live');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved.')).toBeInTheDocument();
    const [, options] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(JSON.parse(options.body)).toEqual({ default_lifecycle_stage: 'live' });
  });

  it('a CSM sees a read-only view with no Save button', () => {
    renderPage(makeStore('csm', 'live'));

    expect(screen.getByText(/Only an organisation admin can change this/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Default Lifecycle Stage/)).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });
});
