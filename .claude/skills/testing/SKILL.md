---
name: testing
description: Testing requirement for this frontend - every feature ships with unit, integration, and end-to-end tests. Use whenever a page, component, slice, or API wiring is added or changed.
---

# Testing

**No feature is done until it has unit, integration, and end-to-end tests.**
All three run on the existing stack (Vitest + Testing Library + jsdom) —
no new test dependency has been added.

## Current state (read before writing tests)

Per `.agents/workflows/repo-architecture.md`, this app has **no real
backend wiring yet** — all data comes from statically imported mock files
(`tableData.ts`, `activityData.ts`, ...); the only async call is the
simulated login delay in `authSlice.ts`. That changes the shape of tiers 2
and 3 below until a feature is actually wired to `revenact-backend`'s real
API (see that repo's `api-contracts` skill).

## The three tiers

### 1. Unit — one slice/component/function, fully isolated

Tests a single reducer, a pure function, or a component rendered on its own
with props/mocked hooks. This is the pattern already used by
`authSlice.test.ts`, `tasksSlice.test.ts`, `brainSlice.test.ts`,
`ProtectedRoute.test.tsx` — keep following it.

- Tools: `vitest` + `@testing-library/react` + `@testing-library/jest-dom`.
- Location: co-located, `<name>.test.ts(x)` next to the source file.

### 2. Integration — a page/feature wired to real state and routing

Renders a page or feature with the **real** Redux store (not a mocked
selector) and, once it exists, the real routing around it — proving the
component, slice, and route are actually wired together correctly, not
just individually correct.

- Once a feature calls the real backend: mock only the network boundary
  (`vi.stubGlobal('fetch', ...)` or a thunk-level mock) with a response
  shaped **exactly** like the endpoint's entry in `revenact-backend`'s
  `docs/API_CONTRACTS.md` — not an arbitrary shape — so contract drift
  fails the test.
- Until a feature has real backend wiring, integration means: real store +
  real child components + the existing mock data file, asserting the full
  render tree behaves correctly (filters propagate, dispatches update
  state, etc.) — e.g. the health donut → `activeFilter` → all charts
  interaction in `repo-architecture.md`.

### 3. End-to-end — a full user flow, driven through the app, no browser

Renders the top-level route tree (`<Provider><BrowserRouter><App /></BrowserRouter></Provider>`,
or the smallest subtree that includes routing) and drives it with
`@testing-library/user-event` the way a user would: click, type, submit,
assert on the resulting screen. This is **API-level/DOM-level e2e, no
browser** — jsdom, not Playwright/Cypress — proving the real flow works
without a UI driver dependency.

- Example flow: fill the login form → submit → assert redirect to
  `/dashboard` and sidebar renders the authenticated user.
- Once real backend calls exist in a flow, this tier hits them the same
  way integration tests do (mocked `fetch`, contract-shaped fixtures) but
  exercises the *whole* flow, not one component.
- Location: `src/e2e/<flow>.test.tsx` (new folder — create it the first
  time this tier is used).

## Workflow

Write tests alongside each layer as you build it, matching the checklists
in `.agents/workflows/repo-architecture.md`:

1. New slice/component → unit test.
2. Page wired to its slice/route → integration test.
3. Feature spans a full user-visible flow → one e2e test in `src/e2e/`.

Run everything with `npm test` (`vitest run`) before committing — see the
backend's `commit-messages` skill for the same commit convention used here
(`feat(scope): ...` includes its own tests).

## What NOT to do

- Don't skip a tier because the feature "is just UI" — a page still gets an
  integration test proving it's wired to its slice/route correctly.
- Don't mock the store in an integration/e2e test — mocking Redux there
  defeats the point; mock only the network boundary once one exists.
- Don't reach for Playwright/Cypress — this project's e2e tier is
  intentionally jsdom-based to match the backend's no-browser, no-new-deps
  approach. Revisit only if a real browser-only concern (CSS, real
  navigation) can't be proven any other way.
