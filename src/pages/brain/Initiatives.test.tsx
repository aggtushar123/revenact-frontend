import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import metricsReducer from '../../features/metrics/metricsSlice';
import initiativesReducer from '../../features/initiatives/initiativesSlice';
import { InitiativesPage } from './Initiatives';
import { capabilitiesForRole } from '../../test/capabilities';

const initiative = {
  id: 1,
  title: 'Halve the ARR at risk on Product B',
  hypothesis: 'If we run save plays, then risk halves.',
  metric: 'at_risk_arr',
  metric_label: 'ARR at risk',
  dimension: 'product',
  dimension_label: 'Product',
  member: '4',
  member_label: 'Product B',
  target_value: '32000.0000',
  target_by: '2026-11-30',
  owner: { id: 2, name: 'Carl CSM' },
  status: 'active' as const,
  status_display: 'Active',
  outcome: '',
  baseline_value: '64090.0000',
  baseline_as_of: '2026-09-12',
  progress: { baseline: 64_090, current: 48_000, target: 32_000, progress_pct: 50.1, days_left: 79, direction: 'down' as const, unit: 'money' as const, better: 'down' as const },
  history: [],
  work: {
    open: 1,
    done: 1,
    tasks: [
      { id: 21, title: 'Save play: Pizza Hut', parent_name: 'Pizza Hut', parent_type: 'customer' as const, parent_id: 7, assignee_name: 'Carl CSM', due_date: '2026-09-19', priority: 'high' as const, status: 'pending' as const },
      { id: 20, title: 'Usage review', parent_name: 'Uber', parent_type: 'customer' as const, parent_id: 3, assignee_name: 'Carl CSM', due_date: '2026-09-05', priority: 'medium' as const, status: 'completed' as const },
    ],
  },
  created_at: '2026-09-12T16:00:00Z',
  updated_at: '2026-09-12T16:00:00Z',
  closed_at: null,
};

const metrics = {
  as_of: '2026-09-12',
  currency: 'USD' as const,
  metrics: [
    { key: 'at_risk_arr', label: 'ARR at risk', unit: 'money' as const, better: 'down' as const, note: 'n', dimensions: ['owner', 'product'], value: 114_540, previous: null, change: null },
    { key: 'healthy_share', label: 'Book in good health', unit: 'percent' as const, better: 'up' as const, note: 'n', dimensions: ['owner', 'product'], value: 55.6, previous: null, change: null },
  ],
};
const byProduct = {
  metric: { key: 'at_risk_arr', label: 'ARR at risk', unit: 'money' as const, better: 'down' as const, note: 'n', dimensions: ['owner', 'product'] },
  dimension: { key: 'product', label: 'Product' },
  currency: 'USD' as const,
  members: [{ member: '4', label: 'Product B', value: 64_090, previous: null, change: null }],
};

function mockApi(list: unknown[] = [initiative]) {
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>((url, init) => {
    const ok = (body: unknown, status = 200) => Promise.resolve({ ok: true, status, json: async () => body });
    if (url.includes('/auth/members/')) return ok([{ id: 2, name: 'Carl CSM', email: 'carl@acme.io' }]);
    if (url.includes('/metrics/initiatives/') && init?.method === 'POST') {
      const body = JSON.parse(String(init.body));
      return ok({ ...initiative, id: 9, title: body.title, member: body.member, progress: { ...initiative.progress, progress_pct: 0 } }, 201);
    }
    if (url.includes('/metrics/initiatives/') && init?.method === 'PATCH') {
      const body = JSON.parse(String(init.body));
      return ok({ ...initiative, ...body, status_display: 'Done', closed_at: '2026-09-13T00:00:00Z' });
    }
    if (url.includes('/metrics/initiatives/')) return ok(list);
    if (url.includes('/by/product/')) return ok(byProduct);
    return ok(metrics);
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderPage(role: 'admin' | 'csm' = 'admin') {
  const store = configureStore({
    reducer: { auth: authReducer, metrics: metricsReducer, initiatives: initiativesReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1, email: 'alice@acme.io', name: 'Alice', avatar: '', role, role_id: 1,
          role_name: role === 'admin' ? 'Admin' : 'CSM', permissions: capabilitiesForRole(role),
          function: 'cs' as const, function_display: 'Customer Success', reports_to: null,
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
        <InitiativesPage />
      </MemoryRouter>
    </Provider>
  );
}

describe('InitiativesPage', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('lists the work under a decision, open first, and links each task to its account', async () => {
    mockApi([initiative]);
    renderPage();

    await screen.findByText('Save play: Pizza Hut');
    expect(screen.getByText(/1 open · 1 done/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pizza Hut' })).toHaveAttribute('href', '/organizations/7');
    expect(screen.getByText('Usage review')).toHaveClass('line-through');
  });

  it('shows each decision judged against the live number', async () => {
    mockApi();
    renderPage();

    const card = (await screen.findByText('Halve the ARR at risk on Product B')).closest('article') as HTMLElement;
    expect(within(card).getByText('ARR at risk · Product B · Carl CSM')).toBeInTheDocument();
    expect(within(card).getByText('$48.0K')).toBeInTheDocument();
    expect(within(card).getByText(/→ \$32\.0K/)).toBeInTheDocument();
    expect(within(card).getByText(/50\.1% of the way · started at \$64\.1K on 12 Sep 2026/)).toBeInTheDocument();
    expect(within(card).getByText(/79d left/)).toBeInTheDocument();
  });

  it('says progress is unmeasurable rather than drawing zero', async () => {
    mockApi([{ ...initiative, progress: { ...initiative.progress, current: null, progress_pct: null } }]);
    renderPage();

    expect(await screen.findByText(/Progress unmeasurable/)).toBeInTheDocument();
  });

  it('writes a new decision on a cut, sending the member id', async () => {
    const spy = mockApi();
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Halve the ARR at risk on Product B');
    await user.click(screen.getByRole('button', { name: 'New initiative' }));
    await user.type(screen.getByLabelText('Title'), 'Fix Product B');
    await user.selectOptions(screen.getByLabelText('Cut'), 'product');
    await user.selectOptions(await screen.findByLabelText('Product'), '4');
    await user.type(screen.getByLabelText('Target value'), '32000');
    await user.type(screen.getByLabelText('Target date'), '2026-11-30');
    await user.selectOptions(screen.getByLabelText('Owner'), '2');
    await user.click(screen.getByRole('button', { name: 'Save initiative' }));

    expect(await screen.findByText('Fix Product B')).toBeInTheDocument();
    const post = spy.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({
      title: 'Fix Product B', metric: 'at_risk_arr', dimension: 'product', member: '4', target_value: '32000', owner_id: 2,
    });
  });

  it('closes a decision with an outcome', async () => {
    const spy = mockApi();
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Halve the ARR at risk on Product B');
    await user.click(screen.getByRole('button', { name: 'Mark done' }));
    await user.type(screen.getByLabelText('What happened?'), 'It worked.');
    await user.click(screen.getByRole('button', { name: 'Close as done' }));

    await waitFor(() => expect(screen.getByText('Closed')).toBeInTheDocument());
    const patch = spy.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ status: 'done', outcome: 'It worked.' });
    expect(screen.getByText('It worked.')).toBeInTheDocument();
  });

  it('explains the gate to someone without view-all-accounts', () => {
    const spy = mockApi();
    renderPage('csm');

    expect(screen.getByText(/need the view-all-accounts capability/)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });
});
