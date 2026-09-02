import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { User } from '../auth/authSlice';

// Mirrors revenact-backend's CustomerSerializer field-for-field — see
// revenact-backend/docs/API_CONTRACTS.md -> customers. One of a *tenant's*
// own customers (not to be confused with `Organisation`, the tenant
// itself). DRF's DecimalField serializes as a string by default (e.g.
// health_score: "9.3") — only FloatField/IntegerField come back as JSON
// numbers, which is why the types below are a mix of `string` and `number`.
export interface Customer {
  id: number;
  name: string;
  address: string;
  domain: string;
  owner: User | null;
  created_by: User | null;
  modified_by: User | null;
  created_at: string;
  updated_at: string;
  lifecycle_stage:
    | 'onboarding'
    | 'kickoff'
    | 'adoption'
    | 'live'
    | 'renewal'
    | 'churn'
    | 'expansion'
    | 'other';
  health_score: string;
  health_category: 'good' | 'average' | 'poor';
  pulse: number[];
  ai_pulse_score: 'very_satisfied' | 'satisfied' | 'moderate' | 'high_risk' | '';
  ai_pulse_reason: string;
  nps_score: number | null;
  csat_score: string | null;
  joined_date: string | null;
  renewal_date: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  arr_billed_at_account: string;
  arr_billed_at_hq: string;
  implementation_fee: string;
  total_contract_value: string;
  total_forecasted_renewal_revenue: string;
  primary_product: string;
  additional_products_count: number | null;
  top_source_channel: string;
  total_contracted_seats: number | null;
  total_active_seats: number | null;
  seat_utilization_percentage: number | null;
  total_hires: number | null;
  scope_web_app: string;
  ces_percentage: string | null;
  churn_date: string | null;
  churn_reason: string;
  churn_comment: string;
  is_archived: boolean;
}

// Mirrors revenact-backend's AccountSerializer field-for-field — see
// docs/API_CONTRACTS.md -> customers -> Account. A named sub-account
// under one Customer (one-to-many: a Customer can have any number of
// these).
export interface Account {
  id: number;
  customer: number;
  name: string;
  domain: string;
  owner: User | null;
  created_at: string;
  updated_at: string;
  lifecycle_stage: Customer['lifecycle_stage'];
  health_score: string;
  health_category: 'good' | 'average' | 'poor';
  pulse: number[];
  ai_pulse_score: 'very_satisfied' | 'satisfied' | 'moderate' | 'high_risk' | '';
  ai_pulse_reason: string;
  nps_score: number | null;
  csat_score: string | null;
  renewal_date: string | null;
  arr: string;
}

// Mirrors revenact-backend's ActivitySerializer field-for-field — see
// docs/API_CONTRACTS.md -> customers -> Activity. A timeline entry
// belonging to exactly one Customer or Account (never both, enforced
// server-side) — which one it belongs to is implied by which endpoint
// fetched it (fetchActivitiesForCustomer vs fetchActivitiesForAccount),
// not carried as a field here. Read-only, no write payload yet.
export interface Activity {
  id: number;
  type: string;
  /** Human label (e.g. "Health Check Review") — this is the card's title. */
  type_display: string;
  occurred_at: string;
  links: number;
  watchers: number;
}

// Mirrors revenact-backend's EmailSerializer field-for-field — see
// docs/API_CONTRACTS.md -> customers -> Email. Which parent (Customer or
// Account) it belongs to is implied by which endpoint fetched it, same
// as Activity. `sender_name`/`recipient_name` are plain text, not a
// User/Contact reference — see the Email model's own docstring for why.
export interface Email {
  id: number;
  subject: string;
  sender_name: string;
  recipient_name: string;
  /** The summarized preview shown on the card. */
  body: string;
  sent_at: string;
  links: number;
  watchers: number;
  is_starred: boolean;
}

// Mirrors revenact-backend's TaskSerializer field-for-field — see
// docs/API_CONTRACTS.md -> customers -> Task. `priority`/`status`
// values match the frontend's own existing display-config keys
// exactly (e.g. "in-progress"), so no separate _display field is
// needed the way Activity's type_display was. No `group` — the
// Overdue/This Week/Next Week/Later bucket is computed from
// `due_date` at render time (see TasksTab.tsx), not carried here.
export interface Task {
  id: number;
  title: string;
  assignee_name: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
}

// Mirrors revenact-backend's NoteSerializer field-for-field — see
// docs/API_CONTRACTS.md -> customers -> Note. `author_name` is plain
// text, not a FK, same reasoning as Task's `assignee_name`. `links` is
// a real count — the card only shows its link line when it's greater
// than zero ("links if any"). No `group` — the date-group header is
// derived from `logged_at` at render time (see NotesTab.tsx).
export interface Note {
  id: number;
  title: string;
  author_name: string;
  body: string;
  logged_at: string;
  links: number;
}

// Mirrors revenact-backend's TicketSerializer field-for-field — see
// docs/API_CONTRACTS.md -> customers -> Ticket. Field set was
// reverse-engineered from the card, not dictated up front — see that
// model's own docstring. `status`/`priority` values match the
// frontend's own existing display-config keys exactly (e.g.
// "in-progress"). `links` is a real count, shown on the card only
// when greater than zero, same as Note. No `group` — the date-group
// header is derived from `opened_at` at render time (see
// TicketsTab.tsx).
export interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  assignee_name: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  opened_at: string;
  links: number;
}

// Mirrors revenact-backend's CalendarEventSerializer field-for-field —
// see docs/API_CONTRACTS.md -> customers -> CalendarEvent. `type`
// values match the frontend's own existing display-config keys
// exactly. `attendee_count` is a count, not the mock's full list of
// attendee names — the card only ever renders the count. No `group` —
// the date-group header is derived from `event_date` at render time
// (see CalendarEventsTab.tsx). `start_time`/`end_time` are "HH:MM:SS"
// (Django's default TimeField serialization), formatted to a
// 12-hour display string on the frontend.
export interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  type: 'meeting' | 'call' | 'review' | 'demo';
  event_date: string;
  start_time: string;
  end_time: string;
  attendee_count: number;
}

// The subset of Account fields the Add/Edit Account form actually
// exposes — identity, ownership, lifecycle stage, and renewal date.
// Same product decision as CustomerWritePayload: health/pulse/AI-pulse/
// NPS/CSAT/ARR are meant to sync from other systems later, not be
// hand-typed here. `customer` is never sent — the backend takes it from
// the URL (see createAccount/updateAccount below).
export interface AccountWritePayload {
  name?: string;
  domain?: string;
  owner_id?: number | null;
  lifecycle_stage?: Account['lifecycle_stage'];
  renewal_date?: string | null;
}

// The subset of Customer fields the Add/Edit forms actually expose —
// identity, ownership, lifecycle stage, and contract dates. Deliberately
// excludes financials, product usage, and NPS/CSAT/health: per the
// product decision behind this form, those are meant to eventually sync
// from other systems (billing, usage tracking, surveys) rather than be
// hand-typed when an organisation is added or edited. Also covers the
// Churn action's own fields (churn_date/reason/comment) and is_archived
// (Archive/unarchive) — both PATCH through the same updateCustomer thunk
// as a normal edit, just with a different field subset.
export interface CustomerWritePayload {
  name?: string;
  domain?: string;
  address?: string;
  owner_id?: number | null;
  lifecycle_stage?: Customer['lifecycle_stage'];
  joined_date?: string | null;
  renewal_date?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  churn_date?: string | null;
  churn_reason?: string;
  churn_comment?: string;
  is_archived?: boolean;
}

interface CustomersPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: Customer[];
}

interface StatsBucket {
  count: number;
  /** Derived (arr / 12) server-side — there's no stored MRR field. */
  mrr: number;
  arr: number;
}

// Mirrors revenact-backend's CustomerStatsView response exactly — see
// docs/API_CONTRACTS.md -> GET /api/v1/customers/stats/.
export interface CustomerStats {
  health: Record<Customer['health_category'], StatsBucket>;
  nps: { promoters: number; passives: number; detractors: number; score: number };
  lifecycle: Record<Customer['lifecycle_stage'], StatsBucket>;
}

interface CustomersState {
  customers: Customer[];
  /** Count for the current (possibly search-filtered) fetch — drives the
   * table's "Showing X-Y of Z" pagination footer. */
  count: number;
  /** Count from the last *unfiltered* fetch — how many organisations are
   * onboarded overall, for MetricsPanel's "Number of Organizations" card.
   * Deliberately not just `count`, which would otherwise dip to a search's
   * result size while the user is filtering the table. */
  totalCount: number;
  next: string | null;
  previous: string | null;
  isLoading: boolean;
  error: string | null;
  /** Customers due for renewal within the window last asked for via
   * fetchUpcomingRenewals — a separate list from `customers` so opening
   * the Renewal popover never clobbers whatever the main table is
   * currently showing (which may itself be search-filtered). */
  renewals: Customer[];
  renewalsCount: number;
  renewalsLoading: boolean;
  renewalsError: string | null;
  /** MetricsPanel's Health/NPS/Lifecycle Stages sections — null until the
   * first fetch resolves. */
  stats: CustomerStats | null;
  statsLoading: boolean;
  statsError: string | null;
  /** The single organization Details.tsx (/organizations/:id) is showing.
   * Separate from `customers` (the paginated list) since Details is reached
   * directly by URL — it can't assume the list has already loaded this
   * particular row. */
  selectedCustomer: Customer | null;
  selectedCustomerLoading: boolean;
  selectedCustomerError: string | null;
  /** Accounts for whichever customer Details.tsx's Accounts tab is
   * currently showing — a single slot, same reasoning as
   * selectedCustomer: only one organization's Accounts tab is ever on
   * screen at a time. */
  accountsForCustomer: Account[];
  accountsLoading: boolean;
  accountsError: string | null;
  /** Activities for whichever Customer or Account ActivityFeed's
   * "Activities" filter is currently showing — a single slot, same
   * reasoning as selectedCustomer/accountsForCustomer: only one
   * entity's Activity Feed is ever mounted at a time (Organization
   * Details page's General tab, or the standalone Account page). */
  activities: Activity[];
  activitiesLoading: boolean;
  activitiesError: string | null;
  /** Emails for whichever Customer or Account ActivityFeed's "Emails"
   * filter is currently showing — same single-slot reasoning as
   * `activities` above. */
  emails: Email[];
  emailsLoading: boolean;
  emailsError: string | null;
  /** Tasks for whichever Customer or Account ActivityFeed's "Tasks"
   * filter is currently showing — same single-slot reasoning as
   * `activities`/`emails` above. */
  tasks: Task[];
  tasksLoading: boolean;
  tasksError: string | null;
  /** Notes for whichever Customer or Account ActivityFeed's "Notes"
   * filter is currently showing — same single-slot reasoning as
   * `activities`/`emails`/`tasks` above. */
  notes: Note[];
  notesLoading: boolean;
  notesError: string | null;
  /** Tickets for whichever Customer or Account ActivityFeed's
   * "Tickets" filter is currently showing — same single-slot
   * reasoning as `activities`/`emails`/`tasks`/`notes` above. */
  tickets: Ticket[];
  ticketsLoading: boolean;
  ticketsError: string | null;
  /** Calendar events for whichever Customer or Account ActivityFeed's
   * "Calendar Events" filter is currently showing — same single-slot
   * reasoning as `activities`/`emails`/`tasks`/`notes`/`tickets`
   * above. */
  calendarEvents: CalendarEvent[];
  calendarEventsLoading: boolean;
  calendarEventsError: string | null;
}

const initialState: CustomersState = {
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
  selectedCustomer: null,
  selectedCustomerLoading: false,
  selectedCustomerError: null,
  accountsForCustomer: [],
  accountsLoading: false,
  accountsError: null,
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
  tickets: [],
  ticketsLoading: false,
  ticketsError: null,
  calendarEvents: [],
  calendarEventsLoading: false,
  calendarEventsError: null,
};

// `url`, when given, is one of DRF's own (already-absolute) `next`/
// `previous` links — paging forward/back re-fetches through those instead
// of re-deriving query params here. Omit it for the first page.
export const fetchCustomers = createAsyncThunk<CustomersPage, string | void, { rejectValue: string }>(
  'customers/fetchCustomers',
  async (url, { rejectWithValue }) => {
    try {
      return await apiFetch<CustomersPage>(url || '/customers/');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load organizations.';
      return rejectWithValue(message);
    }
  }
);

// `days` becomes `?renewal_within=<days>` — see revenact-backend's
// customers/views.py for the exact window semantics (includes already-
// overdue renewals, not just upcoming ones).
export const fetchUpcomingRenewals = createAsyncThunk<CustomersPage, number, { rejectValue: string }>(
  'customers/fetchUpcomingRenewals',
  async (days, { rejectWithValue }) => {
    try {
      return await apiFetch<CustomersPage>(`/customers/?renewal_within=${days}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load upcoming renewals.';
      return rejectWithValue(message);
    }
  }
);

export const fetchCustomerStats = createAsyncThunk<CustomerStats, void, { rejectValue: string }>(
  'customers/fetchCustomerStats',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<CustomerStats>('/customers/stats/');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load stats.';
      return rejectWithValue(message);
    }
  }
);

// Powers Details.tsx (/organizations/:id) — a single organization by its
// backend pk, independent of whatever page/search the list is on.
export const fetchCustomerById = createAsyncThunk<Customer, number, { rejectValue: string }>(
  'customers/fetchCustomerById',
  async (id, { rejectWithValue }) => {
    try {
      return await apiFetch<Customer>(`/customers/${id}/`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load this organization.';
      return rejectWithValue(message);
    }
  }
);

// Powers Details.tsx's Accounts tab — every Account under one Customer.
// No pagination envelope, an individual organization's account list is
// expected to stay small.
export const fetchAccountsForCustomer = createAsyncThunk<
  Account[],
  number,
  { rejectValue: string }
>('customers/fetchAccountsForCustomer', async (customerId, { rejectWithValue }) => {
  try {
    return await apiFetch<Account[]>(`/customers/${customerId}/accounts/`);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load accounts.';
    return rejectWithValue(message);
  }
});

// `name` is the only field the backend requires — everything else in
// AccountWritePayload is optional, matching the quick-add form.
// `customerId` addresses the nested URL; it's never part of the body
// (the backend takes `customer` from the URL, not the payload).
export const createAccount = createAsyncThunk<
  Account,
  { customerId: number } & AccountWritePayload & { name: string },
  { rejectValue: string }
>('customers/createAccount', async ({ customerId, ...data }, { rejectWithValue }) => {
  try {
    return await apiFetch<Account>(`/customers/${customerId}/accounts/`, { method: 'POST', body: data });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not add account.';
    return rejectWithValue(message);
  }
});

export const updateAccount = createAsyncThunk<
  Account,
  { customerId: number; id: number } & AccountWritePayload,
  { rejectValue: string }
>('customers/updateAccount', async ({ customerId, id, ...data }, { rejectWithValue }) => {
  try {
    return await apiFetch<Account>(`/customers/${customerId}/accounts/${id}/`, {
      method: 'PATCH',
      body: data,
    });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not update account.';
    return rejectWithValue(message);
  }
});

// Powers ActivityFeed's "Activities" filter on the Organization Details
// page's General tab — every organization-level Activity for one
// Customer.
export const fetchActivitiesForCustomer = createAsyncThunk<
  Activity[],
  number,
  { rejectValue: string }
>('customers/fetchActivitiesForCustomer', async (customerId, { rejectWithValue }) => {
  try {
    return await apiFetch<Activity[]>(`/customers/${customerId}/activities/`);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load activities.';
    return rejectWithValue(message);
  }
});

// Powers ActivityFeed's "Activities" filter on the standalone Account
// page — every account-level Activity for one Account. Needs
// `customerId` too since the endpoint is nested under its parent
// Customer (see AccountActivityListView on the backend).
export const fetchActivitiesForAccount = createAsyncThunk<
  Activity[],
  { customerId: number; accountId: number },
  { rejectValue: string }
>('customers/fetchActivitiesForAccount', async ({ customerId, accountId }, { rejectWithValue }) => {
  try {
    return await apiFetch<Activity[]>(`/customers/${customerId}/accounts/${accountId}/activities/`);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load activities.';
    return rejectWithValue(message);
  }
});

// Powers ActivityFeed's "Emails" filter on the Organization Details
// page's General tab — every organization-level Email for one
// Customer.
export const fetchEmailsForCustomer = createAsyncThunk<
  Email[],
  number,
  { rejectValue: string }
>('customers/fetchEmailsForCustomer', async (customerId, { rejectWithValue }) => {
  try {
    return await apiFetch<Email[]>(`/customers/${customerId}/emails/`);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load emails.';
    return rejectWithValue(message);
  }
});

// Powers ActivityFeed's "Emails" filter on the standalone Account
// page — every account-level Email for one Account.
export const fetchEmailsForAccount = createAsyncThunk<
  Email[],
  { customerId: number; accountId: number },
  { rejectValue: string }
>('customers/fetchEmailsForAccount', async ({ customerId, accountId }, { rejectWithValue }) => {
  try {
    return await apiFetch<Email[]>(`/customers/${customerId}/accounts/${accountId}/emails/`);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load emails.';
    return rejectWithValue(message);
  }
});

// Powers ActivityFeed's "Tasks" filter on the Organization Details
// page's General tab — every organization-level Task for one
// Customer.
export const fetchTasksForCustomer = createAsyncThunk<
  Task[],
  number,
  { rejectValue: string }
>('customers/fetchTasksForCustomer', async (customerId, { rejectWithValue }) => {
  try {
    return await apiFetch<Task[]>(`/customers/${customerId}/tasks/`);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load tasks.';
    return rejectWithValue(message);
  }
});

// Powers ActivityFeed's "Tasks" filter on the standalone Account
// page — every account-level Task for one Account.
export const fetchTasksForAccount = createAsyncThunk<
  Task[],
  { customerId: number; accountId: number },
  { rejectValue: string }
>('customers/fetchTasksForAccount', async ({ customerId, accountId }, { rejectWithValue }) => {
  try {
    return await apiFetch<Task[]>(`/customers/${customerId}/accounts/${accountId}/tasks/`);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load tasks.';
    return rejectWithValue(message);
  }
});

// Powers ActivityFeed's "Notes" filter on the Organization Details
// page's General tab — every organization-level Note for one
// Customer.
export const fetchNotesForCustomer = createAsyncThunk<
  Note[],
  number,
  { rejectValue: string }
>('customers/fetchNotesForCustomer', async (customerId, { rejectWithValue }) => {
  try {
    return await apiFetch<Note[]>(`/customers/${customerId}/notes/`);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load notes.';
    return rejectWithValue(message);
  }
});

// Powers ActivityFeed's "Notes" filter on the standalone Account
// page — every account-level Note for one Account.
export const fetchNotesForAccount = createAsyncThunk<
  Note[],
  { customerId: number; accountId: number },
  { rejectValue: string }
>('customers/fetchNotesForAccount', async ({ customerId, accountId }, { rejectWithValue }) => {
  try {
    return await apiFetch<Note[]>(`/customers/${customerId}/accounts/${accountId}/notes/`);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load notes.';
    return rejectWithValue(message);
  }
});

// Powers ActivityFeed's "Tickets" filter on the Organization Details
// page's General tab — every organization-level Ticket for one
// Customer.
export const fetchTicketsForCustomer = createAsyncThunk<
  Ticket[],
  number,
  { rejectValue: string }
>('customers/fetchTicketsForCustomer', async (customerId, { rejectWithValue }) => {
  try {
    return await apiFetch<Ticket[]>(`/customers/${customerId}/tickets/`);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load tickets.';
    return rejectWithValue(message);
  }
});

// Powers ActivityFeed's "Tickets" filter on the standalone Account
// page — every account-level Ticket for one Account.
export const fetchTicketsForAccount = createAsyncThunk<
  Ticket[],
  { customerId: number; accountId: number },
  { rejectValue: string }
>('customers/fetchTicketsForAccount', async ({ customerId, accountId }, { rejectWithValue }) => {
  try {
    return await apiFetch<Ticket[]>(`/customers/${customerId}/accounts/${accountId}/tickets/`);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load tickets.';
    return rejectWithValue(message);
  }
});

// Powers ActivityFeed's "Calendar Events" filter on the Organization
// Details page's General tab — every organization-level CalendarEvent
// for one Customer.
export const fetchCalendarEventsForCustomer = createAsyncThunk<
  CalendarEvent[],
  number,
  { rejectValue: string }
>('customers/fetchCalendarEventsForCustomer', async (customerId, { rejectWithValue }) => {
  try {
    return await apiFetch<CalendarEvent[]>(`/customers/${customerId}/calendar-events/`);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load calendar events.';
    return rejectWithValue(message);
  }
});

// Powers ActivityFeed's "Calendar Events" filter on the standalone
// Account page — every account-level CalendarEvent for one Account.
export const fetchCalendarEventsForAccount = createAsyncThunk<
  CalendarEvent[],
  { customerId: number; accountId: number },
  { rejectValue: string }
>(
  'customers/fetchCalendarEventsForAccount',
  async ({ customerId, accountId }, { rejectWithValue }) => {
    try {
      return await apiFetch<CalendarEvent[]>(
        `/customers/${customerId}/accounts/${accountId}/calendar-events/`
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load calendar events.';
      return rejectWithValue(message);
    }
  }
);

// `name` is the only field the backend requires — everything else in
// CustomerWritePayload is optional, matching the quick-add form.
export const createCustomer = createAsyncThunk<
  Customer,
  CustomerWritePayload & { name: string },
  { rejectValue: string }
>('customers/createCustomer', async (data, { rejectWithValue }) => {
  try {
    return await apiFetch<Customer>('/customers/', { method: 'POST', body: data });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not add organization.';
    return rejectWithValue(message);
  }
});

// Backs Edit, Churn, and Archive/Unarchive alike — each just sends a
// different subset of CustomerWritePayload as a partial update.
export const updateCustomer = createAsyncThunk<
  Customer,
  { id: number } & CustomerWritePayload,
  { rejectValue: string }
>('customers/updateCustomer', async ({ id, ...data }, { rejectWithValue }) => {
  try {
    return await apiFetch<Customer>(`/customers/${id}/`, { method: 'PATCH', body: data });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not update organization.';
    return rejectWithValue(message);
  }
});

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    // ActivityFeed calls this when it's mounted for an account reached
    // with no resolvable real ids (a direct URL visit/refresh with no
    // navigation state — see AccountDetails' own comment on that
    // fallback). Without it, switching from a real entity's Activities
    // straight into that fallback would leave the previous entity's
    // activities on screen instead of the correct "none loaded" state.
    clearActivities(state) {
      state.activities = [];
      state.activitiesLoading = false;
      state.activitiesError = null;
    },
    // Same reasoning as clearActivities above, for the "Emails" filter.
    clearEmails(state) {
      state.emails = [];
      state.emailsLoading = false;
      state.emailsError = null;
    },
    // Same reasoning as clearActivities/clearEmails above, for the
    // "Tasks" filter.
    clearTasks(state) {
      state.tasks = [];
      state.tasksLoading = false;
      state.tasksError = null;
    },
    // Same reasoning as clearActivities/clearEmails/clearTasks above,
    // for the "Notes" filter.
    clearNotes(state) {
      state.notes = [];
      state.notesLoading = false;
      state.notesError = null;
    },
    // Same reasoning as clearActivities/clearEmails/clearTasks/
    // clearNotes above, for the "Tickets" filter.
    clearTickets(state) {
      state.tickets = [];
      state.ticketsLoading = false;
      state.ticketsError = null;
    },
    // Same reasoning as clearActivities/clearEmails/clearTasks/
    // clearNotes/clearTickets above, for the "Calendar Events" filter.
    clearCalendarEvents(state) {
      state.calendarEvents = [];
      state.calendarEventsLoading = false;
      state.calendarEventsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customers = action.payload.results;
        state.count = action.payload.count;
        state.next = action.payload.next;
        state.previous = action.payload.previous;
        // `action.meta.arg` is the exact URL this fetch was dispatched
        // with. A search-filtered fetch (this one, or a next/previous page
        // reached while a search is active — DRF's pagination links carry
        // existing query params through) still has `search=` in it; only a
        // plain listing fetch updates the "onboarded overall" total.
        const url = action.meta.arg;
        if (!url || !url.includes('search=')) {
          state.totalCount = action.payload.count;
        }
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Something went wrong.';
      })
      .addCase(fetchUpcomingRenewals.pending, (state) => {
        state.renewalsLoading = true;
        state.renewalsError = null;
      })
      .addCase(fetchUpcomingRenewals.fulfilled, (state, action) => {
        state.renewalsLoading = false;
        state.renewals = action.payload.results;
        state.renewalsCount = action.payload.count;
      })
      .addCase(fetchUpcomingRenewals.rejected, (state, action) => {
        state.renewalsLoading = false;
        state.renewalsError = action.payload ?? 'Something went wrong.';
      })
      .addCase(fetchCustomerStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchCustomerStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchCustomerStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload ?? 'Something went wrong.';
      })
      .addCase(fetchCustomerById.pending, (state) => {
        state.selectedCustomerLoading = true;
        state.selectedCustomerError = null;
        // Cleared, not left stale — otherwise navigating straight from one
        // org's Details page to another's briefly shows the previous org's
        // data under the new id while the fetch is in flight.
        state.selectedCustomer = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.selectedCustomerLoading = false;
        state.selectedCustomer = action.payload;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.selectedCustomerLoading = false;
        state.selectedCustomerError = action.payload ?? 'Could not load this organization.';
      })
      .addCase(fetchAccountsForCustomer.pending, (state) => {
        state.accountsLoading = true;
        state.accountsError = null;
        // Cleared for the same reason as selectedCustomer's own pending
        // case — otherwise switching orgs briefly shows the previous
        // org's accounts under the new one's tab.
        state.accountsForCustomer = [];
      })
      .addCase(fetchAccountsForCustomer.fulfilled, (state, action) => {
        state.accountsLoading = false;
        state.accountsForCustomer = action.payload;
      })
      .addCase(fetchAccountsForCustomer.rejected, (state, action) => {
        state.accountsLoading = false;
        state.accountsError = action.payload ?? 'Could not load accounts.';
      })
      // fetchActivitiesForCustomer and fetchActivitiesForAccount share the
      // same activities/activitiesLoading/activitiesError slots — only one
      // of the two is ever in flight at a time, same reasoning as the
      // single accountsForCustomer slot above.
      .addCase(fetchActivitiesForCustomer.pending, (state) => {
        state.activitiesLoading = true;
        state.activitiesError = null;
        state.activities = [];
      })
      .addCase(fetchActivitiesForCustomer.fulfilled, (state, action) => {
        state.activitiesLoading = false;
        state.activities = action.payload;
      })
      .addCase(fetchActivitiesForCustomer.rejected, (state, action) => {
        state.activitiesLoading = false;
        state.activitiesError = action.payload ?? 'Could not load activities.';
      })
      .addCase(fetchActivitiesForAccount.pending, (state) => {
        state.activitiesLoading = true;
        state.activitiesError = null;
        state.activities = [];
      })
      .addCase(fetchActivitiesForAccount.fulfilled, (state, action) => {
        state.activitiesLoading = false;
        state.activities = action.payload;
      })
      .addCase(fetchActivitiesForAccount.rejected, (state, action) => {
        state.activitiesLoading = false;
        state.activitiesError = action.payload ?? 'Could not load activities.';
      })
      // fetchEmailsForCustomer and fetchEmailsForAccount share the same
      // emails/emailsLoading/emailsError slots, same reasoning as the
      // activities slots above.
      .addCase(fetchEmailsForCustomer.pending, (state) => {
        state.emailsLoading = true;
        state.emailsError = null;
        state.emails = [];
      })
      .addCase(fetchEmailsForCustomer.fulfilled, (state, action) => {
        state.emailsLoading = false;
        state.emails = action.payload;
      })
      .addCase(fetchEmailsForCustomer.rejected, (state, action) => {
        state.emailsLoading = false;
        state.emailsError = action.payload ?? 'Could not load emails.';
      })
      .addCase(fetchEmailsForAccount.pending, (state) => {
        state.emailsLoading = true;
        state.emailsError = null;
        state.emails = [];
      })
      .addCase(fetchEmailsForAccount.fulfilled, (state, action) => {
        state.emailsLoading = false;
        state.emails = action.payload;
      })
      .addCase(fetchEmailsForAccount.rejected, (state, action) => {
        state.emailsLoading = false;
        state.emailsError = action.payload ?? 'Could not load emails.';
      })
      // fetchTasksForCustomer and fetchTasksForAccount share the same
      // tasks/tasksLoading/tasksError slots, same reasoning as the
      // activities/emails slots above.
      .addCase(fetchTasksForCustomer.pending, (state) => {
        state.tasksLoading = true;
        state.tasksError = null;
        state.tasks = [];
      })
      .addCase(fetchTasksForCustomer.fulfilled, (state, action) => {
        state.tasksLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasksForCustomer.rejected, (state, action) => {
        state.tasksLoading = false;
        state.tasksError = action.payload ?? 'Could not load tasks.';
      })
      .addCase(fetchTasksForAccount.pending, (state) => {
        state.tasksLoading = true;
        state.tasksError = null;
        state.tasks = [];
      })
      .addCase(fetchTasksForAccount.fulfilled, (state, action) => {
        state.tasksLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasksForAccount.rejected, (state, action) => {
        state.tasksLoading = false;
        state.tasksError = action.payload ?? 'Could not load tasks.';
      })
      // fetchNotesForCustomer and fetchNotesForAccount share the same
      // notes/notesLoading/notesError slots, same reasoning as the
      // activities/emails/tasks slots above.
      .addCase(fetchNotesForCustomer.pending, (state) => {
        state.notesLoading = true;
        state.notesError = null;
        state.notes = [];
      })
      .addCase(fetchNotesForCustomer.fulfilled, (state, action) => {
        state.notesLoading = false;
        state.notes = action.payload;
      })
      .addCase(fetchNotesForCustomer.rejected, (state, action) => {
        state.notesLoading = false;
        state.notesError = action.payload ?? 'Could not load notes.';
      })
      .addCase(fetchNotesForAccount.pending, (state) => {
        state.notesLoading = true;
        state.notesError = null;
        state.notes = [];
      })
      .addCase(fetchNotesForAccount.fulfilled, (state, action) => {
        state.notesLoading = false;
        state.notes = action.payload;
      })
      .addCase(fetchNotesForAccount.rejected, (state, action) => {
        state.notesLoading = false;
        state.notesError = action.payload ?? 'Could not load notes.';
      })
      // fetchTicketsForCustomer and fetchTicketsForAccount share the
      // same tickets/ticketsLoading/ticketsError slots, same reasoning
      // as the activities/emails/tasks/notes slots above.
      .addCase(fetchTicketsForCustomer.pending, (state) => {
        state.ticketsLoading = true;
        state.ticketsError = null;
        state.tickets = [];
      })
      .addCase(fetchTicketsForCustomer.fulfilled, (state, action) => {
        state.ticketsLoading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTicketsForCustomer.rejected, (state, action) => {
        state.ticketsLoading = false;
        state.ticketsError = action.payload ?? 'Could not load tickets.';
      })
      .addCase(fetchTicketsForAccount.pending, (state) => {
        state.ticketsLoading = true;
        state.ticketsError = null;
        state.tickets = [];
      })
      .addCase(fetchTicketsForAccount.fulfilled, (state, action) => {
        state.ticketsLoading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTicketsForAccount.rejected, (state, action) => {
        state.ticketsLoading = false;
        state.ticketsError = action.payload ?? 'Could not load tickets.';
      })
      // fetchCalendarEventsForCustomer and fetchCalendarEventsForAccount
      // share the same calendarEvents/calendarEventsLoading/
      // calendarEventsError slots, same reasoning as the other feed
      // filters' slots above.
      .addCase(fetchCalendarEventsForCustomer.pending, (state) => {
        state.calendarEventsLoading = true;
        state.calendarEventsError = null;
        state.calendarEvents = [];
      })
      .addCase(fetchCalendarEventsForCustomer.fulfilled, (state, action) => {
        state.calendarEventsLoading = false;
        state.calendarEvents = action.payload;
      })
      .addCase(fetchCalendarEventsForCustomer.rejected, (state, action) => {
        state.calendarEventsLoading = false;
        state.calendarEventsError = action.payload ?? 'Could not load calendar events.';
      })
      .addCase(fetchCalendarEventsForAccount.pending, (state) => {
        state.calendarEventsLoading = true;
        state.calendarEventsError = null;
        state.calendarEvents = [];
      })
      .addCase(fetchCalendarEventsForAccount.fulfilled, (state, action) => {
        state.calendarEventsLoading = false;
        state.calendarEvents = action.payload;
      })
      .addCase(fetchCalendarEventsForAccount.rejected, (state, action) => {
        state.calendarEventsLoading = false;
        state.calendarEventsError = action.payload ?? 'Could not load calendar events.';
      })
      // createCustomer/updateCustomer's own rejections are shown inline in
      // their modal forms instead (same pattern as userManagementSlice's
      // addCSM/updateCSM) — no .rejected case needed here.
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.unshift(action.payload);
        state.count += 1;
        state.totalCount += 1;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated.is_archived) {
          // Archived — soft-hidden from the list, same as the backend
          // does for GET /customers/. Drop it locally too rather than
          // leaving a stale, now-archived row visible until next fetch.
          const wasPresent = state.customers.some((c) => c.id === updated.id);
          state.customers = state.customers.filter((c) => c.id !== updated.id);
          if (wasPresent) {
            state.count = Math.max(0, state.count - 1);
            state.totalCount = Math.max(0, state.totalCount - 1);
          }
        } else {
          const index = state.customers.findIndex((c) => c.id === updated.id);
          if (index !== -1) state.customers[index] = updated;
        }
        if (state.selectedCustomer?.id === updated.id) {
          state.selectedCustomer = updated;
        }
      })
      // createAccount/updateAccount's own rejections are shown inline in
      // their modal form instead, same pattern as above.
      .addCase(createAccount.fulfilled, (state, action) => {
        state.accountsForCustomer.unshift(action.payload);
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.accountsForCustomer.findIndex((a) => a.id === updated.id);
        if (index !== -1) state.accountsForCustomer[index] = updated;
      });
  },
});

export const {
  clearActivities,
  clearEmails,
  clearTasks,
  clearNotes,
  clearTickets,
  clearCalendarEvents,
} = customersSlice.actions;
export default customersSlice.reducer;
