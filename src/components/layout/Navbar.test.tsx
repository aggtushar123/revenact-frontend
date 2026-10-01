import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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
import { NavActionsSlotContext } from '../../layouts/navActionsSlot';
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
  sentiment_source: 'manual' as const, sentiment_computed_at: null,
};

function renderNavbar(
  initialRoute: string | { pathname: string; state?: unknown } = '/dashboard',
  selectedCustomer: typeof globex | null = null,
  selectedContact: typeof sarahChen | null = null,
  notifications: Notification[] = [],
  setSlot: (el: HTMLElement | null) => void = () => {},
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
        accountsCustomerId: null,
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
        contactsFor: null,
        allContacts: [],
        allContactsCount: 0,
        allContactsNext: null,
        allContactsPrevious: null,
        allContactsLoading: false,
        allContactsError: null,
        allContactsSummary: null,
        allContactsLoadingMore: false,
        allContactsMoreError: null,
        selectedContact,
        selectedContactLoading: false,
        selectedContactError: null,
        selectedContactHistory: null,
        selectedContactHistoryLoading: false,
        selectedContactHistoryError: null,
        opportunities: [],
        opportunitiesLoading: false,
        opportunitiesError: null,
        risks: [],
        risksLoading: false,
        risksError: null,
        pipelineOpportunities: [],
        pipelineOpportunitiesLoading: false,
        pipelineOpportunitiesError: null,
        pipelineOpportunitiesFor: null,
        pipelineRisks: [],
        pipelineRisksLoading: false,
        pipelineRisksError: null,
        pipelineRisksFor: null,
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
        <NavActionsSlotContext.Provider value={{ slot: null, setSlot }}>
          <Navbar />
        </NavActionsSlotContext.Provider>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard Marker</div>} />
          <Route path="/organizations/list" element={<div>Organizations Marker</div>} />
          <Route path="/organizations/board" element={<div>Organizations Marker</div>} />
          <Route path="/users" element={<div>Users Marker</div>} />
          <Route path="/profile" element={<div>Profile Marker</div>} />
          <Route path="/login" element={<div>Login Marker</div>} />
          <Route path="/organizations/:id" element={<div>Details Marker</div>} />
          <Route path="/accounts/list" element={<div>Accounts Marker</div>} />
          <Route path="/accounts/:id" element={<div>Account Details Marker</div>} />
          <Route path="/contacts/:id" element={<div>Contact Details Marker</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('Navbar account menu', () => {
  // Off the dashboard: the dashboard's top bar has no avatar (the sidebar's does the job).
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('is closed by default', () => {
    renderNavbar('/users');
    expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
  });

  it('opens on avatar click and shows the real logged-in user', async () => {
    const user = userEvent.setup();
    renderNavbar('/users');

    await user.click(screen.getByAltText('Alice Admin'));

    expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    expect(screen.getByText('alice@acme.io')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('navigates to /profile and closes the menu', async () => {
    const user = userEvent.setup();
    renderNavbar('/users');

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
    renderNavbar('/users');

    await user.click(screen.getByAltText('Alice Admin'));
    await user.click(screen.getByText('Sign out'));

    expect(await screen.findByText('Login Marker')).toBeInTheDocument();
  });

  it('closes when clicking outside the menu', async () => {
    const user = userEvent.setup();
    renderNavbar('/users');

    await user.click(screen.getByAltText('Alice Admin'));
    expect(screen.getByText('My Profile')).toBeInTheDocument();

    await user.click(screen.getByText('Users Marker'));

    await waitFor(() => expect(screen.queryByText('My Profile')).not.toBeInTheDocument());
  });
});

describe('Navbar on an organization page (/organizations/:id)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('wears the Organizations frame: transparent bar, a way back to the list, the actions slot, no avatar', () => {
    const setSlot = vi.fn();
    renderNavbar('/organizations/10', globex, null, [], setSlot);
    const header = document.querySelector('header');
    expect(header).toHaveClass('h-16', 'shrink-0', 'flex', 'items-center', 'gap-3', 'px-4');
    for (const cls of ['bg-surface', 'border-b', 'shadow-sm']) expect(header).not.toHaveClass(cls);
    const back = within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('link', { name: 'Organizations' });
    expect(back).toHaveAttribute('href', '/organizations/list');
    expect(setSlot).toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(header!.querySelector('[data-nav-actions-slot]')).not.toBeNull();
    expect(screen.queryByAltText('Alice Admin')).not.toBeInTheDocument();
  });

  it('leaves the name to the page (no uppercase heading, no third-party logo)', () => {
    renderNavbar('/organizations/10', globex);
    expect(screen.queryByRole('heading', { name: 'Globex Corp' })).not.toBeInTheDocument();
    expect(document.querySelector('header img')).toBeNull();
  });

  it('takes you back to the list', async () => {
    renderNavbar('/organizations/10', globex);
    await userEvent.click(screen.getByRole('link', { name: 'Organizations' }));
    expect(await screen.findByText('Organizations Marker')).toBeInTheDocument();
  });
});

describe('Navbar on an account page (/accounts/:id)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('wears the framed bar: a way back to Accounts, the actions slot, no avatar', () => {
    const setSlot = vi.fn();
    renderNavbar('/accounts/17', null, null, [], setSlot);
    const header = document.querySelector('header');
    expect(header).toHaveClass('h-16', 'shrink-0', 'flex', 'items-center', 'gap-3', 'px-4');
    for (const cls of ['bg-surface', 'border-b', 'shadow-sm']) expect(header).not.toHaveClass(cls);
    const back = within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('link', { name: 'Accounts' });
    expect(back).toHaveAttribute('href', '/accounts/list');
    expect(setSlot).toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(header!.querySelector('[data-nav-actions-slot]')).not.toBeNull();
    expect(screen.queryByAltText('Alice Admin')).not.toBeInTheDocument();
  });

  it('leaves the name to the page and ignores navigation state (there is no mock account)', () => {
    renderNavbar({ pathname: '/accounts/17', state: { account: { name: 'APAC Division', orgName: 'Kraft Heinz' } } });
    expect(screen.queryByText('APAC Division')).not.toBeInTheDocument();
    expect(screen.queryByText('Kraft Heinz')).not.toBeInTheDocument();
    expect(document.querySelector('header img')).toBeNull();
  });

  it('takes you back to the list', async () => {
    renderNavbar('/accounts/17');
    await userEvent.click(screen.getByRole('link', { name: 'Accounts' }));
    expect(await screen.findByText('Accounts Marker')).toBeInTheDocument();
  });

  it('shows no breadcrumb on /accounts/list', () => {
    renderNavbar('/accounts/list');
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });

  it('wears the same framed bar on a non-numeric id (a not-found account), not the double gutter of an unframed page', () => {
    renderNavbar('/accounts/abc');
    const header = document.querySelector('header');
    expect(header).toHaveClass('h-16', 'shrink-0', 'flex', 'items-center', 'gap-3', 'px-4');
    const back = within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('link', { name: 'Accounts' });
    expect(back).toHaveAttribute('href', '/accounts/list');
  });
});

describe('Navbar on Contacts (spec 2026-09-28 §3)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  // A trailing slash is still the same route (fix round 1, 2026-09-28).
  it.each(['/contacts', '/contacts/1', '/contacts/1/'])('titles %s "Contacts" in the framed bar, with the actions slot and no avatar', (route) => {
    renderNavbar(route, null, sarahChen);
    expect(screen.getByRole('heading', { level: 1, name: 'Contacts' })).toBeInTheDocument();
    // The person's name is the page's to show, not the bar's.
    expect(screen.queryByRole('heading', { name: 'Sarah Chen' })).not.toBeInTheDocument();
    expect(document.querySelector('[data-nav-actions-slot]')).not.toBeNull();
    expect(screen.queryByRole('img', { name: 'Alice Admin' })).toBeNull();
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

describe('Navbar dashboard area tabs', () => {
  it('carries only the shared filters into every area link', () => {
    // owner/lifecycle/customer mean the same thing in every area; a period
    // key like `days` belongs to one view and must not leak into another.
    renderNavbar('/dashboard/health/usage?owner=7&lifecycle=pilot&customer=3&days=30');
    const nav = screen.getByRole('navigation', { name: 'Dashboard areas' });
    for (const name of ['Overview', 'Revenue', 'Health', 'Support']) {
      const href = within(nav).getByRole('link', { name }).getAttribute('href')!;
      const params = new URLSearchParams(href.split('?')[1] ?? '');
      expect(params.get('owner')).toBe('7');
      expect(params.get('lifecycle')).toBe('pilot');
      expect(params.get('customer')).toBe('3');
      expect(params.has('days')).toBe(false);
    }
  });

  it('links to the bare area when no shared filter is set', () => {
    renderNavbar('/dashboard/health/usage?days=30');
    const nav = screen.getByRole('navigation', { name: 'Dashboard areas' });
    expect(within(nav).getByRole('link', { name: 'Revenue' })).toHaveAttribute('href', '/dashboard/revenue');
  });

  it('shows keyboard focus on the area tabs', () => {
    renderNavbar('/dashboard/health/usage');
    const nav = screen.getByRole('navigation', { name: 'Dashboard areas' });
    expect(within(nav).getByRole('link', { name: 'Revenue' })).toHaveClass(
      'focus-visible:outline',
      'focus-visible:outline-2',
      'focus-visible:outline-accent',
    );
  });
});

describe('Navbar actions on the dashboard', () => {
  // The four decorative icons do nothing; the dashboard puts its Ask
  // controls there instead, through a slot it portals into.
  const DECORATIVE = 'svg.lucide-search, svg.lucide-circle-plus, svg.lucide-circle-question-mark, svg.lucide-message-square';

  it('drops the decorative icons and renders the actions slot on /dashboard/*', () => {
    const setSlot = vi.fn();
    renderNavbar('/dashboard/overview', null, null, [], setSlot);
    expect(document.querySelectorAll(DECORATIVE)).toHaveLength(0);
    expect(setSlot).toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  // The dashboard's top bar is Communications' header: transparent, h-16,
  // px-4, the pill then the bell on the right, no avatar (the sidebar has it).
  it('is shaped like Communications\' header on /dashboard/*, with no avatar', () => {
    renderNavbar('/dashboard/overview');
    const header = document.querySelector('header');
    expect(header).toHaveClass('h-16', 'shrink-0', 'flex', 'items-center', 'gap-3', 'px-4');
    for (const cls of ['bg-surface', 'border-b', 'shadow-sm', 'px-6', 'h-[64px]']) expect(header).not.toHaveClass(cls);
    expect(screen.queryByAltText('Alice Admin')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Dashboard areas' })).toBeInTheDocument();
    // The pill slot comes before the bell.
    const bell = screen.getByRole('button', { name: 'Notifications' });
    const slot = header!.querySelector('[data-nav-actions-slot]');
    expect(slot).not.toBeNull();
    expect(slot!.compareDocumentPosition(bell) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps the other pages as they were, with no slot', () => {
    const setSlot = vi.fn();
    renderNavbar('/users', null, null, [], setSlot);
    expect(document.querySelectorAll(DECORATIVE)).toHaveLength(4);
    expect(setSlot).not.toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(document.querySelector('header')).toHaveClass('h-[64px]', 'border-b', 'bg-surface', 'shadow-sm', 'px-6');
    expect(screen.getByAltText('Alice Admin')).toBeInTheDocument();
  });
});

describe('Navbar on the Organizations list', () => {
  it('wears the dashboard frame on /organizations/list: transparent bar, views nav, the actions slot, no avatar', () => {
    const setSlot = vi.fn();
    renderNavbar('/organizations/list', null, null, [], setSlot);
    const header = document.querySelector('header');
    expect(header).toHaveClass('h-16', 'shrink-0', 'flex', 'items-center', 'gap-3', 'px-4');
    for (const cls of ['bg-surface', 'border-b', 'shadow-sm']) expect(header).not.toHaveClass(cls);
    expect(screen.getByRole('heading', { name: 'Organizations' })).toBeInTheDocument();
    const views = screen.getByRole('navigation', { name: 'Organizations views' });
    expect(within(views).getByRole('link', { name: 'List' })).toHaveAttribute('href', '/organizations/list');
    expect(within(views).getByRole('link', { name: 'Board' })).toHaveAttribute('href', '/organizations/board');
    expect(setSlot).toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(header!.querySelector('[data-nav-actions-slot]')).not.toBeNull();
    expect(screen.queryByAltText('Alice Admin')).not.toBeInTheDocument();
  });

  it('wears the same frame on /organizations/board, and both tabs carry the query', () => {
    const setSlot = vi.fn();
    renderNavbar('/organizations/board?owner=2&health=poor', null, null, [], setSlot);
    const header = document.querySelector('header');
    expect(header).toHaveClass('h-16', 'shrink-0', 'flex', 'items-center', 'gap-3', 'px-4');
    for (const cls of ['bg-surface', 'border-b', 'shadow-sm']) expect(header).not.toHaveClass(cls);
    expect(setSlot).toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(header!.querySelector('[data-nav-actions-slot]')).not.toBeNull();
    expect(screen.queryByAltText('Alice Admin')).not.toBeInTheDocument();
    const views = screen.getByRole('navigation', { name: 'Organizations views' });
    expect(within(views).getByRole('link', { name: 'List' })).toHaveAttribute('href', '/organizations/list?owner=2&health=poor');
    const board = within(views).getByRole('link', { name: 'Board' });
    expect(board).toHaveAttribute('href', '/organizations/board?owner=2&health=poor');
    expect(board).toHaveAttribute('aria-current', 'page');
  });
});

describe('Navbar on the Accounts list and board (accounts spec 2026-09-29 §1)', () => {
  it('wears the framed bar on /accounts/list: "Accounts", List | Board, the actions slot, no avatar', () => {
    const setSlot = vi.fn();
    renderNavbar('/accounts/list', null, null, [], setSlot);
    const header = document.querySelector('header');
    expect(header).toHaveClass('h-16', 'shrink-0', 'flex', 'items-center', 'gap-3', 'px-4');
    for (const cls of ['bg-surface', 'border-b', 'shadow-sm']) expect(header).not.toHaveClass(cls);
    expect(screen.getByRole('heading', { name: 'Accounts' })).toBeInTheDocument();
    const views = screen.getByRole('navigation', { name: 'Accounts views' });
    expect(within(views).getByRole('link', { name: 'List' })).toHaveAttribute('href', '/accounts/list');
    expect(within(views).getByRole('link', { name: 'Board' })).toHaveAttribute('href', '/accounts/board');
    expect(setSlot).toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(header!.querySelector('[data-nav-actions-slot]')).not.toBeNull();
    expect(screen.queryByAltText('Alice Admin')).not.toBeInTheDocument();
  });

  it('carries the query across List and Board on /accounts/board', () => {
    renderNavbar('/accounts/board?organisation=7&health=poor', null, null, [], vi.fn());
    const views = screen.getByRole('navigation', { name: 'Accounts views' });
    expect(within(views).getByRole('link', { name: 'List' })).toHaveAttribute('href', '/accounts/list?organisation=7&health=poor');
    const board = within(views).getByRole('link', { name: 'Board' });
    expect(board).toHaveAttribute('href', '/accounts/board?organisation=7&health=poor');
    expect(board).toHaveAttribute('aria-current', 'page');
  });
});
