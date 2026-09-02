import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AccountDetails } from './Details';
import type { AccountRow } from '../../components/organizations/accountsData';
import customersReducer from '../../features/customers/customersSlice';

// Real-shaped AccountRow, the kind organizations/Details.tsx's AccountsTab
// passes through navigate()'s state when a row is clicked — see that
// file and mapToAccountRow.test.ts for the full field list.
const apacDivision: AccountRow = {
  orgId: 9,
  id: '17',
  name: 'APAC Division',
  orgName: 'Kraft Heinz',
  logo: 'https://logo.clearbit.com/kraftheinz.com',
  revenactId: 17,
  pulse: [],
  aiPulseScore: '—',
  aiPulseReason: '-',
  owner: 'Unassigned',
  avatar: '—',
  health: { val: 6.2, clr: 'bg-[var(--warning)]' },
  healthCategory: 'average',
  nps: '-20',
  npsValue: -20,
  csat: '45%',
  csatValue: 45,
  lifecycleStage: 'Onboarding',
  mrr: 2833,
  arr: 34000,
  renewal: '-',
};

// ActivityFeed (rendered on the General tab, which is the default) fetches
// real Activities on mount whenever it has real ids to fetch with — every
// test below reaches that tab, so `fetch` needs stubbing regardless of
// what each test is actually asserting on.
function renderAccountDetails(state?: { account: AccountRow }) {
  const store = configureStore({ reducer: { customers: customersReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[{ pathname: '/accounts/17', state }]}>
        <Routes>
          <Route path="/accounts/:id" element={<AccountDetails />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('AccountDetails page (/accounts/:id)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => [] }))
    );
  });

  it('renders every metric from the real AccountRow passed via navigation state, not hardcoded placeholders', () => {
    // These used to be hardcoded regardless of which account was passed
    // in (9.3/100/100, "Very Satisfied", Promoters 10/Passives 0/
    // Detractors 0) — this pins them down as actually derived.
    renderAccountDetails({ account: apacDivision });

    expect(screen.getByText('APAC Division')).toBeInTheDocument();
    expect(screen.getByText('6.2')).toBeInTheDocument();
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Neutral')).toBeInTheDocument(); // CSM Pulse: health 4-6.9
    expect(screen.getByText('-20')).toBeInTheDocument(); // NPS, no leading '+'
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('$34K')).toBeInTheDocument();

    // A negative NPS is a detractor, not a promoter — the mock's old
    // hardcoded "Promoters 10" would fail this.
    const detractorsRow = screen.getByText('Detractors').closest('div')!.parentElement!;
    expect(detractorsRow).toHaveTextContent('1');
  });

  it('shows a real $0 ARR as $0, not the old hardcoded "$1.2M" fallback', () => {
    // A freshly-Added account (Add Account) genuinely has arr=0 — the old
    // `account.arr ? ... : '1.2M'` treated that falsy-but-real 0 as
    // "missing" and substituted a made-up placeholder instead.
    renderAccountDetails({ account: { ...apacDivision, arr: 0 } });

    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.queryByText('$1.2M')).not.toBeInTheDocument();
  });

  it('falls back to the mock data when reached without navigation state (a direct URL visit or refresh)', () => {
    renderAccountDetails();

    expect(screen.queryByText('APAC Division')).not.toBeInTheDocument();
    // ACCOUNTS_DATA[0]'s own real mock health (9.5), not the old
    // hardcoded 9.3 that didn't even match it.
    expect(screen.getByText('9.5')).toBeInTheDocument();
  });

  describe('Activity Feed (real Activities, not the same mock for every account)', () => {
    // The bug this whole feature replaced: ACCOUNT_ID_MAP's `?? 101`
    // fallback made every real account show the exact same hardcoded
    // activities. This pins down the fix — a real account's own
    // orgId/revenactId (from the navigated AccountRow) must reach the
    // correctly-nested endpoint, and its own distinct activity content
    // must be what actually renders.
    it('fetches and renders this account\'s own activities, from its own nested endpoint', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: async () =>
              url.includes(`/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/activities/`)
                ? [
                    {
                      id: 1,
                      type: 'escalation_triggered',
                      type_display: 'Escalation Triggered',
                      occurred_at: '2026-03-02',
                      links: 1,
                      watchers: 5,
                    },
                  ]
                : [],
          })
        )
      );

      renderAccountDetails({ account: apacDivision });

      expect(await screen.findByText('Escalation Triggered')).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/activities/`
        ),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('a different account fetches its own activities, not the first account\'s', async () => {
      const otherAccount: AccountRow = {
        ...apacDivision,
        orgId: 6,
        id: '6',
        revenactId: 6,
        name: 'Heinz Europe',
      };
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: async () =>
              url.includes(`/customers/${otherAccount.orgId}/accounts/${otherAccount.revenactId}/activities/`)
                ? [
                    {
                      id: 2,
                      type: 'success_plan_created',
                      type_display: 'Success Plan Created',
                      occurred_at: '2026-03-01',
                      links: 2,
                      watchers: 1,
                    },
                  ]
                : [],
          })
        )
      );

      renderAccountDetails({ account: otherAccount });

      expect(await screen.findByText('Success Plan Created')).toBeInTheDocument();
      expect(screen.queryByText('Escalation Triggered')).not.toBeInTheDocument();
    });

    it('shows no activities (not a stale or hardcoded set) when reached without navigation state', async () => {
      renderAccountDetails();

      await screen.findByText('9.5'); // page finished rendering the mock fallback
      expect(screen.getByText('No activities found')).toBeInTheDocument();
    });
  });

  describe('Email Feed (real Emails, same wiring as Activities)', () => {
    it('fetches and renders this account\'s own emails, from its own nested endpoint', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: async () =>
              url.includes(`/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/emails/`)
                ? [
                    {
                      id: 1,
                      subject: 'Usage Analysis — APAC Division',
                      sender_name: 'Sarah Chen',
                      recipient_name: 'Edgar Holmes',
                      body: 'Usage in the APAC division ticked up after the new rollout.',
                      sent_at: '2026-07-15T09:30:00Z',
                      links: 1,
                      watchers: 2,
                      is_starred: false,
                    },
                  ]
                : [],
          })
        )
      );

      renderAccountDetails({ account: apacDivision });
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Emails' }));

      expect(await screen.findByText('Usage Analysis — APAC Division')).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/emails/`),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('shows no emails (not a stale or hardcoded set) when reached without navigation state', async () => {
      renderAccountDetails();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Emails' }));

      expect(await screen.findByText('No emails found')).toBeInTheDocument();
    });
  });

  describe('Task Feed (real Tasks, same wiring as Activities)', () => {
    it('fetches and renders this account\'s own tasks, from its own nested endpoint', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: async () =>
              url.includes(`/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/tasks/`)
                ? [
                    {
                      id: 1,
                      title: 'Review APAC usage uptick',
                      assignee_name: 'Sarah Chen',
                      due_date: '2026-07-15',
                      priority: 'low',
                      status: 'completed',
                    },
                  ]
                : [],
          })
        )
      );

      renderAccountDetails({ account: apacDivision });
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Tasks' }));

      expect(await screen.findByText('Review APAC usage uptick')).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/tasks/`),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('shows no tasks (not a stale or hardcoded set) when reached without navigation state', async () => {
      renderAccountDetails();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Tasks' }));

      expect(await screen.findByText('No tasks found')).toBeInTheDocument();
    });
  });

  describe('Notes Feed (real Notes, same wiring as Activities)', () => {
    it('fetches and renders this account\'s own notes, from its own nested endpoint', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: async () =>
              url.includes(`/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/notes/`)
                ? [
                    {
                      id: 1,
                      title: 'Usage Uptick Notes',
                      author_name: 'Sarah Chen',
                      body: 'Adoption ticked up noticeably after the new regional rollout completed.',
                      logged_at: '2026-07-15',
                      links: 1,
                    },
                  ]
                : [],
          })
        )
      );

      renderAccountDetails({ account: apacDivision });
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Notes' }));

      expect(await screen.findByText('Usage Uptick Notes')).toBeInTheDocument();
      expect(screen.getByText('1 Links')).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/notes/`),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('shows no notes (not a stale or hardcoded set) when reached without navigation state', async () => {
      renderAccountDetails();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Notes' }));

      expect(await screen.findByText('No notes found')).toBeInTheDocument();
    });
  });

  describe('Tickets Feed (real Tickets, same wiring as Activities)', () => {
    it('fetches and renders this account\'s own tickets, from its own nested endpoint', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: async () =>
              url.includes(`/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/tickets/`)
                ? [
                    {
                      id: 1,
                      ticket_number: 'TKT-2005',
                      title: 'Usage dashboard not loading for APAC users',
                      assignee_name: 'Engineering',
                      status: 'in-progress',
                      priority: 'high',
                      opened_at: '2026-07-15',
                      links: 1,
                    },
                  ]
                : [],
          })
        )
      );

      renderAccountDetails({ account: apacDivision });
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Tickets' }));

      expect(await screen.findByText(/Usage dashboard not loading for APAC users/)).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/tickets/`),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('shows no tickets (not a stale or hardcoded set) when reached without navigation state', async () => {
      renderAccountDetails();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Tickets' }));

      expect(await screen.findByText('No tickets found')).toBeInTheDocument();
    });
  });

  describe('Calendar Events Feed (real events, same wiring as Activities)', () => {
    it('fetches and renders this account\'s own calendar events, from its own nested endpoint', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: async () =>
              url.includes(`/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/calendar-events/`)
                ? [
                    {
                      id: 1,
                      title: 'Usage Review',
                      description: 'Review the APAC division\'s usage uptick',
                      type: 'review',
                      event_date: '2026-07-15',
                      start_time: '10:00:00',
                      end_time: '10:30:00',
                      attendee_count: 2,
                    },
                  ]
                : [],
          })
        )
      );

      renderAccountDetails({ account: apacDivision });
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Calendar Events' }));

      expect(await screen.findByText('Usage Review')).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/calendar-events/`),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('shows no calendar events (not a stale or hardcoded set) when reached without navigation state', async () => {
      renderAccountDetails();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Calendar Events' }));

      expect(await screen.findByText('No calendar events')).toBeInTheDocument();
    });
  });
});
