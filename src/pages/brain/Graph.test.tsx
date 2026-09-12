import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import graphReducer from '../../features/graph/graphSlice';
import { GraphPage } from './Graph';
import { capabilitiesForRole } from '../../test/capabilities';

const payload = {
  as_of: '2026-09-13',
  currency: 'USD' as const,
  nodes: [
    { id: 'owner:2', kind: 'owner' as const, label: 'Carl CSM', customers: 2, arr: 169_600, downside: 17_400 },
    { id: 'customer:7', kind: 'customer' as const, label: 'Pizza Hut', arr: 69_600, downside: 17_400, risk: 0.25, health_category: 'average' as const, health_score: 5.1, days_to_renewal: -34, open_tasks: 1 },
    { id: 'customer:8', kind: 'customer' as const, label: 'Fine', arr: 100_000, downside: 0, risk: 0.05, health_category: 'good' as const, health_score: 8.5, days_to_renewal: 200, open_tasks: 0 },
    { id: 'product:4', kind: 'product' as const, label: 'Product B', customers: 2, arr: 169_600, downside: 17_400 },
    { id: 'initiative:1', kind: 'initiative' as const, label: 'Halve the ARR at risk on Product B', status: 'active' as const, metric: 'at_risk_arr', metric_label: 'ARR at risk', member_label: 'Product B', target_value: 32_000, target_by: '2026-11-30', owner: 'Carl CSM' },
    { id: 'proposal:5', kind: 'proposal' as const, label: 'Save play on Pizza Hut', proposal_kind: 'task' as const, from_session: 'Why this account is at risk?' },
  ],
  edges: [
    { from: 'owner:2', to: 'customer:7', kind: 'owns' as const },
    { from: 'owner:2', to: 'customer:8', kind: 'owns' as const },
    { from: 'customer:7', to: 'product:4', kind: 'runs_on' as const },
    { from: 'customer:8', to: 'product:4', kind: 'runs_on' as const },
    { from: 'initiative:1', to: 'product:4', kind: 'targets' as const },
    { from: 'proposal:5', to: 'customer:7', kind: 'acts_on' as const },
  ],
};

function renderPage(role: 'admin' | 'csm' = 'admin') {
  const spy = vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => payload }));
  vi.stubGlobal('fetch', spy);
  const store = configureStore({
    reducer: { auth: authReducer, graph: graphReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1, email: 'alice@acme.io', name: 'Alice', avatar: '', role, role_id: 1,
          role_name: role === 'admin' ? 'Admin' : 'CSM', permissions: capabilitiesForRole(role),
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
      <MemoryRouter>
        <GraphPage />
      </MemoryRouter>
    </Provider>
  );
  return spy;
}

describe('GraphPage', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('draws every node and relation, and opens a node into its figures and neighbours', async () => {
    const user = userEvent.setup();
    renderPage();

    const pizzaHut = await screen.findByRole('button', { name: 'customer Pizza Hut' });
    expect(screen.getAllByRole('button', { name: /^(owner|customer|product|initiative|proposal) / })).toHaveLength(6);
    expect(document.querySelectorAll('path[data-kind]')).toHaveLength(6);
    expect(screen.getByText(/6 nodes, 6 relations/)).toBeInTheDocument();

    await user.click(pizzaHut);
    const detail = screen.getByRole('complementary', { name: 'Details for Pizza Hut' });
    expect(within(detail).getByText('$69.6K')).toBeInTheDocument();
    expect(within(detail).getByText('overdue by 34 days')).toBeInTheDocument();
    expect(within(detail).getByText('Carl CSM')).toBeInTheDocument();
    expect(within(detail).getByText('Product B')).toBeInTheDocument();
    expect(within(detail).getByText('Save play on Pizza Hut')).toBeInTheDocument();
    expect(within(detail).queryByText('Fine')).not.toBeInTheDocument();
    expect(within(detail).getByRole('link', { name: /Open the organization/ })).toHaveAttribute('href', '/organizations/7');
    expect(pizzaHut).toHaveAttribute('aria-pressed', 'true');

    await user.click(within(detail).getByRole('button', { name: 'Close details' }));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('filters to the accounts carrying downside and everything they connect to', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('button', { name: 'customer Pizza Hut' });
    await user.click(screen.getByLabelText('Only accounts carrying downside'));

    expect(screen.queryByRole('button', { name: 'customer Fine' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'customer Pizza Hut' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'owner Carl CSM' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'product Product B' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^initiative / })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^proposal / })).toBeInTheDocument();
    expect(screen.getByText(/Showing 5 of 6 nodes and 4 of 6 relations/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Product'), 'product:4');
    expect(screen.getByText(/Showing 5 of 6 nodes/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('button', { name: 'customer Fine' })).toBeInTheDocument();
    expect(screen.getByText(/6 nodes, 6 relations/)).toBeInTheDocument();
  });

  it('says why to someone without view-all-accounts and fetches nothing', () => {
    const spy = renderPage('csm');
    expect(screen.getByText(/needs the view-all-accounts capability/)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });
});
