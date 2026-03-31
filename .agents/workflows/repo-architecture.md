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
| Build Tool | Vite v8 |

---

## Top-Level Directory Map

```
react-ts-app/
├── .agents/workflows/        ← Workflow knowledge files
├── src/
│   ├── App.tsx               ← Route definitions (root)
│   ├── main.tsx              ← React entry point, Redux Provider
│   ├── store.ts              ← Redux store (auth + counter reducers)
│   ├── hooks.ts              ← Typed useAppSelector / useAppDispatch
│   ├── index.css             ← Global base styles
│   ├── App.css               ← App-level utility styles
│   ├── assets/               ← Static assets
│   ├── features/             ← Redux slices & business logic
│   │   ├── auth/             ← Auth state, thunks, Zod schema
│   │   └── counter/          ← Legacy counter slice
│   ├── layouts/              ← Shell layouts
│   │   └── DashboardLayout.tsx
│   ├── components/           ← Reusable UI components
│   │   ├── auth/             ← ProtectedRoute guard
│   │   ├── layout/           ← Sidebar, Navbar
│   │   ├── shared/           ← Multi-domain components (ActivityFeed, PinnedAttributes, Summary)
│   │   ├── contacts/         ← ContactsTable, ActionBar, MetricsPanel
│   │   └── organizations/    ← Rich org domain components (see below)
│   └── pages/                ← Route-level page components
│       ├── auth/             ← Login page
│       ├── organizations/    ← List, Board, Details (org detail view)
│       ├── accounts/         ← Account Details page
│       ├── contacts/         ← Contacts list
│       ├── copilot/          ← AI Copilot module (multi-view)
│       ├── scenarios/        ← Visual scenario builder
│       ├── settings/         ← Settings module (data, currency, etc.)
│       └── integrations/     ← Integrations catalogue page
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig*.json
```

---

## Route Map (`src/App.tsx`)

```
/                          → Redirects to /organizations/list (if authed) or /login
/login                     → [PUBLIC] Login page (no layout)

/  (DashboardLayout + ProtectedRoute)
├── dashboard              → Placeholder dashboard view
├── organizations/
│   ├── (index)            → Redirects to /organizations/list
│   ├── list               → OrganizationsTable (main list view)
│   ├── board              → Board view (stub)
│   └── :id               → Organization Details page (full detail)
├── accounts/:id           → Account Details page
├── copilot                → Copilot AI module
├── scenarios/create       → Visual scenario flow builder
├── settings/
│   ├── (index)            → Redirects to /settings/data
│   ├── data               → SettingsPage (attributes table)
│   ├── currency           → Placeholder
│   ├── entity-uploads     → Placeholder
│   ├── webhooks           → Placeholder
│   ├── activities         → Placeholder
│   ├── global-presets     → Placeholder
│   ├── connect-widget     → Placeholder
│   └── ai-agent           → Placeholder
├── integrations           → Integrations catalogue
└── contacts/
    ├── (index)            → Redirects to /contacts/list
    └── list               → ContactsList
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
                                    ├── <Navbar />       ← hidden on /scenarios
                                    └── <Outlet />       ← page content rendered here
```

**Sidebar sections:**
- **Top**: Dashboard, Communications
- **ENTITIES**: Organizations, Accounts, Contacts, Pipelines
- **CUSTOM OBJECTS**: SFDC Opportunity, Product Feedbacks
- **TOOLS**: Segments, Project Management, Scenarios, Surveys, Campaigns, Canvas
- **SETUP**: Settings, Lifecycle, Health, Users, Integrations
- **Footer**: User avatar + name + Sign out button

---

## State Management (`src/store.ts`)

```
Redux Store
├── auth (authSlice)
│   ├── isAuthenticated: boolean
│   ├── user: { email, name, avatar } | null
│   ├── accessToken: string | null
│   ├── refreshToken: string | null
│   └── status: 'idle' | 'loading' | 'failed'
│
└── counter (counterSlice)  ← Legacy, likely unused
```

**Persistence keys in localStorage:**
- `revenact_access_token`
- `revenact_refresh_token`
- `revenact_user`

---

## Feature Modules

### 1. Auth (`features/auth/`)

| File | Role |
|---|---|
| `authSlice.ts` | Redux slice — `login` async thunk, `logout` action, localStorage hydration |
| `loginSchema.ts` | Zod schema: email (required) + password (min 8 chars) |

Dummy credentials: `admin@revenact.io / password123`, `demo@revenact.io / demo1234`

---

### 2. Organizations (`pages/organizations/` + `components/organizations/`)

The richest domain in the app. Three views:

#### List View (`pages/organizations/List.tsx`)
Renders `<OrganizationsTable />` — a feature-rich data table.

**`components/organizations/OrganizationsTable.tsx`** (18 KB)
- Displays org rows with health scores, ARR, renewal date, NPS, etc.
- Sub-components used:
  - `ActionBar.tsx` — search, filters, column toggle
  - `EditColumnsPopover.tsx` — drag-to-reorder column visibility
  - `HealthPopover.tsx` — health score breakdown popover
  - `CsatPopover.tsx` — CSAT score popover
  - `RowActionsPopover.tsx` — per-row action menu
  - `MetricsPanel.tsx` — aggregate metric cards at top
- Data source: `tableData.ts` (22 KB, mock data)

#### Board View (`pages/organizations/Board.tsx`)
Currently a stub placeholder.

#### Details View (`pages/organizations/Details.tsx`) (40 KB)
Full organization detail page. Contains:
- **Header**: Org name, avatar, health badge, action buttons
- **Tabs**: Overview | Activity | Contacts | Accounts | NPS | CSAT | Custom Attributes
- **Shared Dashboard Panels** (imported from `components/shared/`):
  - `PinnedAttributes.tsx` — localized attribute editing panel
  - `Summary.tsx` — empty state info widget
  - `ActivityFeed.tsx` — dynamic tabbed feed engine
- **MetricsPanel**: KPI cards (ARR, health, renewal, NPS, CSAT)
- **Activity sub-tabs** (rendered via ActivityFeed using dedicated components from `activity/`):
  - `EmailsTab` + `EmailThreadPanel` — side-by-side thread view
  - `TasksTab` — task cards with priority/status
  - `NotesTab` — custom timeline squircle view
  - `TicketsTab` — timeline view with dynamic avatars/brands
  - `CalendarEventsTab` — upcoming events
  - `ActivitiesTab` — general activity log
  - `CallSenseTab` — dynamic call transcripts feed
  - `HeadlinesTab` — AI-generated summary cards & reports

Data sources:
- `activityData.ts` (12 KB) — activity feed mock data for orgs
- `contactsData.ts` (2 KB) — contacts for the org
- `accountsData.ts` (10 KB) — linked accounts data

---

### 3. Accounts (`pages/accounts/Details.tsx`) (16 KB)

Account-level detail page navigated to from org details.
- Fully implemented pixel-perfect dashboard parity with Organizations.
- Uses localized `AccountMetricsPanel` for stakeholder diagnostics.
- Recycles `PinnedAttributes` and `ActivityFeed` from `shared/` layer.
- Dynamically injects `ACCOUNT_ID_MAP` and `accountActivityData.ts` into the global data arrays at render-time to simulate account-specific endpoints without duplicating the Activity sub-components.

---

### 4. Contacts (`pages/contacts/List.tsx`)

Simple contacts list view.

**`components/contacts/`:**
- `ContactsTable.tsx` — contacts data grid
- `ActionBar.tsx` — search and filters
- `MetricsPanel.tsx` — contact metrics

---

### 5. Copilot (`pages/copilot/`)

Multi-view AI assistant module with:
- `Index.tsx` — entry/shell with view routing
- `HomeView.tsx` (13 KB) — Copilot home/dashboard
- `ChatView.tsx` (5 KB) — conversation chat interface
- `CockpitView.tsx` (14 KB) — analytics cockpit
- `CopilotSidebar.tsx` (6 KB) — side navigation for copilot sections

---

### 6. Scenarios (`pages/scenarios/`)

Visual automation/workflow builder powered by **@xyflow/react** (React Flow).

| File | Role |
|---|---|
| `CreateScenario.tsx` (6 KB) | Main canvas page, manages node/edge state |
| `CustomNodes.tsx` (6 KB) | Custom node renderers for triggers, actions, etc. |
| `CustomEdge.tsx` (2 KB) | Custom animated edge renderer |
| `BuilderSidebar.tsx` (4 KB) | Drag-and-drop node palette |
| `EditNodePane.tsx` (7 KB) | Right-side panel to configure selected node |
| `ScenarioHeader.tsx` (3 KB) | Top bar with save/publish actions |
| `types.ts` | TypeScript types for nodes/edges |

Note: The `DashboardLayout` hides the `<Navbar />` and removes padding on the `/scenarios` route to give the builder a full-canvas feel.

---

### 7. Settings (`pages/settings/`)

Multi-tab settings module:

| File | Role |
|---|---|
| `SettingsPage.tsx` (3.4 KB) | Main page — tabs + active sub-route shell |
| `AttributesTable.tsx` (9.5 KB) | Data attributes management table |
| `GlobalConfigSidebar.tsx` (3.8 KB) | Global configuration right panel |
| `SettingPlaceholder.tsx` | Generic stub for unimplemented settings tabs |

---

### 8. Integrations (`pages/integrations/Integrations.tsx`) (13 KB)

Integration catalogue with cards for connecting external tools.

---

## Component Dependency Graph (simplified)

```
App.tsx
  ├── ProtectedRoute (reads auth.isAuthenticated)
  ├── DashboardLayout
  │     ├── Sidebar (dispatches logout, reads auth.user)
  │     └── Navbar
  │
  ├── pages/organizations/Details.tsx & pages/accounts/Details.tsx
  │     ├── components/organizations/MetricsPanel (or AccountMetricsPanel)
  │     ├── components/shared/PinnedAttributes
  │     ├── components/shared/ActivityFeed
  │     │     └── components/organizations/activity/*Tab (Emails, Notes, CallSense, etc. x8)
  │     └── (accountsData, accountActivityData, activityData)
  │
  ├── pages/organizations/List.tsx
  │     └── components/organizations/OrganizationsTable
  │           ├── ActionBar
  │           ├── EditColumnsPopover
  │           ├── HealthPopover
  │           ├── CsatPopover
  │           ├── RowActionsPopover
  │           └── MetricsPanel
  │
  ├── pages/copilot/Index.tsx
  │     ├── HomeView
  │     ├── ChatView
  │     ├── CockpitView
  │     └── CopilotSidebar
  │
  └── pages/scenarios/CreateScenario.tsx
        ├── BuilderSidebar
        ├── ScenarioHeader
        ├── CustomNodes
        ├── CustomEdge
        └── EditNodePane
```

---

## Adding a New Page — Checklist

1. Create `src/pages/<domain>/MyPage.tsx`
2. Add route in `src/App.tsx` inside the `DashboardLayout` block
3. Add a `NavItem` in `src/components/layout/Sidebar.tsx` with the correct `to` path
4. If it needs mock data, create `src/components/<domain>/myData.ts`
5. If it needs Redux state, create `src/features/<domain>/<domain>Slice.ts` and register in `src/store.ts`

---

## Known Stubs / Not Yet Implemented

| Route | Status |
|---|---|
| `/dashboard` | Placeholder div |
| `/organizations/board` | Placeholder (`Board.tsx` is 296 bytes) |
| `/communications` | No route defined |
| `/accounts` (list) | No list route, only `/accounts/:id` |
| `/pipelines` | No route defined |
| `/sfdc`, `/feedbacks` | No route defined |
| `/segments`, `/projects`, `/surveys`, `/campaigns`, `/canvas` | No route defined |
| `/lifecycle`, `/health`, `/users` | No route defined |
| `/settings/currency` ... `/settings/ai-agent` | Stub `SettingPlaceholder` |

---

## Data Flow Summary

```
User Action
    │
    ▼
React Component (page/component)
    │
    ├── Local state (useState) for UI-only state
    │
    ├── Redux dispatch() → authSlice thunk
    │       └── Mock async delay (800ms)
    │               └── Match against DUMMY_USERS
    │                       └── Set state + persist to localStorage
    │
    └── Mock data files (*.ts) for table/list data
            └── Imported directly — no API calls
```

> **Note:** This app currently has no real backend. All data is statically imported from mock data files (`tableData.ts`, `activityData.ts`, etc.). The only "async" operation is the simulated login delay in `authSlice.ts`.
