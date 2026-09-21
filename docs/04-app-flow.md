---
description: App flow reference — every route, guard and user journey through Revenact, with the files and endpoints involved.
---

# Revenact — App Flow

Current as of 2026-09-18, read from `src/App.tsx`, the layout, the 27 Redux
slices and the page components. Written in the style of this repo's
`.agents/workflows/*-flow.md` notes: real file paths, real endpoint names, no
abstract description.

Companion documents: [UI/UX Design](03-ui-ux-design.md),
[PRD](../../revenact-backend/docs/product/01-prd.md),
[Backend Schema](../../revenact-backend/docs/product/05-backend-schema.md).

---

## 1. Shell

```
main.tsx
 └── <Provider store>
      └── <App>
           └── <BrowserRouter>
                ├── /login, /auth/callback, /forgot-password, /reset-password   (public, no shell)
                ├── /onboarding                                   (auth, no shell: the first-run tour)
                └── <ProtectedRoute>
                     └── <DashboardLayout>
                          ├── <Sidebar/>     hover-expands, 68px to 240px
                          ├── <Navbar/>      hidden on /scenarios/*
                          └── <Outlet/>      the page
```

`DashboardLayout` also owns the notification lifecycle: on mount with an access
token it fetches `/notifications/` and opens the `ws/notifications/` socket,
closing it on unmount or token change.

### Guards

| Guard | Behaviour |
|---|---|
| `ProtectedRoute` | Not authenticated, redirect to `/login` carrying `state.from` |
| `RequireCapability` | Capability absent from `user.permissions`, redirect to `/dashboard`. Replaces the former `AdminRoute` |
| `RequirePlatform` | Not `user.is_superuser`, redirect to `/dashboard`. Staff whose session lacks the `mfa` claim see a page saying which half is missing (enrol, or sign in again) instead of the portal |
| `TenantOnly` | Wraps the tenant shell and the tour: a superuser is sent to `/platform`. Staff belong to no tenant and never see the tenant app; `RootRedirect` sends them to the portal on sign-in |

---

## 2. Route map

| Path | Component | Guard |
|---|---|---|
| `/login`, `/forgot-password`, `/reset-password` | `Login`, `ForgotPassword`, `ResetPassword` | public |
| `/auth/callback` | `AuthCallback` (hand-off exchange, workspace form, or an explained refusal) | public |
| `/` | `RootRedirect`: `/login`, then `/onboarding` until `user.tour_completed_at` is set, then `/dashboard` | auth |
| `/onboarding` | `OnboardingCarousel`, the eight-step first-run tour | auth |
| `/account-settings/{account,billing,integrations,personalization,skills,about}` | `SettingsLayout` with its own left nav and the assistant rail | auth |
| `/platform`, `/platform/organisations`, `/platform/organisations/:id`, `/platform/staff` | `PlatformLayout` (its own shell) with `PlatformOverview`, `PlatformOrganisations`, `PlatformOrganisationDetail`, `PlatformStaff` | auth + `RequirePlatform` |
| `/platform/account` | `PlatformAccount`: the staff member's password and second factor. Reachable without an MFA session, because it is where MFA is set up | auth + `RequirePlatform` (staff only) |
| `/dashboard` → `/dashboard/advance` → `/dashboard/advance/health` | `AdvanceDashboard` | auth |
| `/dashboard/advance/health/{triage,divergence,movement,renewal-date,controls}` | `HealthOverviewContainer` and its five views | auth |
| `/dashboard/advance/{ai-trending,customer,activity,revenue,usage,product,ticket}/controls` | one container each | auth |
| `/dashboard/custom` | placeholder | auth |
| `/organizations/{list,board,:id}` | `List`, `Board`, `OrganizationDetails` | auth |
| `/accounts/{list,board,:id}` | `AccountsList`, `AccountsBoard`, `AccountDetails` | auth |
| `/contacts/{list,:id}` | `ContactsList`, `ContactDetails` | auth |
| `/pipelines/{list,board}` | `PipelinesPage` | auth |
| `/copilot` | `CopilotIndex` | auth |
| `/scenarios`, `/scenarios/create`, `/scenarios/:id` | `ScenariosList`, `CreateScenario` | auth |
| `/canvas`, `/canvas/create`, `/canvas/:id` | `CanvasPage`, `CanvasEditor` | auth |
| `/campaigns`, `/campaigns/create`, `/campaigns/:id` | `CampaignsList`, `CampaignEditor` | auth |
| `/surveys` | `SurveysPage` | auth |
| `/lifecycle`, `/health` | `LifecyclePage`, `HealthPage` | auth |
| `/custom-objects/:id` | `CustomObjectRecordsPage` | auth |
| `/integrations` | `Integrations` | auth |
| `/profile` | `Profile` | auth |
| `/users` | `UserManagement` | `manage_users` |
| `/settings/{data,currency,products,entity-uploads,webhooks,global-presets,ai-agent}` | one page each | auth, writes gated per capability |
| `/settings/{activities,connect-widget}` | `SettingPlaceholder` | auth |
| `/brain/{dashboard,graph,initiatives,review,feedback,agents,skills}` | one page each | `view_all_accounts` |
| `/*` inside the shell | "Under Construction" | auth |

### Navigation surfaces

**Sidebar** sections: top (Dashboard, Communications), ENTITIES (Organizations,
Accounts, Contacts, Pipelines), CUSTOM OBJECTS (one item per real definition,
fetched on mount), TOOLS (Segments, Project Management, Scenarios, Surveys,
Campaigns, Canvas), KNOWLEDGE BRAIN (seven items, whole section hidden without
`view_all_accounts`, with a live pending-proposal badge on Review Queue), SETUP
(Settings, Lifecycle, Health, Users, Integrations).

**Navbar** is route-contextual on the left: a greeting on Copilot, a back button
and entity identity on detail pages, a title plus sub-navigation on list pages.
On the right: the rose "AI Copilot" button, four unwired icon buttons, the
notification bell with an unread badge and popover, and the avatar menu with My
Profile and Sign out.

---

## 3. Data conventions

- **One HTTP path.** `src/lib/apiClient.ts` attaches the bearer token from the
  auth hooks, serialises JSON unless a `FormData` is passed, lets absolute URLs
  through so DRF `next` links work, turns 204 into null, and raises `ApiError`
  with a message pulled from `detail`, the first field error array, or a bare
  string array.
- **One refresh path.** A 401 triggers `refreshSession`, one retry with the new
  token, then `onAuthFailure` which clears the session.
- **Pagination.** Pages forward and back through DRF's own `next` and `previous`
  links; no page size is assumed. `fetchAllPages` exists for the few screens that
  genuinely need everything.
- **Mapping layer.** Backend payloads are adapted into the table shapes the
  mock-era components already expected: `mapToOrgRow.ts`, `mapToAccountRow.ts`,
  `toHealthDataRow.ts`, with shared formatting in `formatters.ts`. Purely
  presentational values (pill colours, avatar initials) are derived there rather
  than invented in the component.
- **Dashboard filters.** Each container builds a `URLSearchParams` and passes it
  through `Outlet` context; the `ControlsView` dispatches its slice's fetch with
  that query.

---

## 4. Core flows

### 4.1 Sign in, refresh, sign out

Two doors, one session shape.

**Continue with Google / Microsoft** (`features/auth/oauth.ts`)

1. `/login` asks `GET /auth/oauth/providers/` on mount and shows a button per
   provider the backend has configured; none configured, and only the password
   form appears. The list is the server's answer, never a constant.
2. A button calls `POST /auth/oauth/<key>/start/` and sends the whole window to
   the returned `authorize_url`. Never an iframe or popup.
3. The provider returns to the backend, which redirects to `/auth/callback` with
   exactly one of:
   - `?handoff=<code>`: `AuthCallback` scrubs the code from the address bar,
     dispatches `loginWithHandoff` (`POST /auth/oauth/exchange/`) once (guarded
     against StrictMode's double effect) and lands on `/`.
   - `?setup=<code>`: nobody has claimed this person's email domain.
     `WorkspaceSetup` previews who is signing up (`POST workspace/preview/`),
     asks for a company name, and `createWorkspace` (`POST workspace/`) creates
     the organisation with them as its first administrator and signs them in.
     A `409 WORKSPACE_CLAIMED` means a colleague got there first: they are told
     to sign in again, where they will be routed to that workspace.
   - `?error=<CODE>`: `ACCESS_REQUEST_PENDING` gets its own "waiting for
     approval" screen; every other code is explained in words by
     `authErrorMessage`, never shown as an identifier.

**Email and password**

1. `Login.tsx` validates with `loginSchema` (Zod: email required, password at
   least 8 characters).
2. `dispatch(login)` → `POST /auth/login/` with `skipAuthRetry`, so a bad
   password does not trigger a refresh attempt. The error stays visible until
   the person edits a field.
3. Someone with an authenticator app enrolled gets `{mfa_required, mfa_token}`
   and no session: the page becomes the code form (`auth.mfaChallenge`), and
   `loginWithMfa` → `POST /auth/login/mfa/` mints tokens whose `mfa` claim the
   slice reads into `auth.mfaVerified` (also after every refresh). Enrolment
   lives in Account settings (`TwoFactorSection`: QR from the server's
   `otpauth://` URI, confirm with a code, recovery codes shown once).

**Either way**

3. Tokens and user are written to `localStorage` under `revenact_access_token`,
   `revenact_refresh_token` and `revenact_user`, then the app navigates to
   `state.from` or `/`, where `RootRedirect` sends a first-timer to
   `/onboarding` (until `user.tour_completed_at` is set; finishing or skipping
   the tour writes it through `PATCH /auth/me/ {tour_completed: true}`).
4. On reload, `authSlice` hydrates from `localStorage` so `ProtectedRoute` passes
   without a round trip.
5. Any 401 from `apiFetch` → `POST /auth/token/refresh/` (the rotated refresh
   token is stored) → the original request is retried once. A second 401 clears
   the session and the guard redirects.
6. Sign out: the Navbar avatar menu dispatches `logout`, which clears the client
   first and then makes a best-effort `POST /auth/logout/` to blacklist the
   refresh token.

Forgot and reset password are separate public pages; the reset page reads `uid`
and `token` from the query string. Changing a password while signed in lives in
Account settings, and only for people who have one: `user.has_password` is false
for someone who only ever signed in with a provider, and they see how they sign
in instead.

### 4.2 Organisations: list to detail

1. `/organizations/list` dispatches `fetchCustomers`, `fetchCustomerStats` and
   `fetchUpcomingRenewals`.
2. `MetricsPanel` draws the health donut with a COUNT, MRR and ARR toggle, NPS,
   the lifecycle donut and a renewal-window popover.
3. `ActionBar` debounces search by 300ms into `/customers/?search=`.
   `OrganizationsTable` offers 34 selectable columns, row selection, and hover
   popovers that show the **real** health breakdown and CSAT bands.
4. Row click → `/organizations/:id`, which dispatches six parallel fetches:
   the customer, its accounts, contacts, opportunities, risks and canvases.
5. Tabs: General (metrics banner, `PinnedAttributes`, `ActivityFeed`), Company
   View, Accounts, Contacts, Pipelines, Custom Objects, Success Plans
   (placeholder), Canvas List.
6. "Ask Copilot" navigates to `/copilot?forCustomerId=&forCustomerName=`.

Add, edit, churn and archive all run through `OrganizationFormModal`,
`ChurnOrganizationModal` and a `ConfirmDialog` that patches `is_archived`.

### 4.3 Accounts

Reached from the Accounts tab of an organisation or from `/accounts/list`, in
both cases passing the mapped row through `location.state.account`. Tabs mirror
the organisation page and add Organizations.

> **Known flaw.** A direct visit or a page refresh on `/accounts/:id` has no
> navigation state, and the page falls back to the `ACCOUNTS_DATA` mock, showing
> a fabricated account. The Navbar header does the same. This is the last real
> mock dependency in the app. Fix is task A1 in the Implementation Plan.

### 4.4 Activity feed

Shared by both detail pages. Five top tabs and thirteen filter chips.

| Filter | State |
|---|---|
| All, Activities, Emails, Tasks, Notes, Tickets, Calendar Events, Surveys, Sessions | Real |
| Slack | Inline `SLACK_DATA` mock |
| Pulse, Conversations, Revenact Support | "coming soon" |

Emails open a thread panel with a quick reply, and Compose sends through the
signed-in person's own connected mailbox. Tasks and notes can be created inline.
Files upload with validation and download through an authenticated blob request.
CallSense logs a call with an optional transcript, which the backend summarises
and classifies immediately.

### 4.5 Pipelines

`/pipelines/board` loads opportunities, risks and customers. Switch between the
two record kinds, drag a card between stage columns to patch its `stage`, use the
"+" in a column header to open the form preset to that stage, and narrow with the
Filters popover (department, priority, stage). What a person sees is already
scoped server-side by department.

### 4.6 Copilot and multiplayer sessions

1. `/copilot`. `HomeView` offers skill cards that prefill a prompt, and a
   `MentionTextarea` that completes colleague and function mentions.
2. Sending posts to `/copilot/messages/`, creating or continuing a conversation.
   `ChatView` shows an optimistic user bubble, then the assistant turn with its
   sources.
3. The owner clicks "Make this a live session" → `POST .../session/` → the
   `ws/copilot/sessions/:id/` socket opens. A slow 20 second poll stays as a
   resilience fallback only.
4. "Hand off to…" picks a member and a note. A hand-off is its own way for a
   session to start existing; it does not require making the session live first.
5. The invitee sees "Invited to a live session" in the sidebar, polled every 8
   seconds, and accepting joins them. Access is invite only, and the same
   visibility function gates both REST and the socket.
6. "Capture decisions" runs the facilitator over the transcript and writes
   proposals into the Brain review queue, tagged with the session. "Close
   session" offers to capture first; the close always stands even if capture
   fails.
7. A viewer who may see only part of a conversation gets a `visibility: partial`
   notice, and a reply citing records outside their scope is withheld entirely.

The Cockpit tab is a personal view: portfolio summary, a renewals window of 30,
60 or 90 days, and my tasks.

### 4.7 Health Overview

One unpaginated request to `/customers/health/` on entry, mapped by
`toHealthDataRow`. `useHealthOverview` applies the owner, lifecycle and account
filters to all five tabs, so Triage, Divergence, Movement, Renewal Date and
Controls always agree. Unrated pulse scores are null and are excluded from the
divergence scatter, which says how many it left out.

### 4.8 Knowledge and @mentions

1. Organisation detail, Company View tab: the accountable owner tile with hand
   over, a responsible person per function, the contributions feed with a
   composer, and the questions panel.
2. Asking picks an assignee or uses `@name`, `@engineering` or `@team`. The
   assignee is notified.
3. They answer from the Copilot sidebar's "Questions for you" inbox or from the
   panel. The answer is stored as a contribution, so retrieval picks it up.
4. Assistant turns can suggest who to ask, and a question raised in a chat links
   back to that chat through its notification.

### 4.9 Integrations

The page has two halves. **Your mailbox**: connect Google or Microsoft through
OAuth, or IMAP through a form, then sync or disconnect. **Organisation
connectors**: pick a provider, the row expands into a setup form whose fields the
backend declares, then connect, enable, sync or disconnect. Webhook connectors
mint a secret shown once.

### 4.10 Settings and administration

Nine settings pages reached from the Navbar sub-navigation, each gated by
capability for writes and readable otherwise: Data (attribute usage plus the
global attribute mapping), Currency and exchange rates, Products, Entity Uploads
(CSV importer with column mapping), Webhooks, Global Presets, AI Agent, and two
placeholders.

`/users` manages members with inline role, function, manager and active controls,
a Roles tab that edits capability checkboxes live, and an Access tab
(`AccessTab.tsx`, `features/access/accessSlice.ts`): people waiting to join
(approve with a role, or reject), invitations (send by address and role; the
invited person signs in and is let straight in; cancel), and email domains
(add, copy the TXT record, check DNS; verified domains route sign-ins here).
Domains need `manage_org_settings`; the rest needs `manage_users`.

`/account-settings/*` is the personal side, in the newer shell (own left nav,
assistant rail): profile name, password or sign-in method, two-factor,
appearance (light, dark, system), timezone, cached-data reset, plan and
billing (`features/billing/billingSlice.ts` against `/api/v1/billing/`: the
plan, seats used of limit, AI credit balance, published plans, and, with
`manage_org_settings`, the credit ledger), integrations, personalization
rules, skills and tasks, about.

### 4.10a The internal portal

`/platform/*`, for Revenact staff only (`features/platform/platformSlice.ts`
against `/api/v1/platform/`). Its own thin shell, never the tenant one.
Overview counts; organisations with search by name or domain and a status
filter, and **New organisation** (name plus the owner's email: the owner is
created as the tenant's root user, an Admin with no password who signs in
with a provider on that address or from the reset email); an organisation's
name (rename in place), owner (transfer to another active member when the
owner cannot), suspend or reactivate with a required reason, archive (closes
sign-in, hides it from the list, purges nothing), members (owner first),
domains, the last twenty audit events, and a billing card (plan, seats,
credits, recent ledger; adjust credits, set the seat allowance or change the
plan, each with a mandatory reason); staff with their second-factor
state. Metadata only: nothing here shows a tenant's customers,
emails or notes, and the backend pins that. The Sidebar shows a Platform link
to superusers.

### 4.11 Brain

Seven pages behind `view_all_accounts`: Overview (brief, signals, questions
waiting, knowledge by function, the metric layer with a "Why?" explanation on
every tile, and drivers), Initiatives, Review Queue, Feedback Log, Agents (model
budgets and recent calls), Skills, and the Knowledge Graph.

### 4.12 Builders

**Scenarios**: full-canvas React Flow with no Navbar. Drag nodes from the palette,
connect them, click one to configure it in a slide-over, save the graph as JSON,
and Run Now against a chosen customer to see the run log.

**Canvas**: drag contacts of a company onto a board and connect them with labelled
relationships.

---

## 5. Real-time flows

| Channel | Opened by | Carries |
|---|---|---|
| `ws/notifications/?token=` | `DashboardLayout` on mount | New notifications, prepended and deduplicated into the bell |
| `ws/copilot/sessions/:id/?token=` | `CopilotIndex` when a session is active | Session snapshots, merged by event id |

Both reconnect after two seconds until explicitly disconnected. The token travels
as a query parameter because a WebSocket handshake cannot carry a header.

---

## 6. Redux map

27 slices. The ones that matter:

| Slice | Holds |
|---|---|
| `auth` | User, tokens, hydration from `localStorage` |
| `customers` | The largest by far: customers, accounts, contacts, every activity-feed list, opportunities, risks, surveys, canvases, and their stats. 76 thunks |
| `copilotSessions` | Sessions by conversation id, plus my invites |
| `notifications` | Items, with optimistic read state |
| `health`, `usage`, `forecast`, `activity`, `portfolio`, `products`, `tickets`, `interactions` | One dashboard each |
| `metrics`, `initiatives`, `proposals`, `feedback`, `agents`, `skills`, `graph` | The Brain |
| `knowledge` | Contributions, responsible people, questions, my inbox |
| `mail`, `files`, `calls`, `connectors` | Integrations and record attachments |
| `userManagement` | Members, roles, capabilities |
| `counter`, `tasks` | Dead. Template leftovers, unused by any page |

---

## 7. Dead ends a user can reach

| Route or control | What happens |
|---|---|
| Sidebar: Communications, Product Feedbacks, Segments, Project Management | "Under Construction" |
| `/dashboard/custom` | "Custom Dashboard (Beta) Coming Soon" |
| Settings: Activities, Connect Widget | Placeholder |
| Success Plans tab on both detail pages | "Coming Soon" |
| Activity feed: Pulse, Conversations, Revenact Support | "coming soon" |
| Activity feed: search box, "Add Action", filter icon | No handler |
| Navbar: Search, Plus, Help, Message | No handler |
| Navbar list-page title chevrons | No menu |
| Settings sidebar: "Revenact for desktop" | No handler yet |
| Settings rail: "Next event" | Says nothing is scheduled; no personal calendar feed exists |
| `/accounts/:id` on refresh | Silently shows mock data |
