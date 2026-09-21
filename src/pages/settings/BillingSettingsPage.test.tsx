import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { type User } from '../../features/auth/authSlice';
import billingReducer from '../../features/billing/billingSlice';
import { BillingSettingsPage } from './BillingSettingsPage';

const summary = {
  plan: { code: 'trial', name: 'Trial', seats_included: 3, monthly_credits: 200, price_cents: 0, currency: 'USD', is_trial: true },
  status: 'trialing',
  seats: { used: 3, limit: 3 },
  credits: { balance: 0 },
  trial_ends_at: '2026-10-05T00:00:00Z',
  current_period_end: null,
  enforced: true,
};

function jsonResponse(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body };
}

function renderPage(permissions: string[]) {
  const user = { id: 1, email: 'a@acme.io', name: 'A', permissions, organisation: { id: 1, name: 'Acme', slug: 'acme' }, is_active: true } as unknown as User;
  const store = configureStore({
    reducer: { auth: authReducer, billing: billingReducer },
    preloadedState: { auth: { user, accessToken: 'a', refreshToken: 'r', isAuthenticated: true, isLoading: false, error: null } },
  });
  render(
    <Provider store={store}>
      <BillingSettingsPage />
    </Provider>
  );
}

describe('Plan & billing', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('shows the plan, seats and credits from the server, and warns when both are exhausted', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/billing/account/')) return jsonResponse(200, summary);
      if (url.includes('/billing/plans/')) return jsonResponse(200, [{ code: 'team', name: 'Team', seats_included: 10, monthly_credits: 2000, price_cents: 4900, currency: 'USD' }]);
      if (url.includes('/billing/ledger/')) return jsonResponse(200, [{ id: 1, kind: 'grant', amount: 200, balance_after: 200, reason: 'Trial', actor: null, at: '2026-09-21T00:00:00Z' }]);
      throw new Error(`unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage(['manage_org_settings']);

    expect(await screen.findByRole('heading', { name: 'Trial plan' })).toBeInTheDocument();
    expect(screen.getByText(/Every seat is taken/)).toBeInTheDocument();
    expect(screen.getByText(/None left: the Copilot will refuse/)).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(await screen.findByText(/Trial/, { selector: 'td span' })).toBeInTheDocument();
  });

  it('hides the credit history from someone without manage_org_settings', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/billing/account/')) return jsonResponse(200, summary);
      if (url.includes('/billing/plans/')) return jsonResponse(200, []);
      throw new Error(`unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage([]);

    expect(await screen.findByRole('heading', { name: 'Trial plan' })).toBeInTheDocument();
    expect(screen.queryByText('Credit history')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/billing/ledger/'), expect.anything());
  });
});
