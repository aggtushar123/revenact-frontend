---
description: App flow reference — every route, guard and user journey through Revenact, with the files and endpoints involved.
---

# Revenact — App Flow

Current as of 2026-09-24, read from `src/App.tsx`, the layout, the 27 Redux
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
                          ├── <Navbar/>      hidden on /scenarios/* and on /copilot (the home page)
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
| `/` | `RootRedirect`: `/login`, then `/onboarding` until `user.tour_completed_at` is set, then `/copilot` (staff: `/platform`) | auth |
| `/onboarding` | `OnboardingCarousel`, the eight-step first-run tour | auth |
| `/account-settings/{account,billing,integrations,personalization,skills,about}` | `SettingsLayout` with its own left nav and the assistant rail | auth |
| `/platform`, `/platform/organisations`, `/platform/organisations/:id`, `/platform/staff` | `PlatformLayout` (its own shell) with `PlatformOverview`, `PlatformOrganisations`, `PlatformOrganisationDetail`, `PlatformStaff` | auth + `RequirePlatform` |
| `/platform/account` | `PlatformAccount`: the staff member's password and second factor. Reachable without an MFA session, because it is where MFA is set up | auth + `RequirePlatform` (staff only) |
| `/dashboard`, `/dashboard/custom` | `Keep` → `/dashboard/overview` | auth |
| `/dashboard/overview` | `Overview` — the ranked attention list plus a Revenue/Health/Support headline card each | auth |
| `/dashboard/revenue/{forecast,customers,products}` | `AreaLayout` (area: revenue) wrapping `ForecastContainer`, `CustomerOverviewContainer`, `ProductUsageContainer` | auth |
| `/dashboard/health/{triage,divergence,movement,renewals,distribution}` | `AreaLayout` (area: health) wrapping `HealthOverviewContainer` and its five views | auth |
| `/dashboard/health/{usage,activity}` | `AreaLayout` (area: health) wrapping `UsageOverviewContainer`, `ActivityContainer` | auth |
| `/dashboard/support/{tickets,topics}` | `AreaLayout` (area: support) wrapping `TicketOverviewContainer`, `AITrendingTopics` | auth |
| `/health`, `/dashboard/advance/*` | `Keep`/`LegacyRedirect` → the equivalent `/dashboard/...` route, query string preserved (`src/pages/dashboard/redirects.tsx`, mapping in `areas.ts`'s `LEGACY`) | auth |
| `/organizations/{list,board,:id}` | `List`, `Board`, `OrganizationDetails` | auth |
| `/accounts/{list,board,:id}` | `AccountsList`, `AccountsBoard`, `AccountDetails` | auth |
| `/contacts/{list,:id}` | `ContactsList`, `ContactDetails` | auth |
| `/pipelines/{list,board}` | `PipelinesPage` | auth |
| `/communications` | `CommunicationsPage`, arranged as an inbox with its own top bar (no Navbar): the inbox card (folders for the four kinds of waiting with counts, Needs-you and Mine-only switches, a list grouped by month, the open item in place, with a `ReplyBox` under it: Draft with Copilot fills it from the thread and the account's history and lists the sources used; Send reply on an email row sends from the person's mailbox via `POST /communications/emails/<id>/reply/`); on `?source=mailbox:<provider>` the card is `MailboxView` instead, the person's own mail whole (Inbox/Drafts/Sent/Done/Muted with counts, Priority and Unread switches, Starred/Important/Spam/Trash and the categories, a Categories block of what is waiting, the list by month, the open message with star/done/mute and a reply that sends from the mailbox); and the shared Copilot rail (`components/copilot/CopilotRail`, with Next event above it and the picked source as context; New chat, History and a hide switch live in the top bar) | auth |
| `/copilot` | `CopilotIndex`: **the home page**. No Navbar, no frame; the greeting, the ask box, three suggested questions and the skills sit directly on the canvas, with a small Copilot/Cockpit switch top-right. Cockpit sits on the same canvas: My book (counts, value, health rings), Renewals with a window selector and drill-down, and My tasks, where the circle on a row completes the task through `PATCH /tasks/<id>/` (optimistic, reverted with the backend's message on refusal). First item in the sidebar | auth |
| `/scenarios`, `/scenarios/create`, `/scenarios/:id` | `ScenariosList`, `CreateScenario` | auth |
| `/canvas`, `/canvas/create`, `/canvas/:id` | `CanvasPage`, `CanvasEditor` | auth |
| `/campaigns`, `/campaigns/create`, `/campaigns/:id` | `CampaignsList`, `CampaignEditor` | auth |
| `/surveys` | `SurveysPage` | auth |
| `/lifecycle` | `LifecyclePage` | auth |
| `/custom-objects/:id` | `CustomObjectRecordsPage` | auth |
| `/integrations` | `Integrations` | auth |
| `/profile` | `Profile` | auth |
| `/users` | `UserManagement` | `manage_users` |
| `/settings/{data,currency,products,entity-uploads,webhooks,global-presets,ai-agent}` | one page each | auth, writes gated per capability |
| `/settings/{activities,connect-widget}` | `SettingPlaceholder` | auth |
| `/brain/{dashboard,graph,initiatives,review,feedback,agents,skills}` | one page each | `view_all_accounts` |
| `/*` inside the shell | "Under Construction" | auth |

### Navigation surfaces

**Sidebar** is an icon rail that never widens: resting the pointer on an item (or focusing it) shows its name in a pill beside it (`useHoverLabel` / `HoverLabel`); section headings are thin separators. Sections: top (Copilot, Dashboard, then the Communications group: the inbox and every connected source in a pill that opens and closes with a chevron; a source goes to `/communications?source=`), ENTITIES (Organizations,
Accounts, Contacts, Pipelines), CUSTOM OBJECTS (one item per real definition,
fetched on mount), TOOLS (Segments, Project Management, Scenarios, Surveys,
Campaigns, Canvas), KNOWLEDGE BRAIN (seven items, whole section hidden without
`view_all_accounts`, with a live pending-proposal badge on Review Queue), SETUP
(Settings, Lifecycle, Health, Users, Integrations).

**Navbar** is route-contextual on the left: a greeting on Copilot, a back button
and entity identity on detail pages, a title plus sub-navigation on list pages.
On the right: the rose "AI Copilot" button, four unwired icon buttons, the
notification bell with an unread badge and popover, and the avatar menu with My
Profile and Sign out. On `/dashboard/*` the Navbar is Communications' header
instead (transparent `h-16 px-4`, no border or shadow): "Dashboard" and the area
tabs on the left, the Ask pill then the bell on the right, and no avatar menu
(the sidebar's avatar carries it).

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
- **Dashboard filters.** `useDashboardFilters` (`src/pages/dashboard/shared/useDashboardFilters.ts`)
  reads and writes `useSearchParams` directly, so a filtered view is always a
  linkable URL. `SHARED_KEYS` (`owner`, `lifecycle`, `customer`) are the three
  every stats endpoint already reads, rendered by `DashboardToolbar`, and the
  only keys the Navbar's area tabs and Overview's links carry from one area to
  another (`sharedSearch`). Views add their own keys on top. Period keys:
  Forecast's `horizon_days` (default `365`), Activity's `days` (default `90`),
  Tickets' `days` validated against its `DATE_PRESETS`. Other view keys:
  Topics' `scope` (`customer:<id>` or `account:<id>`, which organisation or
  account to read — not a period), Product's `product`, Tickets' `priority`.
  `toQuery` turns the current values into the API's query string, renaming a
  key where the backend spells it differently.

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
   View, Accounts, Contacts, Pipelines, Custom Objects, Success Plans.
   Under the pinned attributes, `AIAttributesPanel` lists the AI attributes
   defined in Settings > AI Attributes with the Copilot's latest answer, a
   "why" with reasoning and cited sources, the history of answers and
   corrections, an inline override and a refresh (see the backend's
   `attributes` contract)
   (placeholder), Canvas List.
6. "Ask Copilot" navigates to `/copilot?forCustomerId=&forCustomerName=`.

Add, edit, churn and archive all run through `OrganizationFormModal`,
`ChurnOrganizationModal` and a `ConfirmDialog` that patches `is_archived`.

A dashboard drill's "Open as a list" (§4.7) lands here as `?ids=3,7`: the
table fetches `/customers/?ids=3,7` instead of the plain list, a banner reads
"Showing n accounts from the dashboard" with a "Show all" that clears the
param and restores focus to the search box, and `MetricsPanel`'s population
figure comes from a separate, unfiltered `/customers/` count probe rather
than the `ids`-filtered fetch — so it keeps reading the whole book, not the
drilled-down page. Until that probe answers (or if it fails) the figure reads
"—", never 0, and the banner leaves out its number while the `ids` fetch is
loading.

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

### 4.5b Feature requests (Brain > Feature Requests)

1. `/brain/requests`. `FeatureRequestsPage` lists what customers keep asking
   for, most revenue first, with a status filter. Every figure is the
   reader's own: the ARR, the company and ask counts and the evidence cover
   only the companies they may open and the records they may read.
2. Leadership presses "Gather asks": the backend clusters the interactions
   the classifier tagged as feature requests and names each new group. The
   result says how many requests were made, from how many asks, and how many
   are left for the nightly pass.
3. Opening a request shows its summary, the companies asking with their ARR,
   and the evidence with a link to each company. Leadership can change the
   status from the same pane.

### 4.5d Anomalies (Brain > Anomalies)

1. `/brain/anomalies`. `AnomaliesPage` lists what is going wrong at several
   companies at once, most revenue first, with a status filter. Every
   figure is the reader's own: the companies they can open and the reports
   they can read.
2. Leadership presses "Look now" to run detection rather than waiting for
   the nightly pass, and the result says how many clusters were named and
   how many reports joined existing ones.
3. Opening one shows the summary, the revenue and spread, the companies hit
   with links, and the reports behind it. Leadership can mark it
   acknowledged or resolved, and a resolved cluster stops collecting.

### 4.5c The account brief and what nobody can answer (Company View)

1. Organization Details › Company View opens with `AccountBriefPanel`: the
   standing brief on what this account uses the product for, who the
   stakeholders are and what is still open, with the date it was written
   and who asked for it.
2. "Write the brief" or "Rewrite" asks the Copilot to read what the company
   knows and write a new one. It cites the records it used; a reader is
   shown only the citations they may open, with a count of the rest.
3. Under it, "What we cannot answer": questions asked of the Copilot that
   had nothing to go on, and routed questions nobody answered. Answering
   one records an ordinary contribution and closes the gap; a gap not worth
   answering can be dismissed.

### 4.5e Reading in your language, writing in theirs (Communications)

1. An email, ticket or call in the queue detail pane carries a Translate
   control with a language picker. The original shows until somebody asks;
   the translation then replaces it with a line saying what it was written
   in, and "Show original" puts it back.
2. Translating the same message again costs nothing: the backend keeps it
   per record per language, and the pane keeps what it has already asked
   for.
3. When the contact's own language is known, the reply box offers "Write in
   French" (or whichever): it puts the draft into their language in place.
   The person still reads it and still presses send.

### 4.5f Brief delivery (Settings > Brief Delivery)

1. `/settings/brief-delivery`. An admin pastes a Slack incoming webhook and
   chooses weekly on a weekday or monthly on a day. There is no hour: the
   job that posts it runs once a night, so it goes out on its day.
2. The webhook is written once and never shown again: the page shows the
   last few characters, enough to recognise which hook is set, and when it
   last sent.
3. "Send one now" proves a new schedule without waiting a week. It reports
   plainly when no brief has been written yet, because the schedule posts
   what exists and never writes one itself.

### 4.5g Agent access (Settings > Agent Access)

1. `/settings/agent-access`. Anyone can make a key for an agent that reads
   Revenact as them over MCP: it sees their book, their mail and their
   department's tickets, and cannot change anything.
2. The secret is shown once, on the screen that made it, with a copy
   button and a plain warning that nobody can recover it afterwards.
3. The list shows each key by name, its last four characters, when it was
   made and when it was last used. Revoking asks first and takes effect
   immediately.

### 4.6 Copilot and multiplayer sessions

1. `/copilot`. `HomeView` offers skill cards that prefill a prompt, and a
   `MentionTextarea` that completes colleague and function mentions.
2. Sending posts to `/copilot/messages/`, creating or continuing a conversation.
   `ChatView` sits straight on the canvas (no card): the user's question is a
   surface pill on the right, the answer is a reading column (`AnswerText`
   renders paragraphs, numbered and bulleted lists, bold and code) with its
   sources and a single Copy action; the ask box stays pinned at the bottom.
   While the answer is pending, a skeleton with a live status line shows.
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
8. Conversations started on the dashboard carry an `origin` (area, view,
   filters). The chat history shows it before the time ("Revenue › Forecast ·
   2h ago"); such a conversation opens here as plain text.

The Cockpit tab is a personal view: portfolio summary, a renewals window of 30,
60 or 90 days, and my tasks.

### 4.7 Dashboard

The old "Advance Dashboards" tab bar is gone; the dashboard is now three areas
under one route tree, defined once in `src/pages/dashboard/areas.ts` (`AREAS`)
and rendered by `src/pages/dashboard/routes.tsx` (`dashboardRoutes`):

```
/dashboard/overview                                  Overview (attention list + headline cards)
/dashboard/revenue/{forecast,customers,products}      Revenue
/dashboard/health/{triage,divergence,movement,
                    renewals,usage,activity,
                    distribution}                     Health
/dashboard/support/{tickets,topics}                   Support
```

- **Overview** (`Overview.tsx`) is the dashboard's landing page: a ranked
  "Needs attention" list beside a headline card per area, filtered by the
  same three book filters as the areas.
  - **The list** (`overview/AttentionList.tsx`, `GET /dashboard/attention/`)
    holds five kinds — renewal, risk, going quiet, support, anomaly — ranked
    by money at stake × urgency (the server's own `score`; the client never
    re-ranks). Each row shows a kind chip, a title (a link to
    `/organizations/<id>` for every kind but anomaly), a reason line and the
    amount at stake. An **anomaly** row's title is a button, not a link — it
    opens the drill panel over its list of companies (`"1 company"` /
    `"<n> companies"`),
    since one anomaly can span several.
  - **Snooze 7 days** and **Done** are optimistic: the row is replaced at
    once by a "Snoozed · `<title>`" / "Marked done · `<title>`" line with an
    **Undo** button in the same place; a failed call restores the row and
    shows an alert and puts focus back on the row's Snooze. Focus moves to
    the Undo button after Snooze/Done and back to Snooze after Undo, and the
    swapped line is `aria-live="polite"`. Undo is held in the list's own
    state, keyed by item and spliced back in at the position it was acted
    on; it lasts until the filter changes (`Overview.tsx` keys the whole
    `AttentionList` by the query string, so another filter starts clean) or
    the page is left. The Overview only refetches on a filter change, so
    there is no same-filter reload for it to survive. An Undo whose DELETE
    answers 404 (the snooze already gone) counts as done.
  - While a refetch runs, or after a failed load, the previous rows stay on
    screen dimmed but read-only: Snooze, Done and Undo are disabled and the
    list is `aria-busy`, so nothing is filed under a filter it doesn't
    belong to.
  - **Snooze 7 days** expires after 7 days: the item returns then if it is
    still a candidate. It returns sooner if it **gets worse** than it was
    when snoozed (risk score rising, renewal further overdue, more ARR at
    stake, more open tickets) or a **new episode starts** (a new renewal
    date, a new last contact, a newly open ticket).
  - **Done** has no expiry: the item returns only when it gets worse or a
    new episode starts, never merely because time passed.
  - **The three headline cards** (`overview/HeadlineCards.tsx`) — Revenue,
    Health, Support — each read the same slice/endpoint their area page
    does, so the Overview can never disagree with the page its
    "Open `<Area>` →" link goes to (which carries only the shared filters).
    Revenue shows "ARR today" and "At risk" (churn + contraction, 12 months)
    off `fetchForecast`; Health mirrors the shared filters into
    `state.health.filters` exactly as `HealthOverviewContainer` does
    (clearing them on unmount) and shows "Book at Good x/y" and "Needs
    action n" off the same triage summary the Triage view uses; Support
    shows "Open tickets" and its oldest-open-day count off
    `fetchTicketStats` — Support/Tickets has no lifecycle filter, so only
    owner and account travel to it.
  - Each card shows a skeleton in place of its figures until the data it
    holds actually answers the current filters — a stale answer for a
    previous query (a different horizon, a filter changed mid-flight) counts
    as not loaded yet, not shown as if it were current.
- **`DashboardFrame`** is the `dashboard` route's element: an outer row
  (`p-4`, `relative`) holding the scroll container (`overflow-y-auto`) for
  Overview and every area, since `DashboardLayout`'s `<main>` is
  `overflow-hidden`.
- **Ask Revenact.** `DashboardFrame` mounts `FilterNamesProvider` →
  `AskProvider` → `DrillProvider` around `[scroll area][AskRail]`
  (`src/pages/dashboard/ask/`). The conversation lives in `AskProvider`, above
  the areas, so it survives tab and filter changes.
  - **Sending.** Each question posts to `/copilot/messages/` with
    `context: {surface:'dashboard', area, view, filters:{owner, lifecycle,
    customer}, focus}` and no text prefix. `useDashboardContext()` reads the
    route (`areas.ts`) and `useDashboardFilters(SHARED_KEYS)` at send time, so a
    follow-up after a filter change carries the new filters; the client never
    sends figures, and the server recomputes the screen. Each user message shows
    its own chip from its echoed `context` (e.g. "Revenue › Forecast · Owner:
    Priya"), with names from the view's filter options, which `DashboardToolbar`
    reports into `FilterNamesProvider`. Replies render as plain text
    (`whitespace-pre-wrap`), not the paragraph/list/bold `AnswerText` formatting
    `/copilot` uses; a reply withheld from a reader with narrower visibility in
    a shared session renders the same way, as plain text.
  - **Layout.** Shaped like Communications' Copilot rail: a 320px glass
    column (`CopilotRail variant="glass"`), no header row of its own. The
    frame is Communications' too: `DashboardFrame` is `flex gap-3 px-4 pb-4`
    under the transparent top bar (`<main>` unpadded on `/dashboard/*`), so
    the content column (filters toolbar and views, its own scroll) and the
    rail share a top and run the full remaining height; hidden, the content
    takes the full width. The empty rail shows Communications' line ("Ask
    about what is in front of you. Answers use your accounts, mail and
    tickets."); the suggested questions were removed on 2026-09-24 at the
    owner's request. Its
    controls are a pill in the Navbar, where the four decorative icons were
    (`/dashboard/*` only): New chat, History (its popover anchored in the
    pill) and the Sparkles switch ("Show Copilot"/"Hide Copilot",
    `aria-pressed`). `DashboardLayout` owns a Navbar actions slot
    (`layouts/navActionsSlot.ts`); the Navbar renders it on dashboard routes
    and `AskControls` portals the pill into it (nothing renders without a
    slot). Open by default from `xl` (1280px), hidden (not rendered) below it
    until switched on; the switch's choice is kept in `localStorage`
    (`revenact_dashboard_ask`, read and written in try/catch). Below `sm` the
    switch opens a full-screen sheet instead (`aria-modal`, Tab trapped, a
    Close button, Escape/Close return focus to the switch).
  - **Entry points.**
    - Typing.
    - "Ask about these" in the drill panel: it closes the drill first, because
      the drill sits over the rail at `lg` and up, then opens the rail and
      prefills "Why are these in <segment>?" with focus `{kind:'companies',
      ids}`. It is enabled only for a complete list of up to 200 accounts;
      otherwise it is disabled with a note explaining the 200-account limit,
      and nothing is sent until the person sends it.
    - "Why?" on an attention row: it sends "Why is this on my list?" at once
      with focus `{kind:'attention', key}`. While an answer is in flight
      (or that row's Snooze/Done is) it is `aria-disabled` and `ask()` sends
      nothing and clears nothing.
    - Every entry point (and a History pick) opens the rail (or the phone
      sheet) for that visit only, and so does New chat; only the Sparkles
      switch, from `sm` up, writes the remembered
      open/closed choice to `localStorage` — an entry point never
      overwrites it. The phone sheet's Close saves nothing; the sheet
      always starts closed.
    - Calling `ask()` (a send-at-once entry point) replaces any earlier
      drafted question and its focus, so a prior "Ask about these" draft
      can't be sent alongside a new focus.
    - A focus lasts one question; it is also dropped by the chip's × or by
      another area or filter.
  - **States.**
    - In flight: a "Thinking…" skeleton.
    - A `400` (a malformed context) is shown as a generic error with Retry,
      the same as any failure that isn't a budget one.
    - A `429`: "This month's AI budget is used up." with no retry.
    - Any other failure keeps the question, with Retry, which resends the
      question exactly as first asked — its own context and focus — not the
      screen as it now stands.
    - Sources render under answers as on `/copilot`.
  - **History.** The Navbar pill has New chat, History and the switch. History is
    shared with Communications and the Copilot page. A conversation whose
    `origin` is set shows a tag with only its area and view (e.g. "Revenue ›
    Forecast"), never the filters it was asked with — those live on each
    question's own chip. Reopening one on the dashboard navigates to its area,
    view and filters, then shows the thread. From Communications or `/copilot`
    it opens where you are, as plain text, with the tag shown.
- **`AreaLayout`** hands each area's sub-view list down through `Outlet`
  context (`useSubViews`); each container renders `DashboardToolbar` (the
  sub-view switch plus the filter row) and dispatches its own fetch.
- **Health** carries seven views from three containers:
  `HealthOverviewContainer` renders Triage, Divergence, Movement, Renewals and
  Distribution off one `/customers/health/` request (`useHealthOverview`
  applies the shared owner/lifecycle/account filters to all five, mapped by
  `toHealthDataRow`; unrated pulse scores are null and excluded from the
  divergence scatter, which says how many it left out); `UsageOverviewContainer`
  and `ActivityContainer` are separate containers for Usage and Activity.
  Distribution is itself two halves: the old Health Controls charts
  (`ControlsView`) and the old `/health` page's whole-tenant
  Organizations/Accounts × count/MRR rollup (`HealthDistribution`), which
  reads `/customers/stats/` and `/accounts/stats/` — neither accepts the
  dashboard's filters, so that half ignores the bar above it and says so
  (`"Covers the whole book; the filters above do not apply to this section."`)
  whenever `owner`, `lifecycle` or `customer` is set.
- **Filters** live in the URL — see "Dashboard filters" in §3 — so a filtered
  view is a link, not a session-local state. Health mirrors the URL into
  `state.health.filters` exactly (`replaceHealthFilters`, no pruning), so a
  deep link applies even when the book loads after it; once rows exist, a
  filter the book cannot honour (an owner who left, an account the chosen
  owner doesn't hold) is removed from the URL itself, narrowest first.
- **Redirects.** `/health` and every `/dashboard/advance/*` path redirect to
  their new home with the query string kept (`Keep`, `LegacyRedirect`); the
  mapping from an old path to its new one is `LEGACY` in `areas.ts`. `/dashboard`
  and `/dashboard/custom` both land on `/dashboard/overview`.
- **Drill-down.** Any number or chart segment that can name the accounts
  behind it opens the drill panel — one panel for the whole dashboard,
  mounted once by `DashboardFrame` inside a `DrillProvider`
  (`src/pages/dashboard/drill/`), not one per view. A `Kpi` given an
  `onDrill` renders as a button (`"<label> <value>, show accounts"`); a
  Recharts segment a keyboard can't reach gets a parallel `DrillTargets` row
  of real buttons, visible on focus. Both call `useDrill().open({title,
  figure, source}, trigger)`.
  - **Source.** `{kind: 'rows', rows}` for a list already computed
    client-side — Triage's three tiles, Divergence's headline numbers,
    Movement's downgrade/upgrade counts, Renewals' four tiles plus its
    calendar/coverage-gap/owner-load charts, Distribution's owner bar,
    CSM/AI pulse bars and renewal-date bar, Customer Overview's "Top 3
    concentration", Usage's three seat tiles and its utilisation-band chart.
    `{kind: 'server', path, query, segment}` for one the client can't
    compute cheaply, which fetches `GET <path>?<query>&drill=<segment>` —
    Customer Overview's "Churned in 12 months" (`/customers/overview/`),
    Activity's "Gone quiet" (`/customers/activity/`), Forecast's "At risk"
    tile and its ARR-bridge chart (`/customers/forecast/`), Tickets'
    KPIGrid and every donut/bar (`/tickets/stats/`), Topics' five charts
    (`/interactions/stats/`).
  - **Completeness.** A drill opens only where the list behind it is
    complete, never from a capped one (Forecast's `swing` table, Activity's
    `going_dark` table, Customer Overview's `concentration` list beyond its
    own top three, Topics' `recent` table). Every Health view (Triage,
    Divergence, Movement, Renewals, Distribution) turns every one of its
    drills off when `useHealthOverview()` reports the book `truncated`;
    Usage turns its three tiles and band chart off until
    `stats.scatter.length >= kpis.measured_count` (the scatter is capped at
    500 rows server-side with no `truncated` flag of its own), and its "No
    seat data" tile is never drillable — those accounts aren't in `scatter`
    at all. Product Usage (`product-usage/ControlsView.tsx`) has no drill
    anywhere: every figure there is an aggregate across a product's own
    customers, never a set of accounts.
  - **Panel.** `role="dialog"`, `aria-labelledby` the title. From `1024px`
    (`lg`) it is a 360px panel positioned over the Ask rail (absolute, in the
    rail's box: `lg:top-0 lg:right-4 lg:bottom-4`), so opening it never narrows the figures; below that it
    is a full-screen sheet (`aria-modal="true"`) with
    its own Tab/Shift+Tab focus trap, since there's nowhere else useful for
    focus to go. Escape and the close button both close it from either
    layout — Escape always closes the sheet, but at `lg` it closes the panel
    only when focus is inside it and nothing else already handled the key
    (`defaultPrevented`), so the page keeps its own Escape. Focus returns to
    the trigger that opened it, and moves to the close button when a drill
    opens, not when the viewport merely crosses `lg`.
  - **Lifetime.** A drill describes the screen it was opened on, so the
    panel closes when the path or query string changes (another area, or
    any filter), without refocusing the old trigger. While a view refetches
    it keeps its old figures on screen, dimmed, but every server drill on it
    (Forecast, Customer Overview's churned tile, Activity's gone-quiet tile,
    Tickets, Topics) is off until the new figures land — a drill then would
    send the new query and list its accounts under the old figure. A bucket
    at 0 in Tickets or Topics offers no drill. A segment the backend doesn't
    recognise comes back with no `drill` key and the panel says "This number
    can't be listed.".
  - **Rows.** Each links to `/organizations/<id>`, shows its ARR and an
    optional one-line detail worded for the segment (a risk score, days
    overdue, seats used, tickets, interactions — `drillApi.ts`'s
    `formatDetail`). A ticket or interaction drill lists companies, not
    records, so one 11px line under the header says so: companies with at
    least one matching ticket (interaction), records not linked to a company
    aren't listed, and one on a shared account counts for each of its
    companies. Renewals' calendar and coverage-gap segments show the ARR the
    segment draws, not an account count. A server drill that the backend itself truncated at 500
    prints "Showing n of count". "Open as a list" appears only when the full
    count is known, `<= 500` and not truncated, and goes to
    `/organizations/list?ids=<comma ids>`.

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

A Condition or Filter node asks one of two things. A fact about the
organization: its lifecycle stage, owner, health, NPS, ARR, days until
renewal, open tickets, name, or any AI attribute the organization has
defined, compared with the usual operators plus contains, is one of, is
empty and is not empty. Or what they have been saying: a plain-English
phrase matched against their recent emails, tickets and calls, with a
match strength. The run log says which record matched and how closely.

Two action nodes route work. Assign Owner hands the organization to a
named colleague or to whoever in a function carries the fewest, and tells
them. Notify puts it in front of the owner, their manager or someone
named. The On Event trigger can also start a scenario when an email,
ticket or call is classified, which is what a phrase condition is for.

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
| Sidebar: Product Feedbacks, Segments, Project Management | "Under Construction" |
| Settings: Activities, Connect Widget | Placeholder |
| Success Plans tab on both detail pages | "Coming Soon" |
| Activity feed: Pulse, Conversations, Revenact Support | "coming soon" |
| Activity feed: search box, "Add Action", filter icon | No handler |
| Navbar: Search, Plus, Help, Message | No handler |
| Navbar list-page title chevrons | No menu |
| Settings sidebar: "Revenact for desktop" | No handler yet |
| Settings rail: "Next event" | Says nothing is scheduled; no personal calendar feed exists |
| `/accounts/:id` on refresh | Silently shows mock data |
