import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import activityReducer from '../../../../features/activity/activitySlice';
import { ActivityContainer } from '../ActivityContainer';
import { ControlsView } from './ControlsView';

// Integration tier: container + view + charts through the real router, with
// only the fetch boundary mocked. The two Recharts charts need a sized
// container jsdom won't give them, so they are asserted on through their own
// headline text; the lists and tiles are plain DOM.

const stats = {
  window_days: 90,
  kpis: {
    touches: 144,
    inbound: 220,
    accounts: 12,
    touched_accounts: 9,
    coverage: 75.0,
    dark_accounts: 2,
    dark_arr: 93_600,
    open_tasks: 29,
    overdue_tasks: 25,
    completed_tasks: 7,
  },
  timeline: [
    { date: 'Jun 8', iso: '2026-06-08', activities: 1, calls: 0, emails: 1, notes: 0, meetings: 0 },
    { date: 'Jun 15', iso: '2026-06-15', activities: 1, calls: 2, emails: 2, notes: 1, meetings: 1 },
  ],
  sources: [
    { key: 'activities', name: 'Activities', count: 29 },
    { key: 'calls', name: 'Calls', count: 45 },
    { key: 'emails', name: 'Emails', count: 30 },
    { key: 'notes', name: 'Notes', count: 20 },
    { key: 'meetings', name: 'Meetings', count: 20 },
  ],
  cadence: [
    { key: 'week', name: 'This week', accounts: 4, arr: 300_000 },
    { key: 'month', name: '8–30 days', accounts: 5, arr: 400_000 },
    { key: 'stale', name: '31–60 days', accounts: 1, arr: 131_100 },
    { key: 'dark', name: '61–90 days', accounts: 1, arr: 69_600 },
    { key: 'cold', name: '90+ days', accounts: 0, arr: 0 },
    { key: 'never', name: 'No contact logged', accounts: 1, arr: 24_000 },
  ],
  by_owner: [
    { owner: 'Carl CSM', accounts: 9, touched: 7, dark: 2, arr_dark: 93_600 },
    { owner: 'Unassigned', accounts: 3, touched: 2, dark: 0, arr_dark: 0 },
  ],
  going_dark: [
    {
      id: 21,
      name: 'WeWork',
      owner: 'Unassigned',
      arr: 24_000,
      health_category: 'poor' as const,
      lifecycle_stage: 'Churn',
      last_contact: null,
      days_since_contact: null,
      days_since_activity: 412,
      renewal_date: null,
    },
    {
      id: 14,
      name: 'Pizza Hut',
      owner: 'Carl CSM',
      arr: 69_600,
      health_category: 'poor' as const,
      lifecycle_stage: 'Live',
      last_contact: '2026-06-20',
      days_since_contact: 84,
      days_since_activity: 194,
      renewal_date: '2026-08-09',
    },
  ],
  going_dark_threshold: 60,
  currency: 'USD' as const,
  filters: {
    owners: [
      { value: '5', name: 'Carl CSM' },
      { value: 'unassigned', name: 'Unassigned' },
    ],
    lifecycles: [{ value: 'live', name: 'Live' }],
    customers: [{ value: '14', name: 'Pizza Hut' }],
  },
};

function mockFetch(body: unknown = stats, status = 200) {
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>(() =>
    Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body })
  );
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderDashboard() {
  const store = configureStore({ reducer: { activity: activityReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/activity/controls']}>
        <Routes>
          <Route path="/activity" element={<ActivityContainer />}>
            <Route path="controls" element={<ControlsView />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return store;
}

const lastUrl = (spy: ReturnType<typeof mockFetch>) =>
  spy.mock.calls[spy.mock.calls.length - 1][0];

const tile = (label: string) => screen.getByText(label).parentElement as HTMLElement;

describe('Activity Tracking', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches on mount with an explicit window', async () => {
    const fetchMock = mockFetch();
    renderDashboard();

    await waitFor(() => expect(lastUrl(fetchMock)).toContain('/customers/activity/'));
    expect(lastUrl(fetchMock)).toContain('days=90');
  });

  it('counts touches and shows inbound tickets beside them, not inside them', async () => {
    // A screen full of complaints must not read as a screen full of coverage.
    mockFetch();
    renderDashboard();

    await screen.findByText('Touches logged');
    expect(within(tile('Touches logged')).getByText('144')).toBeInTheDocument();
    expect(
      within(tile('Touches logged')).getByText('220 inbound tickets in the same 90 days')
    ).toBeInTheDocument();
  });

  it('reports coverage against the whole book', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('Coverage');
    expect(within(tile('Coverage')).getByText('75%')).toBeInTheDocument();
    expect(
      within(tile('Coverage')).getByText('9 of 12 accounts contacted')
    ).toBeInTheDocument();
  });

  it('shows a dash rather than 0% coverage on an empty book', async () => {
    mockFetch({
      ...stats,
      kpis: { ...stats.kpis, accounts: 0, coverage: null, touched_accounts: 0 },
    });
    renderDashboard();

    await screen.findByText('Coverage');
    expect(within(tile('Coverage')).getByText('—')).toBeInTheDocument();
  });

  it('puts money on the accounts that have gone quiet', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('Gone quiet');
    expect(within(tile('Gone quiet')).getByText('2')).toBeInTheDocument();
    expect(
      within(tile('Gone quiet')).getByText('$93.6K with no contact in 60 days')
    ).toBeInTheDocument();
  });

  it('says so when nothing has gone quiet', async () => {
    mockFetch({ ...stats, kpis: { ...stats.kpis, dark_accounts: 0, dark_arr: 0 }, going_dark: [] });
    renderDashboard();

    await screen.findByText('Gone quiet');
    expect(
      within(tile('Gone quiet')).getByText('everything contacted inside 60 days')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Every account in this selection has been contacted inside 60 days.')
    ).toBeInTheDocument();
  });

  it('leads the task tile with what is overdue', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('Overdue tasks');
    expect(within(tile('Overdue tasks')).getByText('25')).toBeInTheDocument();
    expect(
      within(tile('Overdue tasks')).getByText('of 29 open · 7 completed')
    ).toBeInTheDocument();
  });

  it('ranks the quiet list with never-contacted first', async () => {
    // An account with no contact on record is a different fact from one last
    // called in March, and the worse one.
    mockFetch();
    renderDashboard();

    const rows = (await screen.findAllByRole('row')).slice(1);

    expect(within(rows[0]).getByText('WeWork')).toBeInTheDocument();
    expect(within(rows[0]).getByText('never contacted')).toBeInTheDocument();
    expect(within(rows[1]).getByText('84d')).toBeInTheDocument();
  });

  it('shows the rubric\'s narrower measure when it disagrees', async () => {
    // Both numbers are true; they count different things, and a row that
    // showed one without the other would look like a contradiction.
    mockFetch();
    renderDashboard();

    const rows = (await screen.findAllByRole('row')).slice(1);

    expect(within(rows[1]).getByText(/194d since an activity/)).toBeInTheDocument();
  });

  it('shows coverage per book and says it is not a productivity score', async () => {
    mockFetch();
    renderDashboard();

    expect(await screen.findByText('Coverage by book')).toBeInTheDocument();
    expect(screen.getByText(/not by who logged the work/)).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Carl CSM: 7 of 9 accounts touched, 2 gone quiet/ })
    ).toBeInTheDocument();
  });

  it('names the two definitions of contact under the cadence chart', async () => {
    mockFetch();
    renderDashboard();

    expect(await screen.findByText('Contact cadence')).toBeInTheDocument();
    expect(screen.getByText(/counts logged activities only, so the two can differ/)).toBeInTheDocument();
  });

  it('draws the timeline with its own totals', async () => {
    mockFetch();
    renderDashboard();

    expect(await screen.findByText('Logged work')).toBeInTheDocument();
    expect(screen.getByText('144 touches')).toBeInTheDocument();
    expect(screen.getByText('220 inbound tickets')).toBeInTheDocument();
  });

  it('says so when nothing was logged in the window', async () => {
    mockFetch({ ...stats, timeline: [], sources: [] });
    renderDashboard();

    expect(
      await screen.findByText('Nothing logged against these accounts in this window.')
    ).toBeInTheDocument();
  });

  // ── the bar ───────────────────────────────────────────────────────

  it('refetches when the window changes', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('Window');
    await user.selectOptions(screen.getByLabelText('Window'), '30');

    await waitFor(() => expect(lastUrl(fetchMock)).toContain('days=30'));
  });

  it('keeps the window when filters are cleared', async () => {
    // The window is the question being asked, not a filter on the book.
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('Window');
    await user.selectOptions(screen.getByLabelText('Window'), '365');
    await user.selectOptions(screen.getByLabelText('Primary Owner'), '5');
    await user.click(await screen.findByRole('button', { name: 'Clear 1' }));

    await waitFor(() => expect(lastUrl(fetchMock)).not.toContain('owner='));
    expect(lastUrl(fetchMock)).toContain('days=365');
  });

  // ── failure states ────────────────────────────────────────────────

  it('surfaces a failed fetch', async () => {
    mockFetch({ detail: 'Server exploded' }, 500);
    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Server exploded|Could not load/);
  });

  it('keeps the previous numbers when a refetch fails', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('75%');

    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: false, status: 500, json: async () => ({ detail: 'Nope' }) })
    );
    await user.selectOptions(screen.getByLabelText('Primary Owner'), '5');

    await screen.findByRole('alert');
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});
