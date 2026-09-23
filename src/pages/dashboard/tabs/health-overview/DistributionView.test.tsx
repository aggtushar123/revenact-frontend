import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import customersReducer from '../../../../features/customers/customersSlice';
import authReducer from '../../../../features/auth/authSlice';
import healthReducer, { NO_FILTERS } from '../../../../features/health/healthSlice';
import { ALL_CAPABILITIES } from '../../../../test/capabilities';
import { DistributionView } from './DistributionView';

// Integration tier: DistributionView is `ControlsView` (the old "Controls"
// portfolio mix, reading `state.health`) stacked over `HealthDistribution`
// (the old /health rollup, reading `state.customers.stats`/`accountStats`).
// Real stores for both, fetch mocked at the boundary — same convention as
// HealthPage.test.tsx, whose coverage this repo's HealthDistribution.test.tsx
// keeps for the rollup itself; this file only proves the two halves render
// together.

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const STATS = {
  health: {
    good: { count: 5, mrr: 20000, arr: 240000 },
    average: { count: 2, mrr: 5000, arr: 60000 },
    poor: { count: 1, mrr: 500, arr: 6000 },
  },
  nps: { promoters: 4, passives: 1, detractors: 2, score: 25 },
  lifecycle: Object.fromEntries(
    ['onboarding', 'kickoff', 'adoption', 'live', 'renewal', 'churn', 'expansion', 'other'].map((s) => [
      s,
      { count: 0, mrr: 0, arr: 0 },
    ])
  ),
};

function fetchMock() {
  return vi.fn((url: string) => {
    if (url.includes('/customers/stats/')) return Promise.resolve(jsonResponse(200, STATS));
    if (url.includes('/accounts/stats/')) return Promise.resolve(jsonResponse(200, STATS));
    return Promise.resolve(jsonResponse(200, { count: 0, next: null, previous: null, results: [] }));
  });
}

function renderDistribution() {
  const store = configureStore({
    reducer: { customers: customersReducer, auth: authReducer, health: healthReducer },
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
          function: 'cs' as const,
          function_display: 'Customer Success',
          reports_to: null,
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
      // Preloaded (`loadedAt` set) so ControlsView's `useHealthOverview`
      // doesn't fire its own fetch thunk — this test is about the two
      // halves rendering together, not about loading either one's data.
      health: {
        rows: [],
        isLoading: false,
        error: null,
        historyMonths: 12,
        truncated: false,
        loadedAt: '2026-09-11T00:00:00.000Z',
        currency: 'USD' as const,
        unconvertedCount: 0,
        filters: NO_FILTERS,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <DistributionView />
      </MemoryRouter>
    </Provider>
  );
}

describe('DistributionView', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the health mix and the organisations/accounts switch', async () => {
    vi.stubGlobal('fetch', fetchMock());
    renderDistribution();

    expect(screen.getByRole('button', { name: /organizations/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accounts/i })).toBeInTheDocument();
  });
});
