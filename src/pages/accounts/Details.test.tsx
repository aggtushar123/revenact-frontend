import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AccountDetails } from './Details';
import type { AccountRow } from '../../components/organizations/accountsData';
import customersReducer from '../../features/customers/customersSlice';
import authReducer from '../../features/auth/authSlice';
import copilotSessionsReducer from '../../features/copilotSessions/copilotSessionsSlice';
import { ALL_CAPABILITIES } from '../../test/capabilities';

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
  orgs: [{ id: 9, name: 'Kraft Heinz' }],
};

// ActivityFeed (rendered on the General tab, which is the default) fetches
// real Activities on mount whenever it has real ids to fetch with — every
// test below reaches that tab, so `fetch` needs stubbing regardless of
// what each test is actually asserting on.
function renderAccountDetails(state?: { account: AccountRow }) {
  const store = configureStore({
    reducer: { customers: customersReducer, auth: authReducer, copilotSessions: copilotSessionsReducer },
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
    expect(screen.getByText('$34.0K')).toBeInTheDocument();

    // A negative NPS is a detractor, not a promoter — the mock's old
    // hardcoded "Promoters 10" would fail this.
    const detractorsRow = screen.getByText('Detractors').closest('div')!.parentElement!;
    expect(detractorsRow).toHaveTextContent('1');
  });

  it('shows a real $0 ARR as $0.0, not the old hardcoded "$1.2M" fallback', () => {
    // A freshly-Added account (Add Account) genuinely has arr=0 — the old
    // `account.arr ? ... : '1.2M'` treated that falsy-but-real 0 as
    // "missing" and substituted a made-up placeholder instead.
    renderAccountDetails({ account: { ...apacDivision, arr: 0 } });

    expect(screen.getByText('$0.0')).toBeInTheDocument();
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
      // The default "All" filter is a merged stream of every source
      // now, so its empty state speaks for all of them rather than for
      // activities alone.
      expect(screen.getByText('No activity yet')).toBeInTheDocument();
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

  describe('Organizations tab (an Account can belong to more than one Customer)', () => {
    // `account.orgs` already rides along on the nav-state AccountRow
    // (see mapAccountToAccountRow) — this tab fetches nothing of its
    // own, unlike Contacts/Pipelines below.
    it('renders every organization this account is linked to, straight off the nav-state AccountRow', async () => {
      renderAccountDetails({ account: apacDivision });
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Organizations/ }));

      expect(await screen.findByText('Kraft Heinz')).toBeInTheDocument();
      expect(screen.getByText('Revenact ID 9')).toBeInTheDocument();
    });

    it('lists every linked organization, not just the first, when the account belongs to more than one', async () => {
      const multiOrgAccount = {
        ...apacDivision,
        orgs: [{ id: 9, name: 'Kraft Heinz' }, { id: 12, name: 'Mondelez International' }],
      };
      renderAccountDetails({ account: multiOrgAccount });
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Organizations/ }));

      expect(await screen.findByText('Kraft Heinz')).toBeInTheDocument();
      expect(screen.getByText('Mondelez International')).toBeInTheDocument();
    });

    it('shows a fallback message (not real data) when reached without navigation state', async () => {
      renderAccountDetails();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Organizations/ }));

      expect(
        await screen.findByText(/Reload this page from a real Accounts tab link/)
      ).toBeInTheDocument();
    });

    it('clicking an organization card navigates to its Organization Details page', async () => {
      const store = configureStore({
    reducer: { customers: customersReducer, auth: authReducer, copilotSessions: copilotSessionsReducer },
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
          <MemoryRouter initialEntries={[{ pathname: '/accounts/17', state: { account: apacDivision } }]}>
            <Routes>
              <Route path="/accounts/:id" element={<AccountDetails />} />
              <Route path="/organizations/:id" element={<div>ORG PAGE</div>} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Organizations/ }));
      await user.click(await screen.findByText('Kraft Heinz'));

      expect(await screen.findByText('ORG PAGE')).toBeInTheDocument();
    });
  });

  describe('Contacts tab (real Contacts, own nested endpoint — a sibling tab, not an ActivityFeed filter)', () => {
    it('fetches and renders this account\'s own contacts, from its own nested endpoint', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: async () =>
              url.includes(`/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/contacts/`)
                ? [
                    {
                      id: 1,
                      name: 'Priya Nair',
                      role: 'economic_buyer',
                      role_display: 'Economic Buyer',
                      email: 'priya.nair@kraftheinz.com',
                      phone: '+1 (312) 555-0202',
                      status: 'active',
                      sentiment: 'positive',
                      last_contacted_at: '2026-08-31T00:00:00Z',
                      companies: [{ id: 9, name: 'Kraft Heinz' }],
                      account_name: 'APAC Division',
                    },
                  ]
                : [],
          })
        )
      );

      renderAccountDetails({ account: apacDivision });
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Contacts/ }));

      expect(await screen.findByText('Priya Nair')).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/contacts/`),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('shows no contacts (not a stale or hardcoded set) when reached without navigation state', async () => {
      renderAccountDetails();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Contacts/ }));

      expect(await screen.findByText('No contacts found.')).toBeInTheDocument();
    });

    it('disables "Add Contact" when reached without navigation state (no real account id to post against)', async () => {
      renderAccountDetails();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Contacts/ }));
      await screen.findByText('No contacts found.');

      expect(screen.getByRole('button', { name: 'Add Contact' })).toBeDisabled();
    });

    const priyaNair = {
      id: 1,
      name: 'Priya Nair',
      role: 'economic_buyer',
      role_display: 'Economic Buyer',
      email: 'priya.nair@kraftheinz.com',
      phone: '+1 (312) 555-0202',
      status: 'active',
      sentiment: 'positive',
      last_contacted_at: '2026-08-31T00:00:00Z',
      companies: [{ id: 9, name: 'Kraft Heinz' }],
      account_name: 'APAC Division',
    };
    const lukasVermeer = {
      ...priyaNair,
      id: 2,
      name: 'Lukas Vermeer',
      role_display: 'Finance Manager',
      email: 'lukas.vermeer@kraftheinz.com',
    };
    const contactsUrl = `/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/contacts/`;

    async function openContactsTab(fetchMock: ReturnType<typeof vi.fn>) {
      vi.stubGlobal('fetch', fetchMock);
      renderAccountDetails({ account: apacDivision });
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Contacts/ }));
      await screen.findByText('Priya Nair');
      return user;
    }

    it('filters the already-loaded contacts client-side as you type', async () => {
      const fetchMock = vi.fn((url: string) =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => (url.includes(contactsUrl) ? [priyaNair, lukasVermeer] : []),
        })
      );
      const user = await openContactsTab(fetchMock);
      expect(screen.getByText('Lukas Vermeer')).toBeInTheDocument();

      await user.type(screen.getByPlaceholderText('Search contacts by name, role or email...'), 'priya');

      expect(screen.queryByText('Lukas Vermeer')).not.toBeInTheDocument();
      expect(screen.getByText('Priya Nair')).toBeInTheDocument();
    });

    it('adding a contact posts to the account-level nested endpoint', async () => {
      const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'POST' && url.endsWith(contactsUrl)) {
          return Promise.resolve({
            ok: true,
            status: 201,
            json: async () => ({ ...priyaNair, id: 99, name: 'New Person' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => (url.includes(contactsUrl) ? [priyaNair] : []),
        });
      });
      const user = await openContactsTab(fetchMock);

      await user.click(screen.getByRole('button', { name: 'Add Contact' }));
      await user.type(screen.getByLabelText('Name *'), 'New Person');
      await user.type(screen.getByLabelText('Email *'), 'new.person@kraftheinz.com');
      const submitButton = screen
        .getAllByRole('button', { name: 'Add Contact' })
        .find((btn) => btn.closest('form'))!;
      await user.click(submitButton);

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining(contactsUrl),
          expect.objectContaining({ method: 'POST' })
        )
      );
    });

    it('editing a contact PATCHes /api/v1/contacts/<id>/ and updates it in place', async () => {
      const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'PATCH' && url.endsWith('/contacts/1/')) {
          const body = JSON.parse(options!.body!);
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ ...priyaNair, ...body }) });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => (url.includes(contactsUrl) ? [priyaNair] : []),
        });
      });
      const user = await openContactsTab(fetchMock);

      await user.click(screen.getByRole('button', { name: 'Actions for Priya Nair' }));
      await user.click(screen.getByRole('button', { name: 'Edit Contact' }));
      const nameInput = screen.getByLabelText('Name *');
      await user.clear(nameInput);
      await user.type(nameInput, 'Priya Nair-Kapoor');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/contacts/1/'),
          expect.objectContaining({ method: 'PATCH' })
        )
      );
      expect(await screen.findByText('Priya Nair-Kapoor')).toBeInTheDocument();
    });

    it('deleting a contact DELETEs /api/v1/contacts/<id>/ and removes the row', async () => {
      const fetchMock = vi.fn((url: string, options?: { method?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'DELETE' && url.endsWith('/contacts/1/')) {
          return Promise.resolve({ ok: true, status: 204, json: async () => null });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => (url.includes(contactsUrl) ? [priyaNair] : []),
        });
      });
      const user = await openContactsTab(fetchMock);

      await user.click(screen.getByRole('button', { name: 'Actions for Priya Nair' }));
      await user.click(screen.getByRole('button', { name: 'Delete Contact' }));
      await user.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/contacts/1/'),
          expect.objectContaining({ method: 'DELETE' })
        )
      );
      expect(screen.queryByText('Priya Nair')).not.toBeInTheDocument();
    });
  });

  describe('Pipelines tab (real Opportunities/Risks, own nested endpoints — a sibling tab, not an ActivityFeed filter)', () => {
    const opportunitiesUrl = `/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/opportunities/`;
    const risksUrl = `/customers/${apacDivision.orgId}/accounts/${apacDivision.revenactId}/risks/`;

    const seatExpansion = {
      id: 1,
      title: 'Seat Expansion — Q3 Rollout',
      mrr: '16000.00',
      stage: 'discovery',
      stage_display: 'Discovery',
      priority: 'medium',
      priority_display: 'Medium',
      companies: [{ id: 9, name: 'Kraft Heinz' }],
      account_name: 'APAC Division',
    };
    const regionalRisk = {
      id: 1,
      title: 'Regional Expansion Proposal Risk',
      mrr: '17000.00',
      stage: 'open',
      stage_display: 'Open',
      priority: 'medium',
      priority_display: 'Medium',
      companies: [{ id: 9, name: 'Kraft Heinz' }],
      account_name: 'APAC Division',
    };

    it('fetches and renders this account\'s own opportunities and risks, from their own nested endpoints', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
          if (url.includes(opportunitiesUrl)) {
            return Promise.resolve({ ok: true, status: 200, json: async () => [seatExpansion] });
          }
          if (url.includes(risksUrl)) {
            return Promise.resolve({ ok: true, status: 200, json: async () => [regionalRisk] });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => [] });
        })
      );

      renderAccountDetails({ account: apacDivision });
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Pipelines/ }));

      expect(await screen.findByText('Seat Expansion — Q3 Rollout')).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(opportunitiesUrl),
        expect.objectContaining({ method: 'GET' })
      );

      await user.click(screen.getByRole('button', { name: /^Risks/ }));
      expect(await screen.findByText('Regional Expansion Proposal Risk')).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(risksUrl),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('shows no opportunities (not a stale or hardcoded set) when reached without navigation state', async () => {
      renderAccountDetails();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Pipelines/ }));

      expect(await screen.findByText('No opportunities found.')).toBeInTheDocument();
    });

    it('disables "Add Opportunity" when reached without navigation state (no real account id to post against)', async () => {
      renderAccountDetails();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Pipelines/ }));
      await screen.findByText('No opportunities found.');

      expect(screen.getByRole('button', { name: 'Add Opportunity' })).toBeDisabled();
    });

    async function openPipelinesTab(fetchMock: ReturnType<typeof vi.fn>) {
      vi.stubGlobal('fetch', fetchMock);
      renderAccountDetails({ account: apacDivision });
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Pipelines/ }));
      await screen.findByText('Seat Expansion — Q3 Rollout');
      return user;
    }

    it('adding an opportunity posts to the account-level nested endpoint, with no Account picker shown', async () => {
      let opportunitiesData: unknown[] = [seatExpansion];
      const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'POST' && url.endsWith(opportunitiesUrl)) {
          const created = { ...seatExpansion, id: 99, title: 'New Opp' };
          opportunitiesData = [...opportunitiesData, created];
          return Promise.resolve({ ok: true, status: 201, json: async () => created });
        }
        if (url.includes(opportunitiesUrl)) {
          return Promise.resolve({ ok: true, status: 200, json: async () => opportunitiesData });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => [] });
      });
      const user = await openPipelinesTab(fetchMock);

      await user.click(screen.getByRole('button', { name: 'Add Opportunity' }));
      // Already scoped to one specific account (accountId is fixed) —
      // no Company/Account picker to interact with, unlike the
      // Organization Details page's own Pipelines tab.
      expect(screen.queryByLabelText('Company *')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Account (optional)')).not.toBeInTheDocument();
      await user.type(screen.getByLabelText('Title *'), 'New Opp');
      const submitButton = screen
        .getAllByRole('button', { name: 'Add Opportunity' })
        .find((btn) => btn.closest('form'))!;
      await user.click(submitButton);

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining(opportunitiesUrl),
          expect.objectContaining({ method: 'POST' })
        )
      );
      expect(await screen.findByText('New Opp')).toBeInTheDocument();
    });

    it('editing an opportunity PATCHes /api/v1/opportunities/<id>/ and updates it in place', async () => {
      const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'PATCH' && url.endsWith('/opportunities/1/')) {
          const body = JSON.parse(options!.body!);
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ ...seatExpansion, ...body }) });
        }
        if (url.includes(opportunitiesUrl)) {
          return Promise.resolve({ ok: true, status: 200, json: async () => [seatExpansion] });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => [] });
      });
      const user = await openPipelinesTab(fetchMock);

      await user.click(screen.getByText('Seat Expansion — Q3 Rollout'));
      const titleInput = screen.getByLabelText('Title *');
      await user.clear(titleInput);
      await user.type(titleInput, 'Renamed Opportunity');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/opportunities/1/'),
          expect.objectContaining({ method: 'PATCH' })
        )
      );
      expect(await screen.findByText('Renamed Opportunity')).toBeInTheDocument();
    });

    it('deleting an opportunity from its edit modal DELETEs /api/v1/opportunities/<id>/ and removes the row', async () => {
      const fetchMock = vi.fn((url: string, options?: { method?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'DELETE' && url.endsWith('/opportunities/1/')) {
          return Promise.resolve({ ok: true, status: 204, json: async () => null });
        }
        if (url.includes(opportunitiesUrl)) {
          return Promise.resolve({ ok: true, status: 200, json: async () => [seatExpansion] });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => [] });
      });
      const user = await openPipelinesTab(fetchMock);

      await user.click(screen.getByText('Seat Expansion — Q3 Rollout'));
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
      await user.click(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/opportunities/1/'),
          expect.objectContaining({ method: 'DELETE' })
        )
      );
      expect(screen.queryByText('Seat Expansion — Q3 Rollout')).not.toBeInTheDocument();
    });

    it('switching to the Risks sub-tab shows risks instead, and Add Risk posts to the account-level nested endpoint', async () => {
      let risksData: unknown[] = [regionalRisk];
      const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'POST' && url.endsWith(risksUrl)) {
          const created = { ...regionalRisk, id: 99, title: 'New Risk' };
          risksData = [...risksData, created];
          return Promise.resolve({ ok: true, status: 201, json: async () => created });
        }
        if (url.includes(opportunitiesUrl)) {
          return Promise.resolve({ ok: true, status: 200, json: async () => [seatExpansion] });
        }
        if (url.includes(risksUrl)) {
          return Promise.resolve({ ok: true, status: 200, json: async () => risksData });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => [] });
      });
      const user = await openPipelinesTab(fetchMock);

      await user.click(screen.getByRole('button', { name: /^Risks/ }));
      expect(await screen.findByText('Regional Expansion Proposal Risk')).toBeInTheDocument();
      expect(screen.queryByText('Seat Expansion — Q3 Rollout')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Add Risk' }));
      expect(screen.queryByLabelText('Company *')).not.toBeInTheDocument();
      await user.type(screen.getByLabelText('Title *'), 'New Risk');
      const submitButton = screen
        .getAllByRole('button', { name: 'Add Risk' })
        .find((btn) => btn.closest('form'))!;
      await user.click(submitButton);

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining(risksUrl),
          expect.objectContaining({ method: 'POST' })
        )
      );
      expect(await screen.findByText('New Risk')).toBeInTheDocument();
    });
  });
});
