---
name: revenact-design
description: Entry point for ANY visual or UX change in the Revenact frontend (react-ts-app). Use before touching a page, component, layout, colour, font, spacing, animation, empty/loading/error state, chart, or copy. Records the repo's design truth (tokens, fonts, icons, motion budget) and routes to the right vendored design skill (impeccable, ui-ux-pro-max, emil-design-eng, design-motion-principles, redesign-existing-projects, design-taste-frontend, design-styles, web-design-guidelines, ...) so they reinforce each other instead of fighting. Also use when asked to "make it look less AI-generated / vibe-coded", "polish the UI", "audit the design", or "improve UX".
---

# Revenact Design: router and ground truth

Twenty design skills are vendored in `.claude/skills/`. Loaded blindly they
contradict each other (one bans `lucide-react`, one recommends a trust-blue
palette, one bans serif, one loads Plus Jakarta Sans). This file settles those
conflicts for **this** repo. Read it first, then load at most two or three of
the skills below for the task at hand.

## 1. Ground truth (wins over every vendored skill)

| Topic | Decision | Source |
|---|---|---|
| Product | B2B customer-success intelligence. Almost every surface is **Operate** mode (impeccable's term): dashboards, tables, detail panes, editors. Scanability and consistency outrank expression. | `.agents/workflows/Companybrainfrontendprd.md` |
| Stack | React 19 + TypeScript, Vite, Tailwind **v4** (`@theme` in `src/index.css`, no `tailwind.config.js` theme), Redux Toolkit, react-router 7, recharts, `@xyflow/react`, `lucide-react`. No Motion/Framer, no GSAP, no shadcn installed today. | `package.json` |
| Colour tokens | Defined **once** in `@theme` in `src/index.css` (Tier 0), aliased as `--bg-*`, `--text-*`, `--accent*`, `--border-*` (Tier 1) and `--color-surface-*`, `--color-text-*` (Tier 2). Use `bg-surface`, `text-ink`, `text-ink-muted`, `border-line`, `bg-accent`, etc. **Never introduce a raw hex in a component.** | `src/index.css` |
| Accent | **Monochrome primary** since 2026-09-21: `--color-accent` is ink-black on light and white on dark; text on it is `text-on-accent`. **Revenact Rose** survives only as `--color-brand` on the mark. Semantic: success emerald, warning amber, danger red, info blue, each with a `-dim` tint. | `src/index.css` |
| Theme | **Both modes.** Every colour is a token with a light value in `@theme` and a dark override under `html.dark` / `[data-theme="dark"]`; `ThemeSynchronizer` in `App.tsx` drives them from the settings slice. A new colour goes in both blocks or it is not done. | `src/index.css` |
| Fonts | `index.html` preloads **DM Serif Display** (display, italic allowed), **DM Mono** (numbers, code, badges), **Lato** (body). `.font-display` and `.font-mono-brand` in `src/index.css` apply the first two (since 2026-09-21); the body still uses the system stack, and moving it to Lato is its own decision. Do not load any other font. | `index.html`, `src/index.css` |
| Icons | **Lucide React exclusively.** 16px inline, 20px standalone action, 24px section header. `aria-label` when no adjacent text. No emoji as icons. Overrides every vendored rule that prefers Phosphor/Hugeicons. | `.agents/workflows/DesignCompanybrain.md` §5.3 |
| Radius | Dominant scale in the codebase: `rounded-lg` (default), `rounded-md` (compact controls), `rounded-xl` (cards/panels), `rounded-full` (pills, avatars). Pick from that scale; do not introduce `rounded-2xl`+ or `rounded-none` without a documented reason. | census of `src/**/*.tsx` |
| Elevation | `shadow-sm` is the norm; `shadow-md`/`lg` are exceptions for overlays. Prefer `border-line` over shadow for grouping. No card-in-card. | census of `src/**/*.tsx` |
| Motion budget | Tokens exist: `--dur-fast 120ms`, `--dur-base 200ms`, `--dur-slow 300ms`, `--ease-out`, `--ease-in`. Transitions 120-200ms, reveals 200-300ms, nothing over 400ms. `ease-out` for enters, `ease-in` for exits. **No bounce/elastic springs.** Global `prefers-reduced-motion` override already exists. Keyboard-initiated changes never animate. | `.agents/workflows/DesignCompanybrain.md` §6, `src/index.css` |
| Testing | Every UI change ships with unit + integration + e2e-style tests on Vitest/Testing Library. | `.claude/skills/testing/SKILL.md` |
| Compliance | Frontend is in scope for SOC 2 gates; no secrets, no PII in fixtures. | `.claude/skills/soc2-dev/SKILL.md` |

## 2. Route the task

| You are asked to... | Load | Notes |
|---|---|---|
| Design or redesign a product surface, run a design review, fix hierarchy/spacing/typography, add empty/error states | `impeccable` | Primary skill for product UI. Use its commands: `critique`, `audit`, `polish`, `layout`, `typeset`, `harden`, `onboard`, `distill`, `clarify`. Run `/impeccable init` once to write `PRODUCT.md`; run `/impeccable document` once to capture `DESIGN.md` from the token system. |
| Upgrade an existing screen that "looks AI-generated" | `redesign-existing-projects`, then `impeccable polish` | Its audit checklist (typography, colour, surfaces, states) is the fastest diagnostic. Apply its fixes **through existing tokens**, not new hex values. |
| Look up a UX rule, a11y criterion, chart type, form pattern, or React/Tailwind implementation guideline | `ui-ux-pro-max` | Run the search script (`--domain ux`, `--domain chart`, `--stack react`, `--stack html-tailwind`). **Do not** adopt palette/typography/style output from `--design-system`; those fields conflict with ground truth. Take the UX guidelines, chart recommendations, and pre-delivery checklist. |
| Review files against Vercel's Web Interface Guidelines | `web-design-guidelines` | Fetches the live guideline list; good final pass on a PR. |
| Decide whether something should animate, and how | `emil-design-eng` first, then `design-motion-principles` (weight: Emil primary, Jakub secondary, Jhey only for empty states) | Both agree with the motion budget above. Use `animate` for a single new animation, `improve-animations` to audit the codebase, `find-animation-opportunities` for a surface, `review-animations` on a PR, `animation-vocabulary` to phrase the request. |
| Implement motion in React | CSS transitions/keyframes first (see existing `animate-*` utilities in `src/index.css`); `motion-framer` only if `motion` is added to `package.json` | Adding a dependency is a decision for the user, not a side effect. |
| Choose a library for a UI task (toasts, command menu, virtualised list, number input, drag and drop) | `pick-ui-library` | Check `package.json` first; it is explicit-invoke only. |
| Build 2-4 alternatives of one component to compare | `prototype` | |
| Make the web app behave on phones (100vh, tap highlight, sticky hover, safe areas) | `mobile-native`, `impeccable adapt` | |
| Pick a visual direction by name ("more enterprise", "bento", "editorial") | `design-styles` | Vocabulary and do/don't only; palettes and fonts inside a preset are ignored. |
| Marketing / landing / auth / request-access pages | `design-taste-frontend` (dials roughly 5 / 3 / 4), `high-end-visual-design`, `design-styles/levels` | `design-taste-frontend` is explicitly **not for dashboards or data tables**; keep it to Persuade-mode surfaces. |
| Copilot / agent-run surfaces | `impeccable`, `design-styles/agentic`, `minimalist-ui` | |
| Apple-style fluidity references | `apple-design` | Translate to the motion budget; do not import its spring curves wholesale. |
| Agent keeps truncating or stubbing output | `full-output-enforcement` | |

## 3. Conflict resolutions (explicit)

- **Icons:** `design-taste-frontend`, `minimalist-ui`, `redesign-existing-projects` discourage Lucide. Overruled; Lucide is the house set.
- **Fonts:** several skills push Geist/Satoshi/Outfit or ban serif. Overruled; the house fonts are DM Serif Display, DM Mono, Lato. `impeccable`'s "no Inter/Arial/system default" rule *does* apply and is currently violated (see fonts gap above).
- **Palette:** `ui-ux-pro-max --design-system` and `design-styles` presets emit their own hex palettes. Never applied. Roles map to existing tokens.
- **Dark mode:** in scope since 2026-09-21; both modes are first-class (see ground truth).
- **Springs:** `motion-framer` and `apple-design` show spring transitions freely. House rule: no bounce; if a spring is used it must be critically damped and finish inside 300ms.
- **Em-dash ban** (`design-taste-frontend` §9.G) applies to **UI copy** you write. It does not require rewriting existing copy or comments as a side effect.
- **Dials:** for product surfaces use `design-taste-frontend`-style dials of roughly VARIANCE 3-4, MOTION 2-3, DENSITY 6-8. For marketing 5-6 / 3-4 / 3-4.
- **Skill runtimes:** `impeccable`'s launcher downloads a pinned engine binary to `~/.impeccable/bin/` on first run; `ui-ux-pro-max` needs `python3` (stdlib only). Neither installs anything into the project. If a launcher is unavailable, fall back to the skill's markdown references and say so.

## 4. The anti-slop bar for this product

Fail any of these and the work is not done:

1. Zero raw hex, rgb, or named colours in `src/**/*.tsx`; tokens only.
2. One primary, and it is monochrome; rose is the mark only. Semantic colours carry meaning only (status, trend, severity), never decoration.
3. Type hierarchy with at most four sizes per surface; numbers and IDs in DM Mono with `tabular-nums`; body line length capped around 65-75ch in reading surfaces.
4. No card inside a card. Group with `border-line`, `divide-y`, or whitespace. No gradient buttons, no purple, no glow, no glassmorphism on product surfaces. **One exception, by the owner's decision (2026-09-21): Communications and the Dashboard Ask rail** (the rail added by the owner's decision of 2026-09-24). Its cards are `.rv-card-glass` / `.rv-glass-inner` (tokens `--rv-glass-bg`, `--rv-glass-inner-bg`, both themes), translucent so the canvas glow shows through, as in the reference mail client. Do not "fix" it back to `rv-card`, and do not spread it to other routes without the same decision. The mailbox's category dots (`mailCategories.ts`) are a categorical key for filing, not status; they reuse the semantic tokens because a second palette was not worth its cost.
5. Every interactive element has default, hover, focus-visible, active, disabled, loading states, and a 44px touch target or `min-h-9` on desktop-only dense controls.
6. Every list/table/chart has designed empty, loading (skeleton matching layout, not spinner), and error states.
7. Motion stays inside the budget in §1, never on keyboard-driven changes, never on high-frequency actions (row hover, tab switch under 150ms), always honours reduced motion.
8. Labels above inputs, errors below inputs, no placeholder-as-label, sentence-case UI copy, no filler verbs ("seamless", "elevate", "unleash").
9. Charts: accessible colour pairs, legend or direct labels, tooltip, no colour-only meaning; use `src/components/shared/chartAnimation.ts` for entry timing.
10. Responsive: layout declared for 375 / 768 / 1024 / 1440; no horizontal scroll; `min-h-[100dvh]` never `h-screen`.
11. Tests added or updated per the `testing` skill; `npm run lint` and `npm run build` pass.

## 5. Recommended sequence for "improve the UI drastically"

Work surface by surface, one PR each. For each surface:

1. `impeccable critique <surface>` and `redesign-existing-projects` audit: list findings, no edits yet.
2. Fix in this order (largest visual lift per unit of risk): typography → spacing and rhythm → colour discipline → interactive and empty states → motion.
3. `impeccable polish <surface>`, then `web-design-guidelines` on the changed files, then `review-animations` if any motion changed.
4. Tests, lint, build. Screenshot desktop and 375px before/after in the PR.

Start with the shell (`Sidebar`, `Navbar`) and the dashboard landing since they frame every other page, and do the font-wiring fix first because it changes how every subsequent judgement reads.
