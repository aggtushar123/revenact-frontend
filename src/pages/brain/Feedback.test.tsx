import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import feedbackReducer from '../../features/feedback/feedbackSlice';
import { FeedbackLogPage } from './Feedback';
import { capabilitiesForRole } from '../../test/capabilities';

const entries = [
  {
    id: 9, kind: 'classification' as const, kind_display: 'Classification corrected', subject_type: 'ticket', subject_id: 12,
    subject_label: 'Slow page load for large accounts',
    before: { area: 'support_operations', category: 'integration_support', subcategory: 'webhook_failure', sentiment: 'neutral' },
    after: { area: 'product_growth', category: 'bug_report', subcategory: 'performance_issue', sentiment: 'neutral' },
    note: "It's a perf bug, not a webhook.", made_by: 'Carl CSM', created_at: '2026-09-12T18:20:11Z',
  },
  {
    id: 8, kind: 'proposal' as const, kind_display: 'Proposal decided', subject_type: 'proposal', subject_id: 3,
    subject_label: 'Assign owner and initiate kickoff for Twilio account',
    before: { kind: 'task', action: {}, rationale: 'r' }, after: { decision: 'rejected' },
    note: 'Already in hand', made_by: 'Alice', created_at: '2026-09-12T18:00:00Z',
  },
  {
    id: 7, kind: 'health_override' as const, kind_display: 'Health score overridden', subject_type: 'customer', subject_id: 7,
    subject_label: 'Pizza Hut', before: { health_score: '4.9' }, after: { health_score_override: '7.0' },
    note: '', made_by: 'Carl CSM', created_at: '2026-09-12T17:00:00Z',
  },
];

function mockApi() {
  const spy = vi.fn<(url: string) => Promise<unknown>>((url) => {
    const kind = new URL(url, 'http://x').searchParams.get('kind');
    const rows = kind ? entries.filter((e) => e.kind === kind) : entries;
    return Promise.resolve({ ok: true, status: 200, json: async () => ({ counts: { classification: 1, proposal: 1, health_override: 1 }, feedback: rows }) });
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderPage(role: 'admin' | 'csm' = 'admin') {
  const store = configureStore({
    reducer: { auth: authReducer, feedback: feedbackReducer },
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
      <FeedbackLogPage />
    </Provider>
  );
}

describe('FeedbackLogPage', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('shows each correction as what the system said and what the person said', async () => {
    mockApi();
    renderPage();

    const row = (await screen.findByText('Slow page load for large accounts')).closest('li') as HTMLElement;
    expect(within(row).getByText('webhook_failure')).toHaveClass('line-through');
    expect(within(row).getByText('performance_issue')).toBeInTheDocument();
    // Unchanged fields are not listed as changes.
    expect(within(row).queryByText('sentiment:')).not.toBeInTheDocument();
    expect(within(row).getByText("“It's a perf bug, not a webhook.”")).toBeInTheDocument();
    const override = screen.getByText('Pizza Hut').closest('li') as HTMLElement;
    expect(within(override).getByText('4.9')).toHaveClass('line-through');
    expect(within(override).getByText('7.0')).toBeInTheDocument();
    const decided = screen.getByText(/Twilio/).closest('li') as HTMLElement;
    expect(within(decided).getByText('rejected')).toHaveClass('text-danger');
  });

  it('filters by kind, with counts on the tabs', async () => {
    const spy = mockApi();
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Slow page load for large accounts');
    expect(screen.getByRole('tab', { name: /All 3/ })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Proposals 1/ }));

    expect(await screen.findByText(/Twilio/)).toBeInTheDocument();
    expect(screen.queryByText('Slow page load for large accounts')).not.toBeInTheDocument();
    expect(spy.mock.calls.some(([url]) => String(url).includes('kind=proposal'))).toBe(true);
  });

  it('explains the gate to someone without view-all-accounts', () => {
    const spy = mockApi();
    renderPage('csm');

    expect(screen.getByText(/needs the view-all-accounts capability/)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });
});
