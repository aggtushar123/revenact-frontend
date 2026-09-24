---
description: Full repository architecture, module map, and data flow reference for the Revenact SaaS app
---

# Revenact SaaS — Repository Architecture & Flow

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript (Vite) |
| Styling | Tailwind CSS v4 |
| State Management | Redux Toolkit (RTK) |
| Routing | React Router v7 |
| Form Validation | Zod |
| Icons | Lucide React |
| Flow Builder | @xyflow/react (React Flow) |
| Charts | Recharts |
| Build Tool | Vite v8 |

---

## Top-Level Directory Map

```
react-ts-app/
├── .agents/workflows/          ← Workflow knowledge files
├── .claude/skills/             ← Agent skills: testing, soc2-dev, playwright-cli (browser
│                                  automation via `npm run pw -- <cmd>`), and the design set
│                                  (start at revenact-design/SKILL.md; it routes to
│                                  impeccable, ui-ux-pro-max, emil-design-eng, ...)
├── src/
│   ├── App.tsx                 ← Route definitions (root)
│   ├── main.tsx                ← React entry point, Redux Provider
│   ├── store.ts                ← Redux store (auth + tasks reducers)
│   ├── hooks.ts                ← Typed useAppSelector / useAppDispatch
│   ├── index.css               ← Global base styles
│   ├── App.css                 ← App-level utility styles
│   ├── assets/                 ← Static assets
│   ├── lib/                    ← apiClient.ts — fetch wrapper to revenact-backend
│   ├── features/               ← Redux slices & business logic
│   │   ├── auth/               ← Auth state, thunks, Zod schema
│   │   ├── attention/          ← attentionApi.ts — plain fetch wrappers (no slice) for the
│   │   │                          Overview's attention list: fetch, snooze, unsnooze
│   │   ├── tasks/              ← Tasks slice (create task from CallSense AI actions)
│   │   └── counter/            ← Legacy counter slice (unused)
│   ├── layouts/                ← Shell layouts
│   │   └── DashboardLayout.tsx
│   ├── components/             ← Reusable UI components
│   │   ├── auth/               ← ProtectedRoute guard
│   │   ├── layout/             ← Sidebar, Navbar
│   │   ├── shared/             ← Multi-domain components (ActivityFeed, PinnedAttributes, Summary)
│   │   ├── contacts/           ← ContactsTable, ActionBar, MetricsPanel
│   │   ├── dashboard/charts/   ← Shared Recharts chart components (AI Trending)
│   │   └── organizations/      ← Rich org domain components (see below)
│   └── pages/                  ← Route-level page components
│       ├── auth/               ← Login page
│       ├── organizations/      ← List, Board, Details (org detail view)
│       ├── accounts/           ← Account Details page
│       ├── contacts/           ← Contacts list
│       ├── copilot/            ← AI Copilot module (Home, Chat, Cockpit)
│       ├── scenarios/          ← Visual scenario builder (React Flow)
│       ├── settings/           ← Settings module (data, currency, etc.)
│       ├── integrations/       ← Integrations catalogue page
│       ├── pipelines/          ← Pipelines board + list view
│       └── dashboard/          ← Analytics dashboards (Health, Ticket, AI Trending)
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig*.json
```

---

## Route Map (`src/App.tsx`)

```
/                              → Redirects to /dashboard (if authed) or /login
/login                         → [PUBLIC] Login page (no layout)

/  (DashboardLayout + ProtectedRoute)
├── dashboard/                 → DashboardFrame (scroll + p-4); tree in pages/dashboard/routes.tsx
│   ├── (index)                → Redirects to /dashboard/overview
│   ├── overview               → Overview (attention list + Revenue/Health/Support headline cards)
│   ├── revenue/               → AreaLayout area="revenue" (index → forecast)
│   │   ├── forecast           → ForecastContainer → forecast/ControlsView
│   │   ├── customers          → CustomerOverviewContainer → customer-overview/ControlsView
│   │   └── products           → ProductUsageContainer → product-usage/ControlsView
│   ├── health/                → AreaLayout area="health" (index → triage)
│   │   ├── triage | divergence | movement | renewals | distribution
│   │   │                      → HealthOverviewContainer → the matching health-overview view
│   │   ├── usage              → UsageOverviewContainer → usage-overview/ControlsView
│   │   └── activity           → ActivityContainer → activity/ControlsView
│   ├── support/               → AreaLayout area="support" (index → tickets)
│   │   ├── tickets            → TicketOverviewContainer → ticket-overview/ControlsView
│   │   └── topics             → AITrendingTopics → ai-trending/ControlsView
│   ├── advance, advance/*     → Legacy redirects (redirects.tsx, LEGACY map in areas.ts), query kept
│   └── custom                 → Redirects to /dashboard/overview
├── health                     → Redirects to /dashboard/health/distribution
├── organizations/
│   ├── (index)                → Redirects to /organizations/list
│   ├── list                   → OrganizationsTable (main list view)
│   ├── board                  → Board view (stub)
│   └── :id                    → Organization Details page (full detail)
├── accounts/:id               → Account Details page
├── copilot                    → Copilot AI module (Home / Chat / Cockpit)
├── scenarios/create           → Visual scenario flow builder
├── settings/
│   ├── (index)                → Redirects to /settings/data
│   ├── data                   → SettingsPage (attributes table)
│   ├── currency               → Placeholder
│   ├── entity-uploads         → Placeholder
│   ├── webhooks               → Placeholder
│   ├── activities             → Placeholder
│   ├── global-presets         → Placeholder
│   ├── connect-widget         → Placeholder
│   └── ai-agent               → Placeholder
├── integrations               → Integrations catalogue
├── profile                    → My Profile (any role)
├── users                      → User Management [ADMIN ONLY — AdminRoute]
├── contacts/
│   ├── (index)                → Redirects to /contacts/list
│   └── list                   → ContactsList
└── pipelines/
    ├── (index)                → Redirects to /pipelines/board
    ├── list                   → Pipelines list view
    └── board                  → Pipelines kanban board (drag-and-drop)
```

---

## App Shell & Layout

```
main.tsx
  └── <Provider store={store}>
        └── <App />
              └── <BrowserRouter>
                    ├── /login → <Login />
                    └── / → <ProtectedRoute>
                              └── <DashboardLayout>
                                    ├── <Sidebar />      ← collapsible, hover-expand
                                    ├── <Navbar />       ← hidden on /scenarios route
                                    └── <Outlet />       ← page content rendered here
```

**Sidebar sections (left nav):**
- **Top**: Dashboard, Communications
- **ENTITIES**: Organizations, Accounts, Contacts, Pipelines
- **CUSTOM OBJECTS**: SFDC Opportunity, Product Feedbacks
- **TOOLS**: Segments, Project Management, Scenarios, Surveys, Campaigns, Canvas
- **SETUP**: Settings, Lifecycle, Health, Users (admin-only), Integrations

No footer — account actions (profile, sign out) live in the Navbar's
avatar menu instead (see below), not the sidebar.

> Note: The `DashboardLayout` hides the `<Navbar />` and removes padding on the `/scenarios` route to give the builder a full-canvas feel.

---

## State Management (`src/store.ts`)

```
Redux Store
├── auth (authSlice)
│   ├── isAuthenticated: boolean
│   ├── user: { id, email, name, avatar, role, organisation, is_active } | null
│   ├── accessToken: string | null
│   ├── refreshToken: string | null
│   ├── isLoading / error         ← login only
│
├── userManagement (userManagementSlice)
│   ├── csms: CSM[]              ← admin's own org, User Management page
│   ├── isLoading: boolean
│   └── error: string | null
│
├── tasks (tasksSlice)
│   └── tasks: Task[]          ← Created from CallSense AI action items
│
└── counter (counterSlice)     ← Legacy, unused
```

**Persistence keys in localStorage:**
- `revenact_access_token`
- `revenact_refresh_token`
- `revenact_user`

---

## Feature Modules

### 1. Auth, Profile & User Management (`features/auth/`, `features/userManagement/`)

Wired to the real backend — see `revenact-backend/.agents/workflows/auth-flow.md`
for the full server-side flow (org signup, login, logout, own-profile
editing, admin User Management).

| File | Role |
|---|---|
| `features/auth/authSlice.ts` | Redux slice — `login`/`logout`/`refreshSession`/`fetchMe`/`updateProfile`/`changePassword` thunks, localStorage hydration. Exports the shared `User`/`Organisation` types. |
| `features/auth/loginSchema.ts` | Zod schema: email (required) + password (min 8 chars, matches backend) |
| `features/userManagement/userManagementSlice.ts` | Redux slice — `fetchCSMs`/`addCSM`/`updateCSM`, admin-only. `CSM` is just the `User` type. |
| `lib/apiClient.ts` | Fetch wrapper — auto-attaches the access token, auto-refreshes on a `401` (retries once, then forces logout if that also fails) |
| `components/auth/ProtectedRoute.tsx` | Redirects to `/login` if not authenticated |
| `components/auth/AdminRoute.tsx` | Redirects to `/dashboard` if `user.role !== 'admin'` — nested inside `ProtectedRoute`, so auth is already guaranteed |
| `pages/profile/Profile.tsx` | `/profile` — any role. View + edit own name, change password (needs current password) |
| `pages/users/UserManagement.tsx` | `/users` (`AdminRoute`-gated) — list/add/edit/deactivate the org's CSMs |
| `components/layout/Navbar.tsx` | Top-right avatar opens an account menu — "My Profile" (→ `/profile`) and "Sign out" (→ `logout` thunk). Closes on an outside click. |

No signup UI yet — that backend endpoint exists and is documented, but
organisations are still created via `curl`/the API directly. Sidebar's
"Users" nav item only renders for `role === 'admin'` (`Sidebar.tsx`).
Account actions used to live in a sidebar footer; that's gone now — the
Navbar's avatar menu is the only place to reach Profile/Sign out.

Real test users (see `revenact-backend`'s README): `alice@acme.io` /
`supersecret1` (admin, Acme Inc), `carl@acme.io` / `csmpassword1` (CSM,
same org).

---

### 2. Dashboard (`pages/dashboard/`)

Three areas — Revenue, Health, Support — under one route tree (`areas.ts`
lists them, `routes.tsx` renders them; see the Route Map above for the full
tree and Component Dependency Graph below for how the pieces wire together).
Health alone carries seven sub-views (Triage, Divergence, Movement, Renewals,
Usage, Activity, Distribution) off three containers.

#### Overview (`pages/dashboard/overview/`, `features/attention/`)

The landing page at `/dashboard/overview`, not an area itself: a ranked
attention list beside a headline card per area.

| File | What it holds |
|---|---|
| `features/attention/attentionApi.ts` | Plain `apiFetch` wrappers, no slice: `fetchAttention(query)` (`GET /dashboard/attention/`), `snooze(key, {days} \| {done: true})`, `unsnooze(key)` (`DELETE`, key URL-encoded) |
| `overview/AttentionList.tsx` | The "Needs attention" panel — renewal, risk, going-quiet, support and anomaly rows in the server's order. Snooze/Done are optimistic, held in local state keyed by item so the Undo line keeps its place until the filter changes or the page is left (`Overview.tsx` keys the whole list by the query string, and only refetches on a filter change). Stale rows (refetch in flight, failed load) are read-only; focus moves to Undo and back |
| `overview/HeadlineCards.tsx` | Revenue, Health and Support cards, each reading the same slice/endpoint its area page does (`forecastSlice`, `healthSlice`, `ticketsSlice`) so the Overview can never disagree with the area it links to |
| `overview/fixtures.ts` | `mockOverviewFetch` — a URL-routed fetch stub across the four endpoints the page touches, used by all three overview test suites |

`Overview.tsx` itself owns the attention fetch (`useDashboardFilters` →
`fetchAttention`), keeps the last good list on screen dimmed during a
refetch, and renders `DashboardToolbar` with no sub-views alongside the
`AttentionList` / `HeadlineCards` grid.

#### Drill-down (`pages/dashboard/drill/`)

One drill panel for the whole dashboard, not one per view — opening a second
number replaces what the first was showing.

| File | What it holds |
|---|---|
| `types.ts` | `DrillRow`, `DrillSource` (`{kind: 'rows', rows}` for a list already computed client-side, or `{kind: 'server', path, query, segment}` for one fetched on open), `DrillRequest` (`title`, `figure`, `source`) |
| `context.ts`, `DrillContext.tsx`, `useDrill.ts` | `DrillProvider` — mounted once by `DashboardFrame`, outside `AreaLayout` — holds the one open `DrillRequest` plus the trigger element to return focus to on close; `useDrill()` exposes `open(request, trigger)` / `close()` |
| `DrillPanel.tsx` | The panel itself: `role="dialog"`, `aria-labelledby` the title. A 360px panel over the Ask rail (`lg:absolute`, right edge of the frame) from `lg` (1024px), so it never narrows the figures; a full-screen `aria-modal="true"` sheet with its own Tab/Shift+Tab focus trap below it. Escape and the close button both call `close()`; focus is moved to the close button on open and returns to the trigger on close. Renders a `RowList` for a `rows` source, or fetches and renders a `server` one — showing "Showing n of count" when the backend's own response is truncated |
| `drillApi.ts` | `fetchDrill` — `GET <path>?<query>&drill=<segment>` — and `formatDetail`, which words one line per row for the segment's `value_label` (tickets, interactions, ARR, downside, expected expansion, days since contact) |
| `DrillTargets.tsx` | A `sr-only` (visible on focus) list of real `<button>`s standing in for a Recharts segment's own click handler, since the SVG it draws isn't keyboard-reachable |
| `rows.ts` | `fromHealthRows` / `fromUsageRows` — the one place a `HealthDataRow`/`UsageAccount` becomes a `DrillRow`, so every Health and Usage view maps the same fields the same way |
| `testDrill.ts` | Shared test doubles (`mockFetchRouted`, `drillResponse`) for a view's own server-drill tests |

`Kpi` (`shared/Kpi.tsx`) takes an optional `onDrill`; given one, it renders as
a `<button aria-label="<label> <figure>, show accounts">` instead of a plain
`<div>`. A drill only ever opens where the list behind the figure is
complete: every Health view turns every drill off on a `truncated` book,
Usage's three seat tiles and its band chart stay off until
`stats.scatter.length >= kpis.measured_count`, and Product Usage
(`product-usage/ControlsView.tsx`) has no drill at all — every figure there
is an aggregate across a product's own customers, never a set of accounts.
Organisations' own list (`pages/organizations/List.tsx`) reads a drill's
"Open as a list" as `?ids=3,7`, banners "Showing n accounts from the
dashboard" with a "Show all" that clears the param, and probes the
unfiltered `/customers/` count separately so `MetricsPanel` keeps showing
the whole book's population rather than the filtered page's.

#### Ask Revenact (`pages/dashboard/ask/`, `components/copilot/`)

| File | What it does |
|---|---|
| `components/copilot/CopilotRail.tsx` | The shared rail (`CopilotRail`) and `HistoryPopover`. `context: RailContext` (`railContext.ts`) is `{kind:'label'}` (Communications: `[About: …]` text prefix) or `{kind:'dashboard'}` (structured `context` field). Props for `variant`, `top`, `thread`, `names`, `suggestions`, `draft`, `onSent`. Assistant replies always render as plain text, never the Markdown `AnswerText` formatting `/copilot` uses — including a reply withheld from a reader with narrower visibility in a shared session |
| `components/copilot/useCopilotThread.ts` | Sending on one conversation: pending, failed (`budget` on 429, any other status including 400 shown the same way with Retry), `retry` (resends the question's own context and focus, not the current screen) |
| `components/copilot/dashboardLabels.ts`, `suggestions.ts` | Chip text (`viewLabel` for the history tag, `contextLabel` for a message's own chip), three questions per area |
| `ask/useDashboardContext.ts` | Route + `SHARED_KEYS` → `DashboardContext` and its chip, read at send time |
| `ask/filterNames.ts`, `FilterNamesProvider.tsx` | `DashboardToolbar` reports the shared filters' option names for chips |
| `ask/context.ts`, `useAsk.ts`, `AskProvider.tsx` | The dashboard's one conversation and thread, open state (`askPreference.ts`, written only by the rail's own toggle — an entry point opens the rail for that visit without touching it), focus, prefilled draft (`draft()`; a later `ask()` replaces it and its focus), history restore (`originPath.ts`); `useAsk()` is null outside the frame, so entry points hide in isolated view tests |
| `ask/AskRail.tsx` | Rail header, collapsed tab, phone sheet (focus trap, Escape/Close return focus to the Ask button) |
| `ask/testAsk.tsx`, `components/copilot/testCopilot.ts` | `renderDashboard(url, view, width)`, `stubCopilot`, `postedBodies` |

#### Ticket Overview (`tabs/ticket-overview/`)
Charts: `StatusDonut`, `PriorityDonut`, `AssigneesStackedBar`, `OriginBar`, `SentimentLineChart`, `KPIGrid`. The four countable KPIs (Total, On Hold, Positive/Negative sentiment) and every donut/bar's segments drill into `/tickets/stats/`; average lifetime and resolution rate stay plain — a rate isn't a set of tickets.

#### AI Trending Topics (`tabs/ai-trending/`)

**Charts rendered (3 rows):**
| Row | Components |
|---|---|
| Row 1 | `ActivityTypeDonut` (1/3) + `ActivityDetailedTable` (2/3) |
| Row 2 | `ActivitySentimentDonut` (1/3) + `SentimentOverTimeLine` (2/3) |
| Row 3 | `ActivitiesByAIAreaDonut` + `ActivitiesByAICategoryBar` + `ActivitiesByAISubCategoryBar` |

> All 6 donut charts use standardized `innerRadius={45}` / `outerRadius={60}` to prevent label clipping. Every donut/bar here carries a `DrillTargets` row into `/interactions/stats/`.

---

### 3. Organizations (`pages/organizations/` + `components/organizations/`)

The richest domain in the app. Three views:

#### List View (`pages/organizations/List.tsx`)
Renders `<OrganizationsTable />` — a feature-rich data table.

**`components/organizations/OrganizationsTable.tsx`** (18 KB)
- Displays org rows with health scores, ARR, NPS, CSAT, renewal date, pulse dots, AI pulse score
- Paginated (5 rows/page), column visibility toggleable via `EditColumnsPopover`
- Hoverable popovers: `HealthPopover`, `CsatPopover`, reason tooltip
- Per-row action menu via `RowActionsPopover`
- Aggregate KPI cards via `MetricsPanel`
- Data source: `tableData.ts` (22 KB, mock data for 10+ orgs)

#### Board View (`pages/organizations/Board.tsx`)
Currently a stub placeholder.

#### Details View (`pages/organizations/Details.tsx`)
Full organization detail page. Contains:
- **Header**: Org name, avatar, health badge, action buttons
- **Metrics Banner**: KPI cards (ARR, health, renewal, NPS, CSAT, MRR)
- **Tabs**: Overview | Activity | Contacts | Accounts | NPS | CSAT | Custom Attributes
- **Pinned Attributes**: Localized attribute editing panel (via `shared/PinnedAttributes`)
- **Activity Feed**: Tabbed feed engine (via `shared/ActivityFeed`)

**Activity Feed sub-tabs:**

| Tab | Component | What it shows |
|---|---|---|
| Emails | `EmailsTab` + `EmailThreadPanel` | Threaded email list with collapsible messages + Reply composer |
| Tasks | `TasksTab` | Task cards with priority and status badges |
| Notes | `NotesTab` | Timeline-style note cards |
| Tickets | `TicketsTab` | Ticket timeline with brand avatars |
| Calendar | `CalendarEventsTab` | Upcoming calendar events |
| Activities | `ActivitiesTab` | General activity log |
| Call Sense | `CallSenseTab` | AI call transcript feed with slide-in panel |
| Headlines | `HeadlinesTab` | AI-generated summary cards and reports |
| Slack | `SlackTab` | Slack thread cards with AI items panel |

**CallSense panel AI items accordions:**
- **Summary** — AI-generated TLDR of the call
- **Actions** — checkbox items, can create Tasks via Redux dispatch
- **Follow Up Message** — full AI-drafted email with Copy/Send Email buttons
- **Signals** — opportunities and risks identified in the call
- **Topics** — categorized discussion topics with badges and summaries

Data sources:
- `activityData.ts` (12 KB) — activity + email + notes mock data
- `contactsData.ts` (2 KB) — contacts per org
- `accountsData.ts` (10 KB) — linked accounts data
- `accountActivityData.ts` (6 KB) — activity data scoped to accounts

---

### 4. Accounts (`pages/accounts/Details.tsx`)

Account-level detail page linked from Org Details.
- Same layout as Organizations Details but scoped to a single account
- Uses `AccountMetricsPanel` for stakeholder diagnostics (Health, NPS, CSAT, Renewal)
- Recycles `PinnedAttributes` and `ActivityFeed` from `shared/`
- Injects `ACCOUNT_ID_MAP` and `accountActivityData` at runtime for account-scoped feed data

---

### 5. Contacts (`pages/contacts/List.tsx`)

Simple contacts list view.

**`components/contacts/`:**
- `ContactsTable.tsx` — contacts data grid
- `ActionBar.tsx` — search and filters
- `MetricsPanel.tsx` — contact count metrics

---

### 6. Copilot (`pages/copilot/`)

The Copilot is the AI intelligence layer of the platform — a conversational interface that has access to all cross-account data (calls, emails, tickets, Slack, CRM) and can answer complex CS questions in natural language.

| File | Role |
|---|---|
| `Index.tsx` | Entry/shell — manages view routing between Home / Chat / Cockpit |
| `HomeView.tsx` (13 KB) | Copilot landing page + Built-in Skills library |
| `ChatView.tsx` (5 KB) | Conversational AI response view |
| `CockpitView.tsx` (14 KB) | Deep analytics cockpit with charts |
| `CopilotSidebar.tsx` (6 KB) | Left sidebar — New Chat, Built-in Skills list, Chat History |

`components/copilot/CopilotRail` is the rail version used by Communications
and the Dashboard; history items show a dashboard `origin` tag.

#### Layout Structure

```
CopilotIndex
├── CopilotSidebar (left, collapsible)      ← Built-in Skills + Chat History
└── Main content area
      ├── Top tab bar: [Copilot] [Cockpit]
      ├── HomeView                          ← Prompt input + Skills grid (no active chat)
      └── ChatView                         ← AI response + floating prompt input
```

#### Built-in Skills

Pre-built AI workflows a CSM can run with one click. Scoped into four categories:

| Category | Skills |
|---|---|
| **Account** | Internal Business Review, Quick Start Brief, Overview of strategy to de-risk, Prep weekly customer sync, One liner update, Onboarding Status Report |
| **CSM** | CSM performance review |
| **Portfolio** | Onboarding Accounts Status |
| **Product** | Deep dive on product feedback, Features most requested by… |

Clicking a skill card expands it inline on the home view, showing the full pre-filled prompt template with `{Account}` / `{Organization}` variables highlighted in pink. The user can review then run it.

#### Key Copilot Capabilities

- **Cross-channel synthesis**: Copilot reads from calls (Call Sense), emails, tickets, and Slack threads across all accounts
- **Account-by-account deep dives**: "Why are these accounts at risk?" → returns per-account analysis with ARR, utilization %, NPS, verbatim customer quotes with channel attribution
- **Chat history persistence**: Prior conversations shown in sidebar (e.g. "Apple QBR Deck with Tables", "Focus Accounts for Risk and Growth", "Top 5 MRR Accounts Onboarding")
- **Variable input syntax**: Type `/` in the input box to add `{Account}` or `{Organization}` variables that scope the analysis
- **Response feedback**: Copy, thumbs up, thumbs down on every response

#### Current Implementation State

- **HomeView**: Fully implemented — greeting, prompt input, Built-in Skills grid (4 categories, 10 skills), skill card expand/collapse
- **ChatView**: Partially implemented — renders a static mock conversation output; input box is functional but doesn't connect to a real AI endpoint
- **CopilotSidebar**: Fully implemented — collapsible, shows Built-in Skills list + Chat History items (mock data matching production)
- **CockpitView**: Separate analytics view — implemented with charts/tables
- **Skill "Run" action**: Currently disabled (`disabled` button) — backend integration pending

---

### 7. Scenarios (`pages/scenarios/`)

Visual automation/workflow builder powered by **@xyflow/react** (React Flow).

| File | Role |
|---|---|
| `CreateScenario.tsx` | Main canvas page — manages node/edge state, drag-drop |
| `CustomNodes.tsx` | Custom node renderers (EntryNode, OperatorNode, ActionNode) |
| `CustomEdge.tsx` | Custom animated edge renderer with delete button |
| `BuilderSidebar.tsx` | Drag-and-drop node palette |
| `EditNodePane.tsx` | Right-side slide-in panel for configuring selected node |
| `ScenarioHeader.tsx` | Top bar with scenario name, save/publish actions |
| `types.ts` | TypeScript types: `ScenarioNodeData`, `ScenarioNodeDetail` |

**BuilderSidebar node palette:**
| Section | Nodes |
|---|---|
| Triggers | Run Now, Schedule, On Event |
| Operators | Wait, Conditional Wait, Condition, Filter, End |
| Actions | Assign Playbook, Create Task, Set Attribute, Send Email, Slack Message, Create Pipeline, MS Teams, Send Survey, Churn Entity |

**EditNodePane configured actions (as of latest build):**

| Node Label | Configuration Available |
|---|---|
| Send Email | Email service provider selector (multi-step tabs) |
| On Event | Tabbed (Trigger setup / Re-entry criteria) + 3 radio triggers + conditional attribute expansion |
| ↳ Change of attribute value | Attribute name selector, "Organization Enters" sub-radios |
| ↳ Based on specified value change | "If value changes from" + "to" multi-select dropdowns with Done button |
| Other nodes | Basic label/node details (placeholder) |

**On Event trigger logic:**
```
selectedEventTrigger state (default: '')
    ├── 'new_entity'    → Creation of new entity (no sub-form)
    ├── 'attribute'     → Change of attribute value
    │       └── selectedOrgEnters state (default: '')
    │               ├── 'value_change'      → On Value Change (no sub-form)
    │               ├── 'specified_change'  → shows "from/to" dropdowns
    │               │       └── isToDropdownOpen → animated dropdown with Done button
    │               └── 'percent_change'    → % change of value (no sub-form)
    └── 'status'        → Change of Entity Status (no sub-form)
```

---

### 8. Settings (`pages/settings/`)

Multi-tab settings module:

| File | Role |
|---|---|
| `SettingsPage.tsx` | Main page — tabs + active sub-route shell |
| `AttributesTable.tsx` (9.5 KB) | Data attributes management table (add/edit/delete) |
| `GlobalConfigSidebar.tsx` (3.8 KB) | Global configuration right panel |
| `SettingPlaceholder.tsx` | Generic stub for unimplemented settings tabs |

---

### 9. Integrations (`pages/integrations/Integrations.tsx`)

Integration catalogue with cards for connecting external tools (HubSpot, Salesforce, Slack, etc.)

---

### 10. Pipelines (`pages/pipelines/PipelinesPage.tsx`)

Dual-view (list + kanban board) pipeline management module:
- Drag-and-drop cards between pipeline stages
- KPI metrics at top
- Toggle between list and board views

---

## Component Dependency Graph (simplified)

```
App.tsx
  ├── ProtectedRoute (reads auth.isAuthenticated)
  ├── DashboardLayout
  │     ├── Sidebar (dispatches logout, reads auth.user)
  │     └── Navbar
  │
  ├── pages/dashboard/routes.tsx (dashboardRoutes) — areas.ts lists areas + sub-views
  │     ├── DashboardFrame → FilterNamesProvider + AskProvider + DrillProvider, then [scroll area → AreaLayout …][AskRail][DrillPanel over the rail]
  │     ├── <Area>Container → shared/DashboardToolbar (sub-view switch + URL filters, useDashboardFilters)
  │     │     └── the view (tabs/<section>/ControlsView or a health-overview view) → charts/*, each reading useDrill() to open DrillPanel
  │     ├── shared/ — DashboardToolbar, useDashboardFilters (SHARED_KEYS), Kpi (button when given onDrill), Panel, DataState, chartPalette (ROLE)
  │     ├── drill/ — DrillContext/useDrill, DrillPanel (panel/sheet), DrillTargets, drillApi, rows.ts
  │     ├── ask/ — AskProvider/useAsk, AskRail, useDashboardContext, filterNames
  │     └── redirects.tsx — Keep / LegacyRedirect for old /dashboard/advance/* links
  │
  ├── pages/organizations/Details.tsx & pages/accounts/Details.tsx
  │     ├── components/organizations/MetricsPanel (or AccountMetricsPanel)
  │     ├── components/shared/PinnedAttributes
  │     ├── components/shared/ActivityFeed
  │     │     └── components/organizations/activity/*Tab (x9)
  │     │           └── CallSenseTab → features/tasks/tasksSlice (dispatch addTask)
  │     └── (activityData, accountsData, accountActivityData)
  │
  ├── pages/organizations/List.tsx
  │     └── components/organizations/OrganizationsTable
  │           ├── ActionBar, EditColumnsPopover, HealthPopover, CsatPopover, RowActionsPopover
  │           └── MetricsPanel
  │
  ├── pages/copilot/Index.tsx
  │     ├── HomeView, ChatView, CockpitView
  │     └── CopilotSidebar
  │
  └── pages/scenarios/CreateScenario.tsx
        ├── BuilderSidebar
        ├── ScenarioHeader
        ├── CustomNodes (EntryNode, OperatorNode, ActionNode)
        ├── CustomEdge
        └── EditNodePane (reads/dispatches local state for On Event form)
```

---

## Adding a New Page — Checklist

1. Create `src/pages/<domain>/MyPage.tsx`
2. Add route in `src/App.tsx` inside the `DashboardLayout` block
3. Add a `NavItem` in `src/components/layout/Sidebar.tsx` with the correct `to` path
4. If it needs mock data, create `src/components/<domain>/myData.ts`
5. If it needs Redux state, create `src/features/<domain>/<domain>Slice.ts` and register in `src/store.ts`
6. Add unit + integration + end-to-end tests — see the `testing` skill.

---

## Adding a New Activity Tab — Checklist

1. Create `src/components/organizations/activity/MyTab.tsx` — follows `{ entityId }` prop pattern
2. Export it from `src/components/organizations/activity/index.ts`
3. Register it in `src/components/shared/ActivityFeed.tsx` in the `TABS` array and the `renderContent()` switch
4. Add unit + integration tests — see the `testing` skill.

---

## Adding a New Chart to a Dashboard — Checklist

1. Create the chart in `src/pages/dashboard/tabs/<section>/charts/`
2. Use **Recharts** with standardized donut params: `innerRadius={45}` `outerRadius={60}` to prevent label clipping
3. Import and place it in the appropriate `ControlsView.tsx`
4. If a segment can name the accounts behind it and the list it reads is
   complete (see `pages/dashboard/drill/` above), give it a `DrillTargets`
   row so a keyboard user gets the same drill a pointer click does
5. Add a unit test for the chart component — see the `testing` skill.

---

## Known Stubs / Not Yet Implemented

| Route | Status |
|---|---|
| `/organizations/board` | Stub (`Board.tsx` is 296 bytes) |
| `/communications` | No route defined |
| `/accounts` (list) | No list route, only `/accounts/:id` |
| `/sfdc`, `/feedbacks` | No route defined |
| `/segments`, `/projects`, `/surveys`, `/campaigns`, `/canvas` | No route defined |
| `/lifecycle` | No route defined (`/health` redirects to `/dashboard/health/distribution`) |
| `/settings/currency` … `/settings/ai-agent` | Stub `SettingPlaceholder` |
| `/dashboard/custom`, `/dashboard/advance/*` | Redirect to the new areas (`redirects.tsx`) |

---

## Data Flow Summary

```
User Action
    │
    ▼
React Component (page/component)
    │
    ├── Local state (useState) for UI-only state
    │       Examples: activeFilter (health donut), selectedCall (CallSense),
    │                 selectedEventTrigger (EditNodePane), openAccordions, etc.
    │
    ├── Redux dispatch()
    │       ├── authSlice → login/logout/refreshSession → lib/apiClient.ts → revenact-backend
    │       │       (real HTTP now — see below)
    │       └── tasksSlice → addTask (triggered from CallSense AI actions)
    │
    └── Mock data files (*.ts) for table/list/chart data
            └── Imported directly — no API calls
```

> **Note:** Auth (`features/auth/`) is the one feature wired to the real
> `revenact-backend` — everything else still has no real backend. All
> other data is statically imported from mock data files (`tableData.ts`,
> `activityData.ts`, etc.). As each feature gets ported, it moves from
> this mock-data path to the same `apiClient.ts` pattern auth uses.
