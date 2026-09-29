---
description: UI/UX design reference for the Revenact frontend — tokens, type, components, interaction rules, accessibility bar and current design debt.
---

# Revenact — UI/UX Design

Current as of 2026-09-24. The authority for any visual change is
`.claude/skills/revenact-design/SKILL.md`, the repo's own design skill, which
also routes to the twenty vendored design skills and settles the conflicts
between them. This document is the readable version of that truth plus a survey
of what the code actually does today.

Companion documents: [App Flow](04-app-flow.md),
[PRD](../../revenact-backend/docs/product/01-prd.md),
[TRD](../../revenact-backend/docs/product/02-trd.md).

---

## 1. Design position

Revenact is B2B customer-success intelligence. Almost every surface is what the
`impeccable` skill calls **Operate mode**: dashboards, tables, detail panes and
editors that someone stares at for hours. **Scanability and consistency outrank
expression.**

Three consequences:

1. Density is a feature. Twelve to thirteen pixel body text and tight rows are
   correct here, not a compromise.
2. Colour carries meaning only. One accent, semantic colours for status, nothing
   decorative.
3. Motion is an explanation, not a flourish. Nothing bounces.

Marketing and auth pages are the one exception, allowed more expression. The
`design-taste-frontend` skill is explicitly **not** for dashboards or data
tables.

---

## 2. Colour system

Defined once, in `src/index.css`, as Tailwind v4 `@theme` tokens. There is no
theme block in `tailwind.config.js`. The token names appear in roughly 4,700
places.

### Tier 0, the source of truth

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-base` | `#F5F3EF` | `#0B0C0E` | The canvas: warm off-white, with two faint radial gradients (`.rv-canvas`) |
| `--color-surface` | `#FFFFFF` | `#111215` | Cards, tables, inputs |
| `--color-elevated` | `#FFFFFF` | `#16171B` | Modals, popovers |
| `--color-subtle` | `#F0EEEA` | `#18191E` | Hover fills, muted blocks |
| `--color-ink` | `#141413` | `#F3F4F6` | Primary text |
| `--color-ink-muted` | `#6E6D69` | `#9CA3AF` | Secondary text |
| `--color-ink-faint` | `#9E9D98` | `#6B7280` | Hints, eyebrow labels |
| `--color-accent` | `#141413` | `#FFFFFF` | **The primary action, monochrome.** Black pills on light, white on dark |
| `--color-accent-hover` | `#000000` | `#E6E6E6` | |
| `--color-accent-dim` | `#ECEAE5` | `rgba(255,255,255,.08)` | Active nav, selected chips |
| `--color-on-accent` | `#FFFFFF` | `#0B0C0E` | Text and icons sitting on `accent` |
| `--color-brand` | `#F43F5E` | same | **Revenact Rose.** The mark, and nothing else |
| `--color-success` / `-dim` | `#10B981` / `#ECFDF5` | same / 12% tint | Good health, positive sentiment, upward moves |
| `--color-warning` / `-dim` | `#F59E0B` / `#FFFBEB` | same / 12% tint | Average health, stale, watch |
| `--color-danger` / `-dim` | `#EF4444` / `#FEF2F2` | same / 12% tint | Poor health, negative sentiment, destructive actions |
| `--color-info` / `-dim` | `#3B82F6` / `#EFF6FF` | same / 12% tint | Neutral information |
| `--color-line-subtle` | `#EFECE6` | `#1E2026` | Hairlines inside a card |
| `--color-line` | `#E8E5DF` | `#272A33` | The default border |
| `--color-line-strong` | `#D8D4CC` | `#373B47` | Emphasised separation |

Utility vocabulary: `bg-base`, `bg-surface`, `bg-subtle`, `text-ink`,
`text-ink-muted`, `text-ink-faint`, `bg-accent`, `text-on-accent`,
`bg-accent-dim`, `bg-brand`, `text-success|warning|danger|info`, `border-line`.

Dark mode is the same tokens re-pointed under `html.dark` / `[data-theme="dark"]`;
`ThemeSynchronizer` in `App.tsx` sets both from the settings slice (light, dark,
or system). A bridge rule in `index.css` keeps legacy `bg-accent text-white`
pairs readable on the white dark-mode primary until they migrate to
`text-on-accent`. New code writes `text-on-accent`.

The `--rv-*` names used by the settings pages, navbar and assistant rail are
aliases of the tokens above, not a second palette. Only the few with no core
meaning (the canvas gradients, the sidebar's warmer fill, the calendar card's
teal) carry their own values.

### Tier 1 and 2

`:root` aliases (`--bg-*`, `--text-*`, `--accent*`, `--border-*`) exist for the
few places that need an inline `style`. Semantic aliases (`--color-surface-*`,
`--color-text-*`, `--color-border`) exist for component-level naming. Note that
in Tailwind v4 the `@theme` names are the real custom properties, so a bare
`var(--line)` silently draws nothing; use `var(--color-line)`.

### Rules

- **Never write a raw hex in a component.** Tokens only. The exception is a
  third party's logo (Google, Microsoft, the connector marks), whose brand
  terms forbid recolouring.
- One primary, and it is monochrome. Rose is the mark, never a button or a
  state.
- Semantic colours mean status, trend or severity. Never decoration.
- Both modes, always. A new colour goes into the light `@theme` block *and*
  the dark override, or it is not done.

---

## 3. Typography

`index.html` loads three families from Google Fonts:

| Family | Intended for | Weights |
|---|---|---|
| DM Serif Display | Display headings, the wordmark, italic allowed | 400 |
| DM Mono | Numbers, identifiers, badges, code | 400, 500 |
| Lato | Body and UI | 400, 700, 900 |

> **Known gap, highest-leverage fix in the whole design system.** `src/index.css`
> Since 2026-09-21 `.font-display` applies DM Serif Display at 400 and
> `.font-mono-brand` applies DM Mono with tabular figures. The body still
> uses the system stack; moving it to Lato is a separate decision.

### Scale in use

| Role | Size and weight |
|---|---|
| Page title | `text-[20px] font-bold tracking-tight` |
| Section header | `text-[14px]` or `text-[15px] font-bold` |
| Eyebrow label | `text-[10.5px]` to `text-[11px] font-bold uppercase tracking-wider text-ink-faint` |
| Body and table cell | 12 to 13.5px |
| Nav item | `text-[13px] font-semibold` |

At most four sizes on any one surface. Numbers and identifiers belong in DM Mono
with `tabular-nums` so columns align. Reading surfaces cap line length around 65
to 75 characters.

---

## 4. Iconography

**lucide-react exclusively.** This overrules every vendored skill that prefers
Phosphor or Hugeicons.

| Context | Size |
|---|---|
| Inline with a label | 16px |
| Standalone action | 20px |
| Section header | 24px |

An icon with no adjacent text needs an `aria-label`. No emoji as icons, ever.

---

## 5. Shape, elevation and space

| Property | Rule |
|---|---|
| Radius | `rounded-md` compact controls, `rounded-lg` the default, `rounded-xl` cards and popovers, `rounded-full` pills and avatars. Do not introduce `rounded-2xl` or larger without a documented reason |
| Elevation | `shadow-sm` is the norm. `shadow-md` and `shadow-lg` are for overlays only. Prefer a `border-line` over a shadow for grouping |
| Nesting | **No card inside a card.** Group with a border, a `divide-y` or whitespace |
| Page padding | `px-6 pt-5 pb-4` on list pages; `<main>` uses `p-2 md:p-3 lg:p-4` |
| Inputs | `px-3 py-1.5` or `py-2`, `bg-surface`, `border-line`, `rounded-lg`, `text-[13px]` |

### Shell dimensions

| Element | Value |
|---|---|
| Sidebar collapsed / hover-expanded | 68px / 240px, 300ms transition, overlays below the `md` breakpoint |
| Navbar | 64px, bottom hairline, `shadow-sm` |
| Copilot tab bar | 56px |
| Dashboard area tabs (Overview/Revenue/Health/Support) | Inside the 64px Navbar, not a bar of their own: full-height links with a 2px bottom border on the active one; they carry only `owner`/`lifecycle`/`customer` across areas |
| Dashboard toolbar (`DashboardToolbar`, shared by all three areas) | Sub-view links `min-h-8` (32px) in a `p-0.5` bordered group; filter chips a fixed `h-9` (36px); the filter row is `min-h-9` and grows when it wraps rather than overlapping the content below |
| Dashboard page | `DashboardFrame` owns the scroll (`overflow-y-auto`) and adds `p-4` inside `<main>`'s own padding |

---

## 6. Component inventory

### Data display

| Component | Where |
|---|---|
| Portfolio rows and board (`components/organizations/portfolio/`) | `/organizations/list`: `AccountRow` (a rounded item, not a table row; a two-line card below `sm`), `AccountDetails` (six panels, part of the row), `SummaryTiles`, `PortfolioToolbar`/`FiltersPanel`/`PinFieldsMenu`, `FilterChips`, `SelectionBar`, `PortfolioSections`, `AccountSheet`. `/organizations/board`: `PortfolioBoard`, `BoardColumn`, `BoardCard`, `AccountSidePanel`. They read a portfolio kind (`PortfolioKindContext`, Organizations by default), so `/accounts/list` and `/accounts/board` use them too, with `ACCOUNT_KIND` and `components/accounts/portfolio/AccountPanels`. See "Portfolio rows and board" below |
| Contacts list and profile (`components/contacts/`) | `/contacts`: `ContactsToolbar` (summary line, search, organisation, account, sentiment and role filters in the URL, + Add), `ContactList` of `ContactListItem`s (never a table row; Load more), `ContactProfile` (sentiment and why, then `HistoryItems`: calls newest first, emails, tickets). See "Contacts" below |
| `KanbanBoard` | Generic over stage and item; HTML5 drag events; used by Pipelines |
| Dashboard tables | `AccountHealthDetailTable`, `RenewalQueueTable`, `ActivityDetailedTable`, `GoingDarkTable`, `SwingTable` |
| `PinnedAttributes` | Label and value pairs typed as text, truncated, dot, owner or pulse |
| `EntityAvatar` | Company logo, else deterministic initials in one of five semantic hues |
| `PresenceStrip` | Session participants, maximum five |

### Dashboard primitives

Four small components, in `src/pages/dashboard/shared/`, that replaced what
used to be copied into every dashboard tab.

| Component | Rule |
|---|---|
| `DashboardToolbar` | The one row under the area tabs: a sub-view switch (`NavLink`s, hidden when there is only one view) on the left, `FilterSelect`s on the right, reading and writing the URL through `useDashboardFilters`. A period control (e.g. Forecast's horizon) is marked `clearable: false` and survives "Clear n"; the rest of the active filters do not. A chip shows as active only when its value differs from that filter's default, so a period on its default does not look filtered. An option may carry a short `display` label for the chip (Health's chips show the name; the count stays in the dropdown). The visible chip shows the focus ring of the invisible native `<select>` over it |
| `Kpi` / `KpiStrip` | `Kpi` is one label/value/detail figure; colour is reserved for `tone="loss"`/`"gain"`, never decorative. Given an `onDrill`, it renders as a `<button>` instead of a `<div>` — same type, size and layout, with `hover:bg-subtle` and a focus ring added, and an explicit `aria-label="<label> <value>, show accounts"` rather than relying on the visible digits; the detail line stays in the accessible description through `aria-describedby`, and the inner lines are block `<span>`s so the button holds only phrasing content. `KpiStrip` lays a row of them out four across from `md` (`columns={3}` for a three-figure summary, `columns={2}` inside a card; `stackFromLg` for a quarter-width card such as Tickets' KPIs, keeping every label to two lines), divided by hairlines rather than boxed — replaced six local `Tile`s that tinted a border by tone and coloured numbers that meant nothing |
| `Panel` | The one container on the dashboard: `bg-surface border border-line rounded-xl p-4`, an optional title/action header. Never nest one inside another — group inside with `divide-y` or whitespace instead |
| `DataState` (`Loading`, `ErrorState`, `Empty`, `TruncatedNotice`) | One wording for loading, error, empty and truncated, generalised from Health's own set so eight views stop describing the same outage eight different ways |

### Attention list

`src/pages/dashboard/overview/`, the Overview's landing content: one `Panel`
titled "Needs attention" beside a stack of three headline `Panel`s.

- **Row anatomy.** A `bg-subtle` kind chip (Renewal, Risk, Going quiet,
  Support, Anomaly — text only, no colour by severity), then the title: a
  `Link` to `/organizations/<id>` for every kind but anomaly, or, for an
  anomaly (which can span several companies), a left-aligned `<button>` that
  opens the drill panel over its company list. Below the title is an 11px
  `text-ink-muted` reason line. On the right, the at-stake figure
  (`font-mono-brand tabular-nums text-ink`, no colour — money at risk is
  never a severity cue) with a small "at stake" label under it, then
  **Snooze 7 days** and **Done**, both `min-h-9` with hover, focus-visible
  and disabled styling. Every action carries its own accessible name rather
  than relying on the visible word — `aria-label="Snooze <title> for 7
  days"`, `"Mark <title> done"`, `"Undo: <title>"` — since two rows can
  otherwise share a button's visible text. Acting on a row swaps it in place
  for a "Snoozed · `<title>`" / "Marked done · `<title>`" line with the Undo
  button; both the acted-on row's buttons and its own Undo disable while
  their request is in flight.
- **States.**
  - *Loading* (first load only): five rows shaped like the real row —
    chip-and-title, reason line and action-button placeholders as
    `animate-pulse` `bg-subtle` blocks — inside a `role="status"
    aria-busy="true"` wrapper, no spinner.
  - *Empty*: `Empty` — "Nothing needs you right now."
  - *Full error* (no rows to show at all, first load failed): `ErrorState` —
    "Could not load what needs attention."
  - *Stale rows plus a failed refetch*: the large `ErrorState` does not
    replace the list — a compact `role="alert"` line ("Could not load for
    these filters. Showing the last list.") sits above the old rows instead,
    so a filter change that fails never blanks a list the viewer was already
    reading.
  - A failed Snooze/Done/Undo shows its own `role="alert"` line in the panel
    header and restores the row, distinct from the load-error line above.
- **Headline cards** (`overview/HeadlineCards.tsx`): three stacked `Panel`s
  — Revenue, Health, Support — each with an "Open `<Area>` →" link in its
  header and a two-across `Kpi` row inside, no drill (the Overview only
  summarises; the area page is where a figure opens a list). Each shows a
  skeleton shaped like its own `Kpi`s (a label line over a figure line) until
  its data actually answers the current filters, and "—" in place of a
  figure on error.

### Drill panel

`src/pages/dashboard/drill/`, mounted once by `DashboardFrame` — one panel
for the whole dashboard, not one per view.

- **Trigger.** A `Kpi` with `onDrill` set (see above). A Recharts segment
  drawn as SVG can't be reached by keyboard or read by a screen reader on its
  own, so a chart that drills also renders `DrillTargets`: a labelled list of
  ordinary `<button>`s, one per segment, each named "`<name> <figure>, show
  accounts`" and hidden with `sr-only` until one of them receives focus
  (`focus-within:not-sr-only`), so a sighted mouse user still sees only the
  chart.
- **Shape.** `role="dialog"`, `aria-labelledby` the title. From `1024px`
  (`lg`) it takes exactly the Ask rail's box, 320px wide (`border
  border-line rounded-xl`). With the rail showing it lies over the rail
  (`lg:absolute lg:top-0 lg:right-4 lg:bottom-4`, `shadow-md`) and covers it
  exactly. With the rail hidden or collapsed it is a 320px flex item in the
  rail's place (`lg:static lg:shrink-0`, `shadow-sm`), so the content
  column narrows as if the rail were showing and widens again on close; it
  never covers the figures. `data-placement` says which (`rail`, `column`,
  `sheet`). Below `1024px` there is nowhere
  useful for focus to go beside it, so it becomes a full-screen sheet
  (`fixed inset-0`, `aria-modal="true"`) with its own Tab/Shift+Tab focus
  trap. Either shape slides in over 180ms `ease-out` (`.animate-slide-in-right`,
  skipped under reduced motion), moves focus to its close button on open (not
  when the viewport merely crosses `lg`), and closes on the close button,
  returning focus to whatever triggered it. Escape always closes the sheet;
  at `lg`, where the page beside it may want Escape for itself, it closes the
  panel only when focus is inside it and the event isn't already
  `defaultPrevented`.
- **Lifetime.** The panel closes when the area or any filter changes (path
  or query string), without pulling focus back to the old trigger. While a
  view refetches, its old figures stay on screen dimmed but its server
  drills are off, so a header can never show the old figure over the new
  list. A zero bucket in Tickets or Topics offers no drill target.
- **Rows.** A company name linking to `/organizations/<id>`, its ARR in
  `font-mono-brand tabular-nums`, and one small `text-ink-muted` detail line
  underneath worded for what the number counted — a risk score ("risk 62"),
  a day count ("45 days overdue" / "never contacted"), a share ("38% of
  ARR"), or a segment's own unit ("3 tickets", "62% used"). A ticket or
  interaction drill adds one 11px `text-ink-muted` line under the header:
  the list is companies with at least one matching record, records not
  linked to a company aren't listed, and one on a shared account counts for
  each of its companies. When the backend doesn't recognise a segment (no
  `drill` key in its answer) the panel says "This number can't be listed."
  rather than a generic failure. A server drill
  the backend itself capped at 500 shows "Showing n of count" above the
  list. "Open as a list" (`/organizations/list?ids=...`) appears only when
  the full count is known, 500 or fewer, and not truncated. A drill never
  opens at all from a list the view itself only shows a capped preview of
  (Forecast's `swing` table, Activity's `going_dark` table, Customer
  Overview's `concentration` beyond its own top three, Topics' `recent`
  table), or from a book a view has already flagged `truncated` (every
  Health view) or only partly loaded (Usage, until its full scatter has
  arrived) — a partial list can only ever show *some* of what a figure
  counted.

### Ask rail

`src/components/copilot/CopilotRail.tsx`, shared by Communications, the
Dashboard and Organizations (list and board), all variant `glass` at
`w-[320px]` (the Dashboard's glass is the owner's decision of 2026-09-24,
Organizations' of 2026-09-26; `plain`, a bordered `bg-surface` column, is
left for the phone sheet).

- **Dashboard shape.** The frame is Communications', class for class (owner's
  decision, 2026-09-24):
  - Top bar: the Navbar on `/dashboard/*` is Communications' header, `h-16
    shrink-0 flex items-center gap-3 px-4`, transparent (no `bg-surface`,
    border or shadow). Left: "Dashboard" and the area tabs. Right
    (`ml-auto`): the Ask pill, then the notification bell. No avatar or
    account menu there; the sidebar's avatar at the bottom carries it. Every
    other page's Navbar is unchanged.
  - Body: `DashboardFrame` is Communications' body, `flex-1 min-h-0 flex
    gap-3 px-4 pb-4` (`<main>` adds no padding on `/dashboard/*`), so the
    content column (filters toolbar and views, its own scroll) and the rail
    start at the same top and run the full height below the top bar. Hidden,
    the content takes the full width.
  - Controls: the same pill as Communications' top bar (`rounded-xl
    bg-surface/70 border-line p-1`, three `w-9 h-9` icon buttons: New chat,
    History, Sparkles "Show/Hide Copilot" with `bg-accent text-on-accent`
    while open), in the Navbar in place of its four decorative icons on
    `/dashboard/*`. History's popover hangs from the pill. The rail has no
    header row.
  - `xl` and wider: the rail is open by default beside the scroll area.
  - Below `xl`: hidden (not rendered) until the switch shows it.
  - Below `sm`: the switch opens a full-screen sheet with a single 44px
    Close (×) button at the top right.
  - From `lg` the drill panel takes the rail's box: over the rail when it
    shows (covering it exactly, 320px), in its place when it is hidden or
    collapsed, so the figures narrow rather than being covered.
- **Organizations shape.** The same pill in the same transparent top bar, and
  the same rail in `OrganizationsFrame`'s `rail` slot, on `/organizations/list`,
  `/organizations/board` and `/organizations/:id`. `OrganizationsAskLayout`
  draws the frame and the rail once, above all three; each page's own
  `OrganizationsFrame` inside it passes its content straight through rather
  than drawing a second frame. On an organisation's page the layout draws
  the page's `bleed` frame, so with the rail closed the page keeps its full
  width and 24px gutter; with it open the page narrows beside it, and the
  tiles wrap to their column (`@container`, four across from 36rem).
  Only the rail is glass: rows, cards, tiles, the side panel and the sheets
  stay solid `bg-surface`. The rail wins its room: from `xl` the side panel
  sits between the columns and the rail, both showing together; below `xl`,
  with the rail open, a card opens in the bottom sheet, and opening the rail
  closes an open side panel. Board columns are `w-64` beside it (`w-72`
  otherwise). List rows (`@min-[60rem]:flex-nowrap`) and the tiles
  (`@min-[50rem]:grid-cols-5`) respond to their `@container`, the content
  column, so they wrap beside the rail instead of scrolling sideways.
- **Contacts shape.** The same pill in the same transparent top bar, and the
  same rail in `ContactsFrame`'s `rail` slot, wired once by
  `ContactsAskLayout` above `ContactsPage` (its own preference key
  `revenact_contacts_ask`, so hiding it says nothing about the Dashboard's or
  Organizations' choice). The rail shows from `sm`, open by default from `xl`.
  With it open beside the page, the list and the profile stay two panes only
  from `xl` (the list narrowed to `w-[18rem]`, `w-[22rem] lg:w-[26rem]`
  otherwise); between `md` and `xl` while the rail is open it collapses to one
  pane (the profile, with its own "‹ Contacts" back link) until the rail is
  hidden. Below `sm` it is the same full-screen sheet as the other two
  surfaces. "Why this sentiment?" (Sparkles, 13px quiet link, under a
  person's sentiment line) drafts "Why is Lukas's sentiment neutral?" (first
  name only) with the sentiment focus and opens the rail without sending; it
  renders only inside `ContactsAskLayout` (the `draft` context is null off
  it), so it disappears rather than disables itself off that route. A person
  the asker cannot open refuses "You can't ask about this person here."; the
  filtered list refuses "You can't ask about this list. Clear the filters and
  ask again." — both keep the question on screen, with no Retry, like any
  other refusal.
- **Chips.**
  - The composer's chip says what the next question is about ("Revenue ›
    Forecast · Owner: Priya · 2 accounts"). Its × removes only a focus, never
    the screen.
  - Each user question carries its own 11px `bg-subtle` chip above its bubble,
    on the Dashboard, Organizations and Contacts (a conversation reopened in
    Communications or `/copilot` shows no chip, since only those three pass
    `chipLabel`). Organizations' chip is "Organizations", then the page's own
    filter-chip labels, then the focus ("1 account"). Contacts' chip is
    "Contacts", then the filtered organisation (and account), sentiment and
    role labels and a quoted search term (`listParts`), or, for an open
    person, their name and place ("Lukas Vermeer · Kraft Heinz › Kraft Heinz
    EMEA") with "Sentiment" appended while the question is narrowed to their
    sentiment; a reopened conversation's chip is the server's own `label`.
- **Empty.** Communications' empty state on both surfaces: one centred 13px
  `ink-faint` line, "Ask about what is in front of you. Answers use your
  accounts, mail and tickets." The dashboard's suggested questions were
  removed on 2026-09-24 at the owner's request, to match Communications.
- **Answers.** Rendered as plain text (`whitespace-pre-wrap`), not the
  Markdown formatting `/copilot`'s `AnswerText` applies. A reply withheld from
  a reader with narrower visibility in a shared session renders the same way,
  as plain text — the rail never special-cases it.
- **States.**
  - In flight: a three-line `bg-subtle animate-pulse` skeleton shaped like an
    answer (`role="status"`, "Thinking…" for screen readers).
  - Budget spent (`429`): an `ink-muted` line, "This month's AI budget is used
    up.", with no action.
  - Any other failure, including a `400` (a malformed context): a
    `text-danger` line with a Retry button; the question stays on screen.
    Retry resends the question exactly as first asked — its own context and
    focus, from the chip on the failed bubble — never the current screen.
  - Focus returns to the input after every send.
- **Entry points.**
  - Drill panel: "Ask about these" (secondary button, Sparkles icon), enabled
    only for a complete list of 200 accounts or fewer; above that it is
    disabled with an 11px note ("Ask about up to 200 accounts at a time.
    Narrow the filters to ask."). Clicking it closes the drill panel first —
    the drill takes the rail's box from `lg` — then opens the rail with an
    editable, unsent draft.
  - Attention row: "Why?", a quiet button after Done, named "Ask why <title>
    is on my list". Unlike the drill's draft, it sends at once. It is
    `aria-disabled` while an answer is on its way or while that row's
    Snooze/Done is in flight.
  - Contacts' "Why this sentiment?" (a person's profile, under the sentiment
    line, only inside `ContactsAskLayout`) drafts "Why is Lukas's sentiment
    neutral?" (the first name and the sentiment word) with the sentiment
    focus and opens the rail; like the drill panel's, it never sends until
    asked.
  - Every entry point (and a History pick, and New chat) opens the rail (or
    the phone sheet) for that visit only; only the Navbar pill's Sparkles
    switch, from `sm` up, persists the open/closed choice to `localStorage`
    (`revenact_dashboard_ask`, `revenact_organizations_ask` or
    `revenact_contacts_ask` — each surface keeps its own).
    The phone sheet's Close never saves anything; the sheet always starts
    closed. Sending at once (`ask()`)
    replaces any earlier drafted question and focus, so only one is ever
    pending.
- **History.** An 11px origin tag (LayoutDashboard icon + "Revenue › Forecast")
  on dashboard conversations — the area and view only, never the filters it
  was asked with; a question's own chip is what carries those. Organizations
  conversations carry the Network icon and "Organizations" followed by the
  server's own `labels` ("Organizations · Owner: Carl CSM"; there is no
  `origin_label` field), or, when started on an organisation's page, the
  server's `label` ("Pizza Hut · EMEA"), capped at 60% of the row and truncated.
  Contacts conversations carry the Users icon and the server's own `label`,
  read "Started on " for screen readers: "Contacts · Negative" for one
  started on the filtered list, or "Lukas Vermeer · Kraft Heinz" for one
  started on a person. Picking a conversation from History always navigates
  to the surface it started on (Dashboard, Organizations or Contacts),
  whichever page is currently showing; a Contacts pick lands on
  `/contacts/:id` (a person) or `/contacts?<filters>` (a list).

### Portfolio rows and board (Organizations)

The list is Operate mode without a spreadsheet: one rounded `bg-surface` item
per account on the canvas, grouped into sections whose headers show count and
ARR. Rules specific to it, enforced by
`components/organizations/portfolio/houseRules.test.ts`:

- Type sizes 11/13/15/22 px only; numbers in `font-mono-brand tabular-nums`.
- Health is a ring coloured by `HEALTH_COLORS` with the score as text; the trend
  line, runway and signal all carry words (the trend's label, "47d overdue",
  "Renewal overdue"), never colour alone. `renewal_overdue` and `risk` signals are
  danger-toned, `tickets` warning-toned.
- No card in a card: the opened row's panels are separated by whitespace; the
  summary tiles sit on the canvas. No glass on the list or the board
  themselves; only the Ask rail beside them is glass.
- Skeletons are row- and tile-shaped; the empty state is "No organizations match
  these filters" with Clear filters (or "No organizations yet" with Add).
- Every field of the old 34-column table renders exactly once in the row header
  or a panel (`fieldCoverage.test.tsx`); any panel field can be pinned as a chip.
- Frame: the Navbar on `/organizations/list` and `/organizations/board` is the
  dashboard's transparent top bar ("Organizations", List/Board carrying the
  query, the actions slot, the bell, no avatar); `OrganizationsFrame` is
  `DashboardFrame`'s body, with the Ask rail in its `rail` slot (see "Ask
  rail", Organizations shape).
- Board: columns sit on the canvas with no surface of their own, and cards
  (`bg-surface`, ring, name, owner, ARR, signal, trend) are the items, so there
  is no card in a card. A column header reads "Live · 1 · $69.6K". A dragged-over
  column shows `bg-accent-dim` with an accent ring. The drop-only Churn column
  is a dashed box. Each lifecycle column but Churn carries a header "+" that
  opens Add organization preset to that column's stage; the toolbar's own Add
  has no preset. A card's **Move to…** is a compact icon button in the card
  header (`ArrowRightLeft`, labelled "Move <name> to…", 44px on phones and
  `min-h-9` from `sm`), not a native `<select>` acting on change: it opens a
  real menu of the other stages and nothing moves until one is chosen. Arrow
  keys, Home and End move within it; Escape or choosing an item returns focus
  to the button; Tab or an outside press just closes it and leaves focus
  where it went; opening another card's menu closes this one. The menu opens
  on the side with more room inside the visible box (the window intersected
  with every clipping ancestor) and caps its height to that room, scrolling.
  After a move, focus lands on the moved card's Open button in its new
  column. From `sm` the page fills the frame: the page does not scroll, each
  column does (the board keeps 360px on short windows, which then scroll). The opened card is `AccountSidePanel`, a
  non-modal `bg-surface` column beside the board, not over it — the board
  stays usable while it is open. Skeletons are card-shaped; a column with
  nothing says so in words.

### Portfolio rows and board (Accounts)

`/accounts/list` and `/accounts/board` are the Organizations portfolio with
the account kind (`ACCOUNT_KIND`, `components/accounts/portfolio/accountKind.ts`),
which each page provides around itself through `PortfolioKindContext`.
Everything in the section above holds, with these differences:

- The line under a name reads "Organisation · owner · lifecycle · touched Nd
  ago". The organisation is the first linked one the viewer may open, then
  "+N" for the rest; a hidden one is never named or counted. A Board card's
  line is the organisation (else the owner).
- The opened row is `AccountPanels`:
  - Commercial: ARR in the workspace's currency, and the renewal date on a
    line with today marked, danger when overdue.
  - Voice of the customer: the NPS bar and band, CSAT, and the AI pulse
    reason as a quote.
  - Profile: the Revenact ID, each organisation as a link to
    `/organizations/:id?account=<id>`, then domain, industry, email, phone and
    address.
  - History: created, updated, pulse recorded on, and CSM pulse set.

  Every one of the 24 Account fields shows exactly once
  (`components/accounts/portfolio/fieldCoverage.test.tsx`).
- No archive and no churn: there is no Archive or Churn button and no
  "Include churned". Churn is an ordinary Board column with a "+", and a move
  there saves like any other. The bulk Set lifecycle offers Churn.
- The filters are organisation (checkboxes, after Owner), owner, lifecycle,
  health, renews within and NPS. The sorts are risk, ARR, renewal, health and
  name. There are no Pin fields.
- The Renewing tile opens on 90 days.
- An account none of whose organisations the viewer may open shows no Edit
  details and no Move to…, since both need its organisation's id. Bulk edits
  still reach it.
- The name, and the sheet's and side panel's "Open account page", pass the
  row to `/accounts/:id` in `location.state`, where the account page (to be
  redesigned in delivery 2) reads it.
- The top bar is the framed one: "Accounts", List | Board keeping the query,
  the actions slot, and no avatar. The rail slot stays empty until Ask
  (delivery 3).

### Organization page (`/organizations/:id`)

The organization's story, framed like the list (transparent top bar with
"‹ Organizations", `OrganizationsFrame`, and the glass Ask rail beside it,
a sheet on phones). Each story item's meta line ends with a quiet "Ask about
this" (Sparkles, 11px, a 44px target below `sm`).
Rules specific to it, enforced by `components/organizations/detail/houseRules.test.ts`
(which also scans `pages/organizations/Details.tsx`):

- Name row: initials in a `bg-subtle` circle (never a third-party logo), the
  name at 22px, "owner · lifecycle · Touched Nd ago" at 13px, the signal tag,
  then Edit and Add account (both icon-only below sm) and a ⋯ menu (Archive, Churn while they apply).
- Tiles: Health (ring and trend; opens the five-part breakdown below the
  tiles), ARR (in the customer's own currency), Renewal (runway) and Pulse
  ("AI n · CSM n", dots, "pulses disagree"). Each is a button; the last three
  jump to their Details panel. A grid of four from `sm`, a snapping strip below.
- Account chips (All, each account, Organization) sit above the tabs on
  every tab, so the row never jumps (owner, 2026-09-28). Organization is
  always there, at 0 when nothing is on the organization itself. On Story,
  People, Deals & risks and Files they carry only a name and the active
  tab's count (story items, people, opportunities plus risks, files plus
  calls); the chosen one is `bg-accent text-on-accent`. On Details and
  Knowledge they filter nothing: names only, `text-ink-muted`, the chosen
  one outlined, with "Details and Knowledge cover the whole organization"
  tied to each chip by `aria-describedby`; a press still moves the kept
  `?account=`. "Edit <account>" ends the row on every tab.
- People, Deals & risks and Files are lists, never tables
  (`detail/ListParts.tsx`, `detail/listStyles.ts`): a one-line summary with
  its figures in DM Mono replaces the stat cards; each tab is one
  `bg-surface` list with dividers; an item is a leading icon or initials, a
  13px title with its figure or time in DM Mono on the right, then an 11px
  line with the account tag (as the Story's). People's ⋯ holds Edit and
  Delete; a deal opens its edit form; a file's name downloads it. Calls are
  grouped by day like the Story, with no rail and no inner scroll. Each list
  has a skeleton, an error with Try again, and empty states that offer "Show
  all accounts" under an account chip. Phones put a person's links on their
  own line and drop the board.
- Details opens with Accounts (`detail/AccountsSection.tsx`): a summary line
  above the list shows counts, the health mix, total ARR, NPS with its
  promoter, passive and detractor split, average CSAT and average CSM (both
  averaged over scored accounts only, "—" when none are scored), and the
  lifecycle breakdown. Then one `bg-surface` list, an item per connected
  account: the name links to `/accounts/:id`, owner · domain, then a second
  line with health (score and category), lifecycle, ARR, renewal, NPS, CSAT,
  "AI n · CSM n" with the pulse dots and the AI reason, and the Revenact ID,
  with "—" for blanks. Add account is in the heading; each item has its own
  Edit. Under the six panels, in the same surface, "Contact and CSAT"
  (`CustomerFacts`): email as a `mailto:` link with the part before the `@`
  encoded, phone as a `tel:` link, industry, and the CSAT bands as bars at
  their true share.
- The one primary on the Story is "+ Add" (`PRIMARY` in `portfolio/styles.ts`:
  `bg-accent text-on-accent`, never layered on the surface button).
- Tabs are a real tablist (`role="tab"`, roving tab index, arrows, Home, End),
  underlined like the Navbar's views.
- Story: Needs attention (each row says what it is in words and goes to it),
  the filters with counts, Sources, search and "+ Add", then the stream: days
  as small uppercase headings, each day one `bg-surface` list with dividers,
  in the Communications inbox's manner. An item is a Lucide icon in a circle,
  its title, the time in DM Mono, a one-line summary, then the account tag and
  "kind · who · via source". No card in a card.
- Every one of the 34 table fields renders once across the name row, the
  tiles and Details (`detail/fieldCoverage.test.tsx`).

### Contacts

Spec `docs/superpowers/specs/2026-09-28-contacts-redesign-design.md` §3–§5.
A list and a profile panel, like the Communications inbox but solid (no
glass), in `ContactsFrame` (the same bleed gutter as the organisation page —
`OrganizationsFrame`'s classes — with a slot for the Ask rail).
`ContactsAskLayout` (delivery 2, spec §4.4) draws the frame and the glass rail
once, above `/contacts/:id?`, the same way `OrganizationsAskLayout` does for
Organizations (see "Ask rail", Contacts shape); `ContactsPage`'s own
`ContactsFrame` inside it then passes its content straight through.

- **Header.** The summary line ("142 people · 38 decision makers · 120
  active · 61% positive · 12 negative · +12.5% growth (30d)", over the whole
  filtered set; "n active" and the growth only when the backend serves
  `summary.active` / `summary.growth_30d_pct`, and growth left out when it is
  null), then search and the
  organisation (one a deep link names past the first page of options is
  read by id for its name), account (waits for an organisation), sentiment and role
  filters — each with its own visible label, not a placeholder standing in
  for one — all in the URL (`q`, `customer`, `account`, `sentiment`, `role`),
  and + Add (the existing `ContactFormModal`).
- **List.** One item per person: initials, name and role, "Organisation ›
  Account" (or the organisation alone), sentiment in words in its colour with
  "n calls" beside it (every call of theirs the viewer can open, read or
  not), last contacted, and Active/Inactive. Load more at the end; skeleton,
  error with Try again, and empty states (Clear filters when filtered).
- **Profile.** `/contacts/:id` chooses the person. Name (22px), role and
  Active/Inactive,
  "Organisation › Account" (the organisation links to its page, the account
  to it with `?account=` so its chip is chosen), email and phone links
  (sanitised). Their sentiment and why ("Neutral: 3 positive · 2 neutral · 1
  negative across 6 calls and 2 emails, latest 12 Sep"), counted only over
  the viewer's readable analysed records (`sentiment_readable`) — never from
  the interactions listed below it, which can include kinds it doesn't
  count. When the stored sentiment also rests on records the viewer cannot
  open, it appends "Also rests on records you can't open."; when none of
  what it rests on is readable, it reads "Negative, from records you can't
  open." instead of the count. Under it, on phones
  too: "Last contacted 2 weeks ago" (or "Not contacted yet") and, for a
  computed sentiment, "Sentiment read 2 weeks ago" (`sentiment_computed_at`).
  An edit sends the sentiment only when it was changed (a sent one becomes
  hand-set and drops its evidence), then reads the person, their history and
  the summary line again. A hand-set sentiment reads "Negative. Set by
  hand." and, when some of their calls have been analysed, "…; their calls
  will be read again tonight" — never that nothing was analysed.
  `/contacts/abc` (no person can have that id) shows the same not-found
  state as a person the viewer cannot open. Calls newest first:
  date, title, sentiment or "Not enough to analyse" (nothing while pending —
  `readingOf()`: `not_analysable` → "Not enough to analyse", `pending` →
  nothing, otherwise the sentiment), the summary its title opens, the
  classification, host and length, the organisation › account tag and the
  recording. Then emails, then tickets ("Department · Status", falling back
  to the status alone when the ticket carries no department). Edit and
  Delete are the existing flows. "Why this sentiment?" (Sparkles, a quiet
  link under the sentiment line) drafts "Why is <first name>'s sentiment
  <word>?" with the sentiment focus and opens the rail without sending; it
  renders only inside `ContactsAskLayout` — hidden, not disabled, off that
  route (the existing `/contacts` route always has it, since it is a child of
  the layout; a bare render of `ContactsPage` in a test with no `AskProvider`
  is the only place it is absent).
- **Phones** (below 768px). The list is full width; a person opens as their
  own screen with a "‹ Contacts" back link that keeps the filters. Rendered
  conditionally, not hidden with CSS.
- **Organisation page ties.** A person's name on the People tab opens
  `/contacts/:id`; a call there with nothing to read says "Not enough to
  analyse" and a pending one shows no sentiment.
- **What a call's reading is read from** (backend, `services/customers/
  calls.py::call_text`): the classifier reads the summary first, else the
  transcript, else just the title — the transcript's own opening lines are
  often small talk, so a summary (a digest of the whole call) pre-empts it
  rather than the two being concatenated.

### Overlays

The Organizations `FiltersPanel` and `PinFieldsMenu`, `ContactRowActionsPopover`,
the organization page's `Menu` (⋯ and + Add) and `SourcesPicker`, and the Navbar's
notification and account menus. All close on an outside `mousedown`; the
organization page's also close on Escape and hand focus back to their button.
The organization page's `Sheet` (+ Add, an email's thread) is modal: a
right-hand panel from `sm`, a bottom sheet below it, with a focus trap, the
page's scroll locked, and focus returned to what opened it.

### Forms

Fifteen modals. The pattern: a `fixed inset-0 z-50` container, a `bg-black/30`
scrim, `autoFocus` on the first field, labels above inputs, errors below,
`ConfirmDialog` for anything destructive with a "Working…" state on the confirm
button.

| Modal | Fields |
|---|---|
| `OrganizationFormModal` | Name, domain, address, industry, owner, lifecycle stage, currency, joined, renewal, contract start and end |
| `AccountFormModal` | Organization, name, domain, industry, owner, lifecycle stage, renewal date |
| `ChurnOrganizationModal` | Churn date, reason, comment |
| `ContactFormModal` | Name, company, account, role, status, email, phone, sentiment |
| `OpportunityFormModal` / `RiskFormModal` | Title, company, account, MRR, priority, department, stage |
| `SurveyFormModal` | Company, account, type, sent date, score |
| `ComposeEmailModal` | To, subject, message |
| `HandoffModal` | Member, note |
| `AddMemberModal` / `EditMemberModal` | Name, email, function, role, temporary password |

### Composite

`ActivityFeed` (the account page only, since the organization page's Story
replaced it there) is the largest shared component: five top tabs (Activity
Feed, Headlines, Overview, Files, CallSense) and thirteen filter chips. `MentionTextarea`
is a textarea with an `@` completion listbox supporting people and function
mentions.

### Charts

Roughly 45 Recharts components. Entry animation is disabled globally through
`STATIC_SERIES` in `src/components/shared/chartAnimation.ts`, because animating
forty charts on a dashboard tab change is noise, not information.

**Colour roles.** Every dashboard chart draws from `src/pages/dashboard/shared/chartPalette.ts`
rather than a literal colour — `chartPalette.test.ts` scans the dashboard and
health tree and fails the build if one shows up. Two roles only:

- `ROLE.ink` / `muted` / `faint` — the monochrome scale (the same three tones
  as `text-primary`/`text-secondary`/`text-tertiary`) for anything that is a
  category, not a status: a source, an area, a segment. `ROLE.inkStrong`,
  `inkSoft` and `gainSoft` are `color-mix()`s of a role colour with the
  surface it sits on, for a chart that needs more distinct values than three
  tones cover (a stacked bar with five statuses, a scatter with six usage
  bands) without inventing a fourth arbitrary hue or breaking dark mode.
- `ROLE.loss` / `gain` / `caution` — the three semantic tokens, reserved for a
  value that really is a loss, a gain or a caution.
- `CATEGORICAL` (`[ink, muted, faint]`) is for categories with no inherent
  order, always paired with a direct label since three greys alone are not
  reliably distinguishable.
- `TOOLTIP_STYLE` and `CURSOR_FILL` are the shared `<Tooltip contentStyle>`
  and bar-hover cursor fill for every recharts tooltip in the dashboard —
  replacing the translucent-black rgb literals and one-off hover washes each
  chart used to invent for itself.

Chart rules, from the `dataviz` and `ui-ux-pro-max` skills, backed by the
shared kit in `src/pages/dashboard/shared/`:

- Never encode meaning in hue alone. Pair colour with a line style, a shape or a
  direct label.
- Every chart needs a legend or direct labels, and a tooltip.
- An axis title is `chartAxis.ts`'s `axisLabel`, paired with `chartMargin` on
  the same side, which reserves the room the title lands in outside the tick
  band. Never an `inside*` label position or a negative margin — both clip
  the ticks. A category axis is `categoryAxis`, which measures its band per
  render and keeps names flat when they fit, slanting or truncating them only
  when the band is too narrow; a horizontal bar list wraps long names with
  `wrapTick` instead. A date axis reads its tick from the string via
  `dateTick`, never from a constructed `Date`, so nothing drifts a day with
  the viewer's timezone. A zero-value money tick is `zeroMoney`, not compact
  notation's "$0.0". Tick text is never smaller than 10px.
- A chart's key is `ChartLegend`; a health-coloured chart uses the shared
  `HEALTH_LEGEND` rather than redeclaring Good/Average/Poor.
- A table or list that can outgrow its card scrolls inside `ScrollTable` (or
  `ScrollArea` for a `<ul>`/`<ol>`), which pins the header on the surface
  colour and gives the region a focusable, labelled scroll box. A list that
  is already bounded (a fixed row count, a capped query) gets no scroll
  wrapper at all — that is decoration around content that never overflows.
- Every `<Tooltip contentStyle>` spreads `TOOLTIP_STYLE`, never a one-off
  literal, so it reads in dark mode; `chartPalette.test.ts` scans every chart
  file for a `contentStyle` that skips it.
- A stacked bar's total is drawn by `stackedTotalLabelList`, spread onto each
  series' own `LabelList`, never by pinning a label to one fixed series —
  Recharts skips a zero-height bar, so a label pinned to one series would go
  missing on exactly the rows where that series is empty, which are the ones
  worth reading. A category whose whole stack is zero still needs a visible
  value: `emptyStackMarker` draws a hairline and a "0"/"$0" there instead of
  leaving a gap that reads as missing data.
- A donut spreads the shared `DONUT` preset (`innerRadius: '58%'`,
  `outerRadius: '80%'`) rather than pixel radii, so it holds its proportions
  at any card size.
- Fewer than four points is a stat tile, not a line chart. More than six series
  is noise.
- Every multi-column row in a dashboard view lets its children shrink below
  their content (`[&>*]:min-w-0` or the item's own `min-w-0`), so a wide
  table or long header scrolls inside its own card instead of pushing the
  row past the viewport. `viewLayout.test.ts` enforces this across every
  tab's views.

---

## 7. Interaction and state

Every list, table and chart declares four states. This is a review gate, not a
suggestion.

| State | Standard |
|---|---|
| Default | |
| Loading | A skeleton matching the final layout, not a spinner. *Current code uses text lines instead; see debt.* |
| Empty | Sentence case, one line saying what is missing, a second explaining why or what to do. Existing copy to match: "No organizations", "No files yet", "Nothing renewing this quarter." |
| Error | The message from `ApiError`, plus a retry. The Health dashboard's wording is the model: it explains that nothing is shown rather than a partial picture |

Every interactive element declares default, hover, `focus-visible`, active,
disabled and loading states, with a 44px touch target or `min-h-9` for
desktop-only dense controls.

Copy rules: sentence case, labels above inputs, errors below inputs, never a
placeholder as a label, no filler verbs, no em dashes in new UI copy.

---

## 8. Motion

| Token | Value |
|---|---|
| `--dur-fast` | 120ms |
| `--dur-base` | 200ms |
| `--dur-slow` | 300ms |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)`, for entrances |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)`, for exits |

Transitions 120 to 200ms, reveals 200 to 300ms, nothing over 400ms. **No bounce
or elastic springs**; if a spring is ever used it must be critically damped and
finish inside 300ms. Keyboard-initiated changes never animate. High-frequency
interactions like row hover and fast tab switches do not animate. A global
`prefers-reduced-motion` override in `src/index.css` drops every animation to
0.01ms.

No Motion, Framer or GSAP is installed. Adding one is a decision for the product
owner, not a side effect of a polish task.

---

## 9. Accessibility

The stated bar is WCAG 2.1 AA.

**Met today:** semantic tables with real `th` cells; `aria-label` on icon buttons
in newer code; `aria-pressed` on filter chips; `aria-checked` on toggles;
`role="tablist"` with `aria-selected` on the feedback kinds; `role="listbox"` for
mention completion; `role="img"` on the knowledge graph SVG; `sr-only` file
inputs; labelled pagination buttons; the global reduced-motion override.

**Not met, in priority order:**

1. **Inconsistent `focus-visible` styling.** Newer surfaces (Dashboard,
   Communications, Copilot, Brain, Settings) declare `focus-visible:outline`
   widely, but inputs across the app still use
   `focus:outline-none focus:border-accent`, which removes the keyboard
   indicator on them entirely, and older controls elsewhere have neither.
2. **No focus trap or focus return in almost any dialog.** Fifteen modals
   plus several other floating ones declare `role="dialog"`
   (`ComposeEmailModal`, `PlatformOrganisations`, `PipelinesPage`,
   `EditNodePane`, `OnboardingCarousel`, the shared `CopilotRail`
   history popover, the dashboard's drill panel, the dashboard's Ask sheet) —
   of all of them, only the drill panel (in its sheet below `1024px`) and the
   Ask sheet (below `640px`) trap focus, and only those two return focus to
   their trigger on close.
3. **Escape closes almost nothing.** Only the mention list, one inline
   rename, the dashboard's drill panel and the Copilot history popover
   handle it.
4. Navbar Search, Plus, Help and Message buttons (off the dashboard; on
   `/dashboard/*` the Ask pill replaces them) have neither labels nor
   handlers.
5. Sidebar navigation relies on `title` when collapsed rather than a label.
6. No global toast system, so success feedback is inconsistent.

---

## 10. Responsive

Layouts are declared for 375, 768, 1024 and 1440. The sidebar is `absolute` below
`md` and overlays content. `<main>` padding scales. Forms use `md:grid-cols-*`.
No horizontal page scroll is acceptable.

One standing violation: the layout root uses `h-screen w-screen`, where the rule
is `min-h-[100dvh]`, which matters on mobile browsers whose toolbars change the
viewport height.

The dashboard's Ask rail changes shape at `sm` (sheet below it) and `xl` (open
by default from it); from `lg` the drill panel takes the rail's box (over the
rail when it shows, in its place when it does not).

Organizations' Ask rail changes shape at the same `sm` and `xl`. Below `xl`
it and the board's side panel never share the row: with the rail open a card
opens in the bottom sheet. Below `sm` it is the full-screen sheet from ✦,
which cannot open at the same time as an account's bottom sheet.

The Organizations list below `sm`: rows become two-line cards, the toolbar is
Search plus a Filters bottom sheet (group, sort, Export and Add inside), the
summary tiles swipe sideways in their own strip, an opened row is a bottom
sheet with a focus trap that locks page scroll while it is open, and a long
press starts selection. Every control is 44px.

The Organizations board below `sm`: each column is a full-width panel in a row
that snaps sideways, with a strip of column tabs ("Live 1") that jumps to one
and follows a swipe. Cards do not drag there; each card's Move to… menu moves
it, and a tapped card opens in the bottom sheet. Every control is 44px.

The organization page below `sm`: the name row, the tiles as a strip that
snaps sideways, the account chips and the tabs each scroll sideways in their
own row, Edit and Add account are icon-only, a person's email and phone take their own
line, Deals & risks has no board, and the content is full width. "+ Add" and an email's thread open as
bottom sheets. Every control is 44px.

---

## 11. Review checklist

A change is not finished until all eleven pass. This is the "anti-slop bar" from
the design skill, reproduced so a reviewer can work through it.

1. Zero raw hex, rgb or named colours in `src/**/*.tsx`. Tokens only.
2. One accent. Semantic colours carry meaning, never decoration.
3. At most four type sizes per surface. Numbers in DM Mono with `tabular-nums`.
   Reading line length 65 to 75 characters.
4. No card inside a card. No gradient buttons, no purple, no glow, no
   glassmorphism on product surfaces. Exception, by the owner's decision on
   2026-09-21: Communications (and, by the owner's decisions on 2026-09-24
   and 2026-09-26, the Ask rail on the Dashboard and on the Organizations
   list and board, the rail only), whose cards are `.rv-card-glass` /
   `.rv-glass-inner` so the canvas glow shows through, as in the reference
   mail client. The canvas gradients (`--rv-canvas-gradient-1/2`) were
   strengthened in both themes at the same time; that is the intended look
   for every `.rv-canvas` page, not a side effect. The mailbox's category dots
   are a categorical filing key, not status, and reuse the semantic tokens.
5. Every interactive element has all six states and a 44px target or `min-h-9`.
6. Every list, table and chart has designed empty, loading and error states, with
   a skeleton that matches the layout.
7. Motion inside the budget, never on keyboard-driven changes, never on
   high-frequency actions, always honouring reduced motion.
8. Labels above inputs, errors below, no placeholder-as-label, sentence case, no
   filler verbs.
9. Charts have accessible colour pairs, a legend or direct labels and a tooltip.
   No colour-only meaning. Entry timing through `chartAnimation.ts`.
10. Responsive at 375, 768, 1024 and 1440. No horizontal scroll.
    `min-h-[100dvh]`, never `h-screen`.
11. Tests added or updated. `npm run lint` and `npm run build` pass.

---

## 12. Current design debt

Ranked by leverage. Each is a task in the
[Implementation Plan](../../revenact-backend/docs/product/06-implementation-plan.md).

| # | Debt | Evidence |
|---|---|---|
| 1 | Body text is still on the system stack (display and mono are wired) | `src/index.css` has no `body` font rule; DM Serif Display and DM Mono apply via `.font-display` / `.font-mono-brand` |
| 2 | `focus-visible` styling is inconsistent | Newer surfaces declare it widely; inputs everywhere still use `focus:outline-none focus:border-accent`, which removes the indicator entirely |
| 3 | 108 raw hex values in components | Worst offenders: `Integrations.tsx` (11, vendor logos), `SurveysTab.tsx` (4), the recurring `text-[#0D0F0E]` on accent backgrounds |
| 4 | No focus trap or return in almost any `role="dialog"` | Of the app's several floating dialogs, only the dashboard's drill panel traps focus (and only in its sheet below `1024px`) and returns it on close |
| 5 | Loading states are text lines, not skeletons | Only `HeadlinesTab` shows a text-line affordance; `ChatView` uses a layout-matching skeleton since 2026-09-22 |
| 6 | `h-screen` in `DashboardLayout` | Rule says `min-h-[100dvh]` |
| 7 | `rounded-2xl` and `rounded-3xl` outside the scale | Contact detail, Account placeholder |
| 8 | `backdrop-blur-sm` on placeholder routes | Glassmorphism is banned on product surfaces (Communications' `.rv-card-glass`, also used by the Ask rail on the Dashboard and Organizations, is the one sanctioned exception) |
| 9 | `Login.css` requests Inter, which is never loaded | Falls through to the system stack |
| 10 | Dead files: `App.css` is never imported, the `counter` slice and the seeded `tasks` slice are unused | Template leftovers |
| 11 | Navbar and the account page's ActivityFeed have controls with no handlers | Search, Plus, Help, Message, feed search, "Add Action", title chevrons |

---

## 13. How to make a change

1. Read `.claude/skills/revenact-design/SKILL.md` first. It routes the task.
2. For a product surface, load `impeccable`. For a UX rule, accessibility
   criterion or chart choice, query `ui-ux-pro-max` with the right domain but do
   **not** adopt its palette or typography output. For motion, load
   `emil-design-eng` then `design-motion-principles`.
3. Work one surface per pull request.
4. Verify in the real app: `npm run dev`, then drive it with
   `npm run pw -- open http://localhost:5173` and take a snapshot.
5. Run the checklist in section 11 before asking for review.
