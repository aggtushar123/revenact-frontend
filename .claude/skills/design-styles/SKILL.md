---
name: design-styles
description: Curated catalogue of named visual-style presets (clean, professional, enterprise, stitch, refined, minimal, bento, editorial, agentic, ...) vendored from bergside/awesome-design-skills. Use when the user names a style ("make it feel more enterprise", "give this a bento layout", "editorial hierarchy") or asks which visual direction fits a surface. Provides vocabulary, do/don't rules, and quality gates for each style. Palettes and fonts inside a preset are reference only; Revenact's own tokens in src/index.css always win.
---

# Design Styles (curated from awesome-design-skills)

Eighteen style presets from the [awesome-design-skills](https://github.com/bergside/awesome-design-skills)
registry, chosen for a B2B customer-success intelligence product. Each file in
`styles/` is that preset's original `SKILL.md`: brand intent, style foundations,
do/don't rules, and a QA checklist.

## How to use these

1. Read `revenact-design` first if you have not already. It owns the token,
   font, and icon decisions for this repo.
2. Pick the one preset that matches the surface and the user's words. Load only
   that file. Never apply two presets to one surface.
3. Take the **structure, rhythm, hierarchy, and do/don't rules** from the preset.
4. **Ignore the preset's hex codes and font names.** Every preset ships its own
   palette (several use `#8B5CF6` purple as secondary and Roboto/Poppins as
   fonts). Map the preset's *roles* (primary, surface, muted, danger) onto the
   existing `--color-*` tokens in `src/index.css` instead. Do not add new colours
   or load new fonts because a preset lists them.

## Catalogue

| Preset | File | Reach for it when |
|---|---|---|
| clean | `styles/clean.md` | Default for product pages; whitespace, legibility, limited palette |
| professional | `styles/professional.md` | Trust-first business surfaces, settings, billing |
| enterprise | `styles/enterprise.md` | Dense admin tooling, permissions, audit views |
| corporate | `styles/corporate.md` | Formal reporting, exports, executive summaries |
| stitch | `styles/stitch.md` | Data-driven workflows, drag-and-drop, canvas / pipeline builders |
| refined | `styles/refined.md` | Polishing a surface that is structurally fine but feels generic |
| minimal | `styles/minimal.md` | Focus modes, copilot, reading-heavy panels |
| modern | `styles/modern.md` | Fresh but conservative marketing or onboarding surfaces |
| sleek | `styles/sleek.md` | Compact toolbars, command palettes, dark chrome |
| premium | `styles/premium.md` | Pricing, upgrade prompts, plan comparison |
| spacious | `styles/spacious.md` | Empty states, onboarding, first-run flows |
| shadcn | `styles/shadcn.md` | Component-level conventions (radii, borders, focus rings) close to shadcn/ui |
| basic | `styles/basic.md` | Baseline sanity check: does this still work with zero styling flourish? |
| bento | `styles/bento.md` | Dashboard overview tiles, metric grids |
| flat | `styles/flat.md` | Charts and data visualisation chrome; no depth, no gradients |
| editorial | `styles/editorial.md` | Long-form: knowledge base, brain pages, release notes |
| agentic | `styles/agentic.md` | Copilot sessions, agent runs, delegated-task UI |
| levels | `styles/levels.md` | Conversion surfaces: login, signup, request-access, CTAs |

## Not vendored

The other 49 presets (glassmorphism, neon, brutalism, retro, claymorphism,
skeuomorphism, matrix, pacman, ...) do not fit this product. If one is genuinely
needed, pull it with `npx typeui.sh pull <slug>` rather than adding it here by
hand, and record why in the PR.

## Quality gate shared by every preset

- Every rule anchors to a token, a threshold, or an example; no adjectives alone.
- Required states on every interactive component: default, hover, focus-visible,
  active, disabled, loading, error.
- WCAG 2.2 AA, keyboard-first, visible focus, reduced-motion support, 44px targets.
- When aesthetics and accessibility conflict, accessibility wins.

Licence: MIT, (c) Bergside. Source: https://github.com/bergside/awesome-design-skills
