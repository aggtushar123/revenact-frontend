import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import authReducer from '../../features/auth/authSlice';
import { MetricsPanel } from './MetricsPanel';
import { ALL_CAPABILITIES } from '../../test/capabilities';

// Integration tier (see the `testing` skill): network mocked at the
// fetch boundary — responses shaped exactly like revenact-backend's
// real AccountStatsView payload (see docs/API_CONTRACTS.md ->
// GET /api/v1/accounts/stats/), same shape as CustomerStatsView's own
// (it mirrored the organizations MetricsPanel test, retired with the old board).

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function renderPanel() {
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
      <MetricsPanel />
    </Provider>
  );
}

describe('Accounts MetricsPanel (Health/NPS/Lifecycle sections)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders real numbers from GET /accounts/stats/, not mock data', async () => {
    const customStats = {
      health: {
        good: { count: 11, mrr: 100, arr: 1200 },
        average: { count: 22, mrr: 200, arr: 2400 },
        poor: { count: 33, mrr: 300, arr: 3600 },
      },
      nps: { promoters: 44, passives: 55, detractors: 16, score: 77 },
      lifecycle: {
        onboarding: { count: 1, mrr: 0, arr: 0 },
        kickoff: { count: 2, mrr: 0, arr: 0 },
        adoption: { count: 3, mrr: 0, arr: 0 },
        live: { count: 4, mrr: 0, arr: 0 },
        renewal: { count: 5, mrr: 0, arr: 0 },
        churn: { count: 6, mrr: 0, arr: 0 },
        expansion: { count: 7, mrr: 0, arr: 0 },
        other: { count: 8, mrr: 0, arr: 0 },
      },
    };
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, customStats))));

    renderPanel();

    expect(await screen.findByText('11')).toBeInTheDocument(); // Health: Good
    expect(screen.getByText('22')).toBeInTheDocument(); // Health: Average
    expect(screen.getByText('33')).toBeInTheDocument(); // Health: Poor
    expect(screen.getByText('+77')).toBeInTheDocument(); // NPS score
    expect(screen.getByText('44')).toBeInTheDocument(); // NPS: Promoters
    expect(screen.getByText('55')).toBeInTheDocument(); // NPS: Passives
    expect(screen.getByText('16')).toBeInTheDocument(); // NPS: Detractors
    expect(screen.getByTitle('live: 4')).toBeInTheDocument(); // Lifecycle bar
    expect(screen.getByTitle('churn: 6')).toBeInTheDocument();
    // "Number of Accounts" is summed from the health buckets (11+22+33),
    // not a separately-passed prop — always the true total regardless
    // of the table's own search/company filter.
    expect(screen.getByText('66')).toBeInTheDocument();
  });

  it('shows a small error note on each section when stats fail to load, without crashing', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(500, { detail: 'Server error.' }))));

    renderPanel();

    // One note each for Health, NPS, and Lifecycle Stages.
    expect(await screen.findAllByText("Couldn't load")).toHaveLength(3);
    // Falls back to zeroed sections rather than crashing.
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
