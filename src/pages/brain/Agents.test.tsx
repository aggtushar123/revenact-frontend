import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import agentsReducer from '../../features/agents/agentsSlice';
import { AgentsPage } from './Agents';
import { capabilitiesForRole } from '../../test/capabilities';

const purposes = [
  { purpose: 'brief', label: 'Management brief', calls: 3, ok: 2, failed: 1, input_tokens: 9_000, output_tokens: 1_500, spent: 10_500, budget: 2_000_000, remaining: 1_989_500, custom_budget: false },
  { purpose: 'proposals', label: 'Ops agent proposals', calls: 2, ok: 2, failed: 0, input_tokens: 40_000, output_tokens: 5_000, spent: 45_000, budget: 50_000, remaining: 5_000, custom_budget: true },
];
const usage = {
  month_start: '2026-09-01',
  purposes,
  default_budget: 2_000_000,
  recent: [
    { id: 1, purpose: 'brief', purpose_label: 'Management brief', user: 'Alice', model: 'claude', input_tokens: 3000, output_tokens: 500, latency_ms: 8400, outcome: 'ok' as const, error: '', created_at: '2026-09-12T15:40:02Z' },
    { id: 2, purpose: 'brief', purpose_label: 'Management brief', user: null, model: 'claude', input_tokens: 0, output_tokens: 0, latency_ms: 12, outcome: 'over_budget' as const, error: 'Monthly token budget spent.', created_at: '2026-09-12T15:41:02Z' },
  ],
};

function mockApi() {
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>((_url, init) => {
    const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => body });
    if (init?.method === 'PATCH') {
      const body = JSON.parse(String(init.body));
      return ok({ month_start: '2026-09-01', purposes: purposes.map((p) => p.purpose === body.purpose ? { ...p, budget: body.monthly_tokens ?? 2_000_000, custom_budget: body.monthly_tokens !== null } : p) });
    }
    return ok(usage);
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderPage(role: 'admin' | 'csm' = 'admin') {
  const store = configureStore({
    reducer: { auth: authReducer, agents: agentsReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1, email: 'alice@acme.io', name: 'Alice', avatar: '', role, role_id: 1,
          role_name: role === 'admin' ? 'Admin' : 'CSM', permissions: capabilitiesForRole(role),
          function: 'cs' as const, function_display: 'Customer Success',
          organisation: {
            id: 1, name: 'Acme Inc', slug: 'acme-inc', currency: 'USD' as const, currency_display: 'US Dollar ($)',
            default_lifecycle_stage: '', ai_agent_enabled: true, ai_agent_tone: 'professional' as const, ai_agent_tone_display: 'Professional',
          },
          is_active: true,
        },
        accessToken: 'token', refreshToken: 'refresh', isAuthenticated: true, isLoading: false, error: null,
      },
    },
  });
  render(
    <Provider store={store}>
      <AgentsPage />
    </Provider>
  );
}

const card = (label: string) => screen.getByRole('heading', { name: label }).closest('div.bg-surface') as HTMLElement;

describe('AgentsPage', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('shows spend against budget per purpose, and the recent calls with their outcomes', async () => {
    mockApi();
    renderPage();

    await screen.findByRole('heading', { name: 'Management brief' });
    expect(within(card('Management brief')).getByText('11K')).toBeInTheDocument();
    expect(within(card('Management brief')).getByText(/1 failed/)).toBeInTheDocument();
    expect(within(card('Ops agent proposals')).getByText('90%')).toBeInTheDocument();
    expect(within(card('Ops agent proposals')).getByText(/budget set for this organisation/)).toBeInTheDocument();
    expect(screen.getByText('over budget')).toHaveClass('text-danger');
    expect(screen.getByText('scheduled')).toBeInTheDocument();
  });

  it('lets an organisation settings manager set and clear a budget', async () => {
    const spy = mockApi();
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('heading', { name: 'Management brief' });
    await user.click(within(card('Management brief')).getByRole('button', { name: 'Set budget' }));
    const input = screen.getByLabelText('Tokens / month');
    await user.clear(input);
    await user.type(input, '250000');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(within(card('Management brief')).getByText(/budget set for this organisation/)).toBeInTheDocument());
    const patch = spy.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ purpose: 'brief', monthly_tokens: 250000 });

    await user.click(within(card('Ops agent proposals')).getByRole('button', { name: 'Use default' }));
    await waitFor(() => expect(within(card('Ops agent proposals')).getByText(/default budget/)).toBeInTheDocument());
  });

  it('explains the gate to someone without view-all-accounts', () => {
    const spy = mockApi();
    renderPage('csm');

    expect(screen.getByText(/needs the view-all-accounts capability/)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });
});
