# Design baseline

The committed design system for the personal edition. Tokens live in
`app/globals.css` (`:root` / `.dark`); this file is the human-readable spec.
Later UI plans (scenes, widgets, command center) build on this — no ad-hoc
colours, spacing, or motion.

## Palette (OKLCH)

A cool-neutral grey scale (hue `271`, very low chroma) with a single **indigo
brand accent**. OKLCH so lightness is perceptually uniform and dark mode is a
predictable lightness flip.

| Role | Light | Dark | Use |
|------|-------|------|-----|
| `background` | `oklch(0.994 0.001 271)` | `oklch(0.17 0.012 271)` | App canvas |
| `foreground` | `oklch(0.21 0.015 271)` | `oklch(0.97 0.003 271)` | Body text |
| `primary` | `oklch(0.51 0.17 271)` | `oklch(0.68 0.15 271)` | Brand accent, focus ring |
| `muted` / `muted-foreground` | `0.965` / `0.47` | `0.26` / `0.72` | Secondary surfaces & text |
| `border` | `oklch(0.91 0.006 271)` | `oklch(1 0 0 / 10%)` | Hairlines |
| `destructive` | `oklch(0.577 0.222 25.5)` | `oklch(0.704 0.191 22.216)` | Errors |

`chart-1..5` provide a coherent categorical ramp (indigo → blue → green → amber
→ red) for later data widgets.

### Contrast

All foreground-on-surface pairs target **WCAG AA ≥ 4.5:1**. The lightest text
token allowed on `background` is `muted-foreground` (L `0.47` light / `0.72`
dark) — never go lighter for text. Use `foreground` for primary copy.

## Type scale

System stack via `next/font`: **Inter** (`--font-sans`) for UI/body, **Geist
Mono** (`--font-mono`) for numerals/code (clock, timers). Tailwind's default
modular scale: `text-sm` (labels) · `text-base` (body) · `text-lg`/`xl`
(section titles) · `text-3xl`+ (hero). Headings use `font-semibold
tracking-tight`; body stays `font-normal`.

## Spacing rhythm

Tailwind 4px base unit. Component padding in multiples of `2` (`gap-2`, `p-3`,
`p-4`); section rhythm in `6`/`8`. Radius from the `--radius` token
(`radius-sm`…`radius-4xl`) — never hard-coded pixel corners.

## Motion

- **Intentional, not decorative.** Animate to explain state change (slot open,
  workspace switch), not for flourish. The shell's notch animation is the
  signature motion; new motion should feel consistent with it.
- Short and eased: ~150–250ms, ease-out for enter.
- **`prefers-reduced-motion: reduce` is honoured globally** (reset in
  `globals.css` collapses animation/transition durations). Never ship motion
  that ignores it.

## Hard rules (ADR-0009)

- `globals.css` = tokens / `@theme` / resets only. No component styles.
- Tailwind utilities first; colocated CSS Modules for keyframes/complex
  selectors; shadcn primitives (`components/ui/`) for form controls.
- Scene visual identity lives in the scene component + its `ShellTheme`, not in
  global CSS.
