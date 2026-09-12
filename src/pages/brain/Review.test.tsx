import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../../features/auth/authSlice';
import proposalsReducer from '../../features/proposals/proposalsSlice';
import { ReviewQueuePage } from './Review';
import { capabilitiesForRole } from '../../test/capabilities';

const task = {
  id: 7, batch: 'b1', kind: 'task' as const, kind_display: 'Task on an account',
  title: 'Run a save play on Pizza Hut before renewal',
  rationale: 'Pizza Hut carries USD 17,400 of downside and its renewal is overdue.',
  evidence: ['Pizza Hut — owner Carl CSM, downside USD 17,400, renewal overdue by 34 days'],
  action: { customer_id: 7, customer_name: 'Pizza Hut', title: 'Save play: Pizza Hut', assignee_name: 'Carl CSM', due_date: '2026-09-15', priority: 'high' as const },
  initiative: { id: 1, title: 'Halve the ARR at risk on Product B' },
  status: 'proposed' as const, status_display: 'Proposed', decided_by: null, decided_at: null, decision_note: '', result: {}, generated_by: 'Alice', source: null, created_at: '2026-09-12T17:00:00Z',
};
const initiative = {
  ...task, id: 8, kind: 'initiative' as const, kind_display: 'Initiative', title: 'Improve seat utilisation', initiative: null,
  rationale: 'Seat utilisation is 59.6%.', evidence: ['Seat utilisation: 59.6%'],
  action: { metric: 'seat_utilisation', metric_label: 'Seat utilisation', dimension: '', member: '', member_label: '', target_value: 75, target_by: '2026-12-11' },
};

function mockApi() {
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>((url, init) => {
    const ok = (body: unknown, status = 200) => Promise.resolve({ ok: status < 400, status, json: async () => body });
    if (url.includes('/generate/')) return ok({ proposals: [{ ...task, id: 9, title: 'Fresh proposal' }] }, 201);
    if (url.includes('/approve/')) return ok({ proposal: { ...task, status: 'approved', status_display: 'Approved', decided_by: 'Alice', decided_at: '2026-09-12T18:00:00Z', result: { task_id: 42, customer_id: 7 } } });
    if (url.includes('/reject/')) {
      const note = JSON.parse(String(init?.body)).note;
      return ok({ proposal: { ...task, status: 'rejected', status_display: 'Rejected', decided_by: 'Alice', decided_at: '2026-09-12T18:00:00Z', decision_note: note } });
    }
    return ok({ pending: 2, proposals: [task, initiative] });
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderPage(role: 'admin' | 'csm' = 'admin') {
  const store = configureStore({
    reducer: { auth: authReducer, proposals: proposalsReducer },
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
        <ReviewQueuePage />
      </MemoryRouter>
    </Provider>
  );
  return store;
}

const cardOf = (title: string) => screen.getByText(title).closest('article') as HTMLElement;

describe('ReviewQueuePage', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('lists what is waiting, with the evidence and exactly what approving will do', async () => {
    mockApi();
    renderPage();

    expect(await screen.findByText('Waiting for a decision · 2')).toBeInTheDocument();
    const card = cardOf('Run a save play on Pizza Hut before renewal');
    expect(within(card).getByText(/renewal overdue by 34 days/)).toBeInTheDocument();
    expect(within(card).getByText(/Approving creates a task:/)).toBeInTheDocument();
    expect(within(card).getByText('Save play: Pizza Hut')).toBeInTheDocument();
    expect(within(card).getByText('Halve the ARR at risk on Product B')).toBeInTheDocument();
    const other = cardOf('Improve seat utilisation');
    expect(within(other).getByText(/Approving opens an initiative:/)).toBeInTheDocument();
  });

  it('approving records the decision and what it created', async () => {
    const spy = mockApi();
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Waiting for a decision · 2');
    await user.click(within(cardOf('Run a save play on Pizza Hut before renewal')).getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(screen.getByText('Waiting for a decision · 1')).toBeInTheDocument());
    expect(screen.getByText(/Approved by Alice on .* · task #42 created/)).toBeInTheDocument();
    expect(spy.mock.calls.some(([url]) => url.includes('/metrics/proposals/7/approve/'))).toBe(true);
  });

  it('rejecting asks why and keeps the note', async () => {
    const spy = mockApi();
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Waiting for a decision · 2');
    const card = cardOf('Run a save play on Pizza Hut before renewal');
    await user.click(within(card).getByRole('button', { name: 'Reject' }));
    await user.type(screen.getByLabelText('Why not? (optional)'), 'Already in hand');
    await user.click(within(card).getByRole('button', { name: 'Reject' }));

    await waitFor(() => expect(screen.getByText(/Rejected by Alice on .* — “Already in hand”/)).toBeInTheDocument());
    const post = spy.mock.calls.find(([url]) => url.includes('/reject/'));
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ note: 'Already in hand' });
  });

  it('asks the agent only on click and prepends what comes back', async () => {
    const spy = mockApi();
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Waiting for a decision · 2');
    expect(spy.mock.calls.some(([url]) => url.includes('/generate/'))).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Ask the agent' }));

    expect(await screen.findByText('Fresh proposal')).toBeInTheDocument();
    expect(screen.getByText('Waiting for a decision · 3')).toBeInTheDocument();
  });

  it('explains the gate to someone without view-all-accounts', () => {
    const spy = mockApi();
    renderPage('csm');

    expect(screen.getByText(/need the view-all-accounts capability/)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });
});
