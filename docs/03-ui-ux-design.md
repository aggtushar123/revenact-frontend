---
description: UI/UX design reference for the Revenact frontend — tokens, type, components, interaction rules, accessibility bar and current design debt.
---

# Revenact — UI/UX Design

Current as of 2026-09-18. The authority for any visual change is
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
| Dashboard tab bar | 44px |
| Health sub-tab bar | 40px |

---

## 6. Component inventory

### Data display

| Component | Where |
|---|---|
| `OrganizationsTable` | 34 selectable columns, select-all, sortable, `EditColumnsPopover`, row actions, "Showing a-b of n" footer |
| `AccountsTable`, `ContactsTable` | Same shape, no bulk actions |
| `KanbanBoard` | Generic over stage and item; HTML5 drag events; used by Pipelines, Organizations Board and Accounts Board |
| Dashboard tables | `AccountHealthDetailTable`, `RenewalQueueTable`, `ActivityDetailedTable`, `GoingDarkTable`, `SwingTable` |
| `MetricsPanel` | Per domain: count, health donut with COUNT/MRR/ARR toggle, NPS, lifecycle donut, renewal window |
| `PinnedAttributes` | Label and value pairs typed as text, truncated, dot, owner or pulse |
| `EntityAvatar` | Company logo, else deterministic initials in one of five semantic hues |
| `PresenceStrip` | Session participants, maximum five |

### Overlays

`HealthPopover` (five real rubric components with weights), `CsatPopover`
(response bands at true scale), `RenewalPopover`, `EditColumnsPopover`,
`RowActionsPopover`, `ContactRowActionsPopover`, and the Navbar's notification
and account menus. All close on an outside `mousedown`.

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

`ActivityFeed` is the largest shared component: five top tabs (Activity Feed,
Headlines, Overview, Files, CallSense) and thirteen filter chips. `MentionTextarea`
is a textarea with an `@` completion listbox supporting people and function
mentions.

### Charts

Roughly 45 Recharts components. Entry animation is disabled globally through
`STATIC_SERIES` in `src/components/shared/chartAnimation.ts`, because animating
forty charts on a dashboard tab change is noise, not information.

Chart rules, from the `dataviz` and `ui-ux-pro-max` skills:

- Never encode meaning in hue alone. Pair colour with a line style, a shape or a
  direct label.
- Every chart needs a legend or direct labels, and a tooltip.
- Donuts use `innerRadius={45}` and `outerRadius={60}` to stop label clipping.
- A stacked bar's total is drawn by `makeStackedTotalLabel`, never by pinning a
  label to one series, because a bar with none of that series would lose its
  total, and those are the bars worth reading.
- Fewer than four points is a stat tile, not a line chart. More than six series
  is noise.

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

1. **Zero `focus-visible` styles anywhere.** Inputs use
   `focus:outline-none focus:border-accent`, which removes the keyboard
   indicator on non-input controls entirely.
2. **No focus trap or focus return in any modal.** Fifteen modals, and only three
   elements in the whole app declare `role="dialog"`.
3. **Escape closes almost nothing.** Only the mention list and one inline rename
   handle it.
4. Navbar Search, Plus, Help and Message buttons have neither labels nor
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
   2026-09-21: Communications, whose cards are `.rv-card-glass` /
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
| 2 | No `focus-visible` styling anywhere | Grep returns zero occurrences |
| 3 | 108 raw hex values in components | Worst offenders: `Integrations.tsx` (11, vendor logos), `SurveysTab.tsx` (4), the recurring `text-[#0D0F0E]` on accent backgrounds |
| 4 | No modal focus management, three `role="dialog"` in fifteen modals | |
| 5 | Loading states are text lines, not skeletons | Only `HeadlinesTab` and `ChatView` show any loading affordance |
| 6 | `h-screen` in `DashboardLayout` | Rule says `min-h-[100dvh]` |
| 7 | `rounded-2xl` and `rounded-3xl` outside the scale | Contact detail, Account placeholder |
| 8 | `backdrop-blur-sm` on placeholder routes | Glassmorphism is banned on product surfaces (Communications' `.rv-card-glass` is the one sanctioned exception) |
| 9 | `Login.css` requests Inter, which is never loaded | Falls through to the system stack |
| 10 | Dead files: `App.css` is never imported, the `counter` slice and the seeded `tasks` slice are unused | Template leftovers |
| 11 | Navbar and ActivityFeed have controls with no handlers | Search, Plus, Help, Message, feed search, "Add Action", title chevrons |

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
