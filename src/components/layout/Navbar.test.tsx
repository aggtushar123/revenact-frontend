import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import customersReducer from '../../features/customers/customersSlice';
import notificationsReducer from '../../features/notifications/notificationsSlice';
import type { Notification } from '../../features/notifications/types';
import * as notificationApi from '../../features/notifications/notificationApi';
import { Navbar } from './Navbar';
import { ALL_CAPABILITIES } from '../../test/capabilities';

// The bell dropdown calls the real API on click (optimistic local update +
// a real sync call, see Navbar.tsx's own handleNotificationClick/
// handleMarkAllRead) — mocked here the same way pages elsewhere in this
// suite mock their own API modules, so these tests exercise the real
// dispatch/navigate wiring without a real network call.
vi.mock('../../features/notifications/notificationApi');

const mockUser = {
  id: 1,
  email: 'alice@acme.io',
  name: 'Alice Admin',
  avatar: 'https://i.pravatar.cc/150?u=alice@acme.io',
  role: 'admin' as const,
  role_id: 1,
  role_name: 'Admin',
  permissions: ALL_CAPABILITIES,
  function: 'cs' as const, function_display: 'Customer Success', reports_to: null,
  organisation: { id: 1, name: 'Acme Inc', slug: 'acme-inc', currency: 'USD' as const, currency_display: 'US Dollar ($)', default_lifecycle_stage: '', ai_agent_enabled: true, ai_agent_tone: 'professional' as const, ai_agent_tone_display: 'Professional' },
  is_active: true,
};

// Minimal but real shape, matching revenact-backend's CustomerSerializer —
// see customersSlice.test.ts / docs/API_CONTRACTS.md -> customers.
const globex = {
  id: 10,
  name: 'Globex Corp',
  address: '',
  domain: 'globex.example',
  industry: '',
  email: '',
  phone: '',
  owner: null,
  created_by: null,
  modified_by: null,
  created_at: '2026-08-31T00:00:00Z',
  updated_at: '2026-08-31T00:00:00Z',
  lifecycle_stage: 'onboarding' as const,
  health_score: '5.0',
  health_category: 'average' as const,
  pulse: [],
  ai_pulse_score: '' as const,
  health_score_is_overridden: false,
  csat_breakdown: { responses: 0, bands: [] },
  health_breakdown: [],
  ai_pulse_reason: '',
  nps_score: null,
  csat_score: null,
  joined_date: null,
  renewal_date: null,
  contract_start_date: null,
  contract_end_date: null,
  currency: 'USD' as const,
  currency_display: 'US Dollar ($)',
  arr_billed_at_account: '0.00',
  arr_billed_at_hq: '0.00',
  implementation_fee: '0.00',
  total_contract_value: '0.00',
  total_forecasted_renewal_revenue: '0.00',
  primary_product: null,
  primary_product_name: '',
  additional_products_count: null,
  top_source_channel: '',
  total_contracted_seats: null,
  total_active_seats: null,
  seat_utilization_percentage: null,
  total_hires: null,
  scope_web_app: '',
  ces_percentage: null,
  churn_date: null,
  churn_reason: '' as const,
  churn_reason_display: '',
  churn_comment: '',
  is_archived: false,
};

// Minimal but real shape, matching revenact-backend's ContactSerializer
// — see customersSlice.test.ts / docs/API_CONTRACTS.md -> Contact.
const sarahChen = {
  id: 1,
  name: 'Sarah Chen',
  role: 'executive_sponsor' as const,
  role_display: 'Executive Sponsor',
  email: 'sarah.chen@globex.com',
  phone: '+1 (408) 555-0123',
  status: 'active' as const,
  sentiment: 'positive' as const,
  last_contacted_at: '2026-08-31T00:00:00Z',
  companies: [{ id: 10, name: 'Globex Corp' }],
  account_name: null,
};

function renderNavbar(
  initialRoute: string | { pathname: string; state?: unknown } = '/dashboard',
  selectedCustomer: typeof globex | null = null,
  selectedContact: typeof sarahChen | null = null,
  notifications: Notification[] = []
) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      customers: customersReducer,
      notifications: notificationsReducer,
    },
    preloadedState: {
      notifications: { items: notifications },
      auth: {
        user: mockUser,
        accessToken: 'access.jwt',
        refreshToken: 'refresh.jwt',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
      customers: {
        customers: [],
        count: 0,
        totalCount: 0,
        next: null,
        previous: null,
        isLoading: false,
        error: null,
        renewals: [],
        renewalsCount: 0,
        renewalsLoading: false,
        renewalsError: null,
        stats: null,
        statsLoading: false,
        statsError: null,
        selectedCustomer,
        selectedCustomerLoading: false,
        selectedCustomerError: null,
        accountsForCustomer: [],
        accountsLoading: false,
        accountsError: null,
        allAccounts: [],
        allAccountsCount: 0,
        allAccountsNext: null,
        allAccountsPrevious: null,
        allAccountsLoading: false,
        allAccountsError: null,
        accountStats: null,
        accountStatsLoading: false,
        accountStatsError: null,
        activities: [],
        activitiesLoading: false,
        activitiesError: null,
        emails: [],
        emailsLoading: false,
        emailsError: null,
        tasks: [],
        tasksLoading: false,
        tasksError: null,
        notes: [],
        notesLoading: false,
        notesError: null,
        headlines: [],
        headlinesLoading: false,
        headlinesError: null,
        headlinesGenerating: false,
        headlinesGenerateError: null,
        tickets: [],
        ticketsLoading: false,
        ticketsError: null,
        calendarEvents: [],
        calendarEventsLoading: false,
        calendarEventsError: null,
        contacts: [],
        contactsLoading: false,
        contactsError: null,
        allContacts: [],
        allContactsCount: 0,
        allContactsNext: null,
        allContactsPrevious: null,
        allContactsLoading: false,
        allContactsError: null,
        contactStats: null,
        contactStatsLoading: false,
        contactStatsError: null,
        selectedContact,
        selectedContactLoading: false,
        selectedContactError: null,
        opportunities: [],
        opportunitiesLoading: false,
        opportunitiesError: null,
        risks: [],
        risksLoading: false,
        risksError: null,
        pipelineOpportunities: [],
        pipelineOpportunitiesLoading: false,
        pipelineOpportunitiesError: null,
        pipelineRisks: [],
        pipelineRisksLoading: false,
        pipelineRisksError: null,
        entitySurveys: [],
        entitySurveysLoading: false,
        entitySurveysError: null,
        surveys: [],
        surveysLoading: false,
        surveysError: null,
        entityCanvases: [],
        entityCanvasesLoading: false,
        entityCanvasesError: null,
        canvases: [],
        canvasesLoading: false,
        canvasesError: null,
      },
    },
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Navbar />
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard Marker</div>} />
          <Route path="/profile" element={<div>Profile Marker</div>} />
          <Route path="/login" element={<div>Login Marker</div>} />
          <Route path="/organizations/:id" element={<div>Details Marker</div>} />
          <Route path="/accounts/:id" element={<div>Account Details Marker</div>} />
          <Route path="/contacts/:id" element={<div>Contact Details Marker</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('Navbar account menu', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('is closed by default', () => {
    renderNavbar();
    expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
  });

  it('opens on avatar click and shows the real logged-in user', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByAltText('Alice Admin'));

    expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    expect(screen.getByText('alice@acme.io')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('navigates to /profile and closes the menu', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByAltText('Alice Admin'));
    await user.click(screen.getByText('My Profile'));

    expect(await screen.findByText('Profile Marker')).toBeInTheDocument();
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
  });

  it('signs out and redirects to /login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 205, json: async () => null })
    );
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByAltText('Alice Admin'));
    await user.click(screen.getByText('Sign out'));

    expect(await screen.findByText('Login Marker')).toBeInTheDocument();
  });

  it('closes when clicking outside the menu', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByAltText('Alice Admin'));
    expect(screen.getByText('My Profile')).toBeInTheDocument();

    await user.click(screen.getByText('Dashboard Marker'));

    await waitFor(() => expect(screen.queryByText('My Profile')).not.toBeInTheDocument());
  });
});

describe('Navbar organization breadcrumb (/organizations/:id)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the real organization name once Details.tsx has loaded it into the store', () => {
    // Navbar doesn't fetch this itself — it reads the same
    // selectedCustomer that Details.tsx's fetchCustomerById() populates
    // (see customersSlice.ts). Preloading it here stands in for that.
    renderNavbar('/organizations/10', globex);

    expect(screen.getByRole('heading', { name: 'Globex Corp' })).toBeInTheDocument();
  });

  it('falls back to the plain "Organizations" header while the fetch is still in flight', () => {
    renderNavbar('/organizations/10', null);

    expect(screen.queryByRole('heading', { name: 'Globex Corp' })).not.toBeInTheDocument();
    expect(screen.getByText('Organizations')).toBeInTheDocument();
  });

  it('does not show a stale organization name for a different id than the one loaded', () => {
    // e.g. navigating from org 10's page straight to org 11's, before the
    // new fetch has resolved and overwritten selectedCustomer.
    renderNavbar('/organizations/11', globex);

    expect(screen.queryByRole('heading', { name: 'Globex Corp' })).not.toBeInTheDocument();
  });
});

// Minimal but real-shaped AccountRow — see mapToAccountRow.test.ts for
// the full field list. Only what Navbar's own header actually reads
// (name/orgName/logo) needs realistic values here.
const apacDivision = {
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
  health: { val: 5, clr: 'bg-[var(--warning)]' },
  healthCategory: 'average' as const,
  nps: '0',
  npsValue: 0,
  csat: 'N/A',
  csatValue: 0,
  lifecycleStage: 'Onboarding',
  mrr: 0,
  arr: 0,
  renewal: '-',
};

describe('Navbar account breadcrumb (/accounts/:id)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the real account/org name from navigation state (a click-through from a real Accounts tab)', () => {
    // organizations/Details.tsx's AccountsTab passes the real AccountRow
    // through navigate()'s state when a row is clicked — see that file.
    renderNavbar({ pathname: '/accounts/17', state: { account: apacDivision } });

    expect(screen.getByRole('heading', { name: 'APAC Division' })).toBeInTheDocument();
    expect(screen.getByText('Kraft Heinz')).toBeInTheDocument();
  });

  it('falls back to the mock data when reached without navigation state (a direct URL visit or refresh)', () => {
    renderNavbar('/accounts/17');

    expect(screen.queryByRole('heading', { name: 'APAC Division' })).not.toBeInTheDocument();
    // Whatever ACCOUNTS_DATA[0] is — not asserting its exact name here,
    // just that *some* account header renders instead of the header
    // falling through to the generic path-based title.
    expect(screen.queryByText('Accounts', { selector: 'h1' })).not.toBeInTheDocument();
  });

  it('does not show an account header on /accounts/list (not a numeric id)', () => {
    renderNavbar('/accounts/list');

    expect(screen.queryByRole('heading', { name: 'APAC Division' })).not.toBeInTheDocument();
  });
});

describe('Navbar contact breadcrumb (/contacts/:id)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the real contact name once Details.tsx has loaded it into the store', () => {
    // Navbar doesn't fetch this itself — it reads the same
    // selectedContact that pages/contacts/Details.tsx's own
    // fetchContactById() populates (see customersSlice.ts).
    renderNavbar('/contacts/1', null, sarahChen);

    expect(screen.getByRole('heading', { name: 'Sarah Chen' })).toBeInTheDocument();
    expect(screen.getByText('Globex Corp')).toBeInTheDocument();
  });

  it('does not show a stale contact name for a different id than the one loaded', () => {
    renderNavbar('/contacts/2', null, sarahChen);

    expect(screen.queryByRole('heading', { name: 'Sarah Chen' })).not.toBeInTheDocument();
  });

  it('does not show a contact header on /contacts/list (not a numeric id)', () => {
    renderNavbar('/contacts/list', null, sarahChen);

    expect(screen.queryByRole('heading', { name: 'Sarah Chen' })).not.toBeInTheDocument();
  });
});

const unreadInvite: Notification = {
  id: 1,
  kind: 'copilot_invite',
  message: 'Carl invited you to a live Copilot session',
  link: '/organizations/10',
  actor: { id: 2, name: 'Carl' },
  is_read: false,
  created_at: '2026-09-06T09:00:00Z',
};

const readAssignment: Notification = {
  id: 2,
  kind: 'customer_assigned',
  message: 'Carl assigned you the organization Globex Corp',
  link: '/organizations/10',
  actor: { id: 2, name: 'Carl' },
  is_read: true,
  created_at: '2026-09-05T09:00:00Z',
};

describe('Navbar notification bell', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(notificationApi.markNotificationRead).mockReset().mockResolvedValue(readAssignment);
    vi.mocked(notificationApi.markAllNotificationsRead)
      .mockReset()
      .mockResolvedValue({ detail: 'ok' });
  });

  it('is closed by default and shows no unread badge with an empty list', () => {
    renderNavbar();

    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument();
  });

  it('shows a real unread count badge for unread notifications only', () => {
    renderNavbar('/dashboard', null, null, [unreadInvite, readAssignment]);

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('opens on click and lists real notifications, newest state first as given', async () => {
    const user = userEvent.setup();
    renderNavbar('/dashboard', null, null, [unreadInvite, readAssignment]);

    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Carl invited you to a live Copilot session')).toBeInTheDocument();
    expect(screen.getByText('Carl assigned you the organization Globex Corp')).toBeInTheDocument();
  });

  it('shows an empty state when there are no notifications', async () => {
    const user = userEvent.setup();
    renderNavbar('/dashboard', null, null, []);

    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(screen.getByText('No notifications yet.')).toBeInTheDocument();
    expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument();
  });

  it('clicking an unread notification marks it read and navigates to its real link', async () => {
    const user = userEvent.setup();
    renderNavbar('/dashboard', null, null, [unreadInvite]);

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(screen.getByText('Carl invited you to a live Copilot session'));

    expect(notificationApi.markNotificationRead).toHaveBeenCalledWith(1);
    expect(await screen.findByText('Details Marker')).toBeInTheDocument();
  });

  it('clicking an already-read notification navigates without re-marking it read', async () => {
    const user = userEvent.setup();
    renderNavbar('/dashboard', null, null, [readAssignment]);

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(screen.getByText('Carl assigned you the organization Globex Corp'));

    expect(notificationApi.markNotificationRead).not.toHaveBeenCalled();
    expect(await screen.findByText('Details Marker')).toBeInTheDocument();
  });

  it('"Mark all as read" clears the unread badge and calls the real API', async () => {
    const user = userEvent.setup();
    renderNavbar('/dashboard', null, null, [unreadInvite]);

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(screen.getByText('Mark all as read'));

    expect(notificationApi.markAllNotificationsRead).toHaveBeenCalled();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });
});
