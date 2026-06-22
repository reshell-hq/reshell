# Plan 014: Scenes + canvas widgets

> **Executor instructions**: Follow step by step, run every verification command, honor STOP conditions, update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 38ba3a9..HEAD -- hooks/ components/personal/` — plans 011, 012, 013 must be DONE (the tool widgets read their state).

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MEDIUM
- **Depends on**: plans/011, plans/012, plans/013
- **Category**: feature
- **Planned at**: commit `38ba3a9`, 2026-06-21

## Why this matters

The canvas is the ambient centre of the station. This plan builds the six **canvas widgets** and the **Scene** system (ADR-0008): a scene is a self-contained React component owning both its look (palette → `ShellTheme` + app CSS vars) and the arrangement of the enabled widgets. Config names a workspace's scene + which widgets are enabled; the command center switches scene/widgets at runtime via override.

## Current state

After 011–013: timer, tasks, and global music state exist via `useTimer`/`useTasks`/`useMusic`. `Shell` accepts a `theme: ShellTheme` prop (`lib/shell/theme.ts`); `app/globals.css` holds oklch app tokens. `Shell.Content` currently shows the workspace name (plan 007). The command center (plan 009) has scene picker + widget toggles writing `override.scene`/`override.widgets`.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Tests | `npm test` | all pass |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope:**

- `components/widgets/` (create) — one component per `CanvasWidgetId`:
  - `clock-widget.tsx` (uses `useClock`), `welcome-widget.tsx` (`config.displayName` + greeting), `quote-widget.tsx` (random from `config.quotes`), `now-playing-widget.tsx` (`useMusic`), `pomodoro-widget.tsx` (`useTimer`; visible while running), `focus-tasks-widget.tsx` (`useTasks`; today list).
  - Each widget is presentation-only and reads its tool hook; renders nothing/empty-state when it has no data.
- `lib/scene/types.ts` (create) — `SceneProps = { enabledWidgets: CanvasWidgetId[]; widgets: Record<CanvasWidgetId, ReactNode> }` and `Scene = { name: SceneName; shellTheme: Partial<ShellTheme>; Canvas: (props: SceneProps) => ReactNode }`.
- `components/scenes/` (create) — the four scenes: `default-scene.tsx`, `editorial-scene.tsx`, `meridian-scene.tsx`, `atelier-scene.tsx`. Each defines a `shellTheme` (palette → shell/canvas/border/panel colours) and a `Canvas` that arranges the enabled widgets in its own layout. Keep them genuinely distinct but simple.
- `components/scenes/registry.ts` (create) — `scenes: Record<SceneName, Scene>` + `getScene(name)`.
- `components/personal/canvas.tsx` (create) — reads effective `{ scene, widgets }`, builds the enabled-widget node map, picks `getScene(scene)`, renders `scene.Canvas`. Applies `scene.shellTheme` to `<Shell theme={…}>` and any app CSS vars.
- `app/page.tsx` — render `<Canvas />` inside `<Shell.Content>` and pass the active scene's `shellTheme` to `<Shell>`. Replace the plan-007 placeholder.
- Visibility rules (port yeti): hide `clock` while a timer is running if the scene shows the pomodoro widget; `pomodoro` widget only while running; etc. — encode as a small pure `visibleWidgets(enabled, toolState)` in `lib/scene/visibility.ts` (create, tested).
- `lib/scene/__tests__/visibility.test.ts` (create).
- `plans/README.md` — status row only.

**Out of scope:**

- Per-widget style overrides (dropped, ADR-0008 — scenes encode styling).
- Free pixel positioning (scenes own arrangement).
- A scene-authoring guide doc (optional follow-up).

## Steps

### Step 1: Widgets

- Build the six widgets reading their hooks. Each handles empty/disabled gracefully (e.g. `now-playing` with nothing selected renders nothing). Pure presentation; no persistence.

### Step 2: Scene contract + registry

- Define `Scene`/`SceneProps`; implement the four scenes. Each exports a `shellTheme` (map a palette to `shellColor`/`canvasColor`/`borderColor`/`panelColor` + radius/gutter) and a `Canvas` arranging `props.widgets[id]` for `props.enabledWidgets`. `registry.ts` exposes them by name; unknown name → `default`.

### Step 3: Visibility

- `visibleWidgets(enabledIds, { timerRunning })` applies the port-from-yeti rules and returns the final ordered id list the scene receives.

**Verify**: `visibility.test.ts` — pomodoro shown only while running; clock hidden when pomodoro visible; etc.

### Step 4: Canvas host + theme wiring

- `<Canvas/>` resolves effective scene + enabled widgets (config ∪ override), computes visible widgets, builds the node map, renders the scene. The chosen scene's `shellTheme` is passed to `<Shell theme>` (so the rim/canvas/panel recolour) and applied to app CSS vars where widgets rely on them.

**Verify**: `npm run dev` — each scene looks + lays out distinctly; switching scene from the command center recolours the shell and rearranges widgets and persists; toggling a widget off removes it; pomodoro widget appears when the timer runs; now-playing reflects music; tasks widget shows today's tasks. Switching workspaces applies that workspace's scene.

## Test plan

- Unit: `visibility.test.ts`.
- Manual: all four scenes; scene/widget toggles persist + reset; widgets reflect live tool state; per-workspace scene.

## Done criteria

- [ ] Six canvas widgets built, each reading its tool/config and handling empty states.
- [ ] Four self-contained scenes (look + arrangement) + registry; each applies a `ShellTheme`.
- [ ] `<Canvas/>` renders the effective scene with enabled+visible widgets and themes the shell.
- [ ] Command-center scene picker + widget toggles drive it and persist (override); reset reverts to config.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` exit 0.
- [ ] `plans/README.md` row 014 → DONE.

## Commits (Conventional Commits — commit per atomic change; see README Conventions)

- `feat(widgets): add canvas widgets (clock, welcome, quote, now-playing, pomodoro, focus-tasks)`
- `feat(scene): add Scene contract and registry`
- `feat(scene): add default/editorial/meridian/atelier scenes`
- `feat(scene): add visibility rules` + `test(scene): cover visibility`
- `feat(scene): add Canvas host and shell theme wiring`

## Modularity & styling (ADR-0009)

- Widgets, scenes, and the registry each export a barrel; widgets are presentation-only and read tool hooks (no `app/` coupling). Scenes are the reuse unit the paid tiers can extend.
- **Each scene's visual identity lives in the scene component** — its `ShellTheme` + Tailwind utilities, plus a **colocated CSS Module** (`*-scene.module.css`) for keyframes/complex selectors. **Nothing scene-specific goes in `globals.css`** (this is the exact failure mode from the previous attempt). `globals.css` stays tokens/`@theme`/resets only.
- Use shadcn primitives for any controls inside widgets; don't hand-roll.

## Skill passes (see README → Skill workflow)

This is the most UI-heavy plan — impeccable carries it.

- **improve**: `improve review-plan plans/014-scenes-canvas-widgets.md` before starting.
- **impeccable**: `impeccable shape "canvas scene + widgets"` per scene before building; `impeccable craft` the scenes against `DESIGN.md`; then `impeccable critique`/`polish` each scene before its commit. Each scene must pass the AI-slop test (distinct, intentional — not four variations of the same grid), honor motion + `prefers-reduced-motion`, and respect the absolute bans. Use `impeccable animate` for widget/scene motion.
- **ponytail (full)**: six small presentation widgets + four scene components — no widget framework, no plugin loader, no generic zone engine (scenes own arrangement directly). `visibility.ts` is a small pure function. Pre-commit: `ponytail-review` the diff (watch for repeated scene boilerplate that should be shared, but don't abstract before the second use).

## STOP conditions

- A scene's `shellTheme` and the app CSS-var tokens conflict so the rim/canvas mis-colour — STOP and reconcile the theming layers (Shell `ShellTheme` vs `globals.css`) before adding more scenes; document the mapping.

## Maintenance notes

- Adding a scene = a new file in `components/scenes/` + a registry entry + a `SceneName` union member. No config schema change beyond allowing the new name.
- Widgets are presentation-only; all state lives in the tool hooks (011–013) and config — keep it that way.
