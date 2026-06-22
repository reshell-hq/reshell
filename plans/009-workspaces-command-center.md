# Plan 009: Workspaces + command center

> **Executor instructions**: Follow step by step, run every verification command, honor STOP conditions, update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 38ba3a9..HEAD -- hooks/use-reshell-state.tsx` — plan 007 must be DONE.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/007 (parallelizable with 008)
- **Category**: feature
- **Planned at**: commit `38ba3a9`, 2026-06-21

## Why this matters

Workspaces are the top-level context the user lives in. This plan makes multiple config workspaces switchable and adds the **command center**: a top-edge slot with the workspace switcher, ambient status, and runtime toggles for the active scene and which canvas widgets are enabled (persisted to override).

## Current state

After 007: provider exposes `config`, `activeWorkspace` (effective), `activeWorkspaceId`, `setActiveWorkspace`, `patchOverride`, `resetWorkspace`. After 008 (if landed): bookmark slots render. No workspace UI or top slot yet.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Tests | `npm test` | all pass |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope:**

- `lib/workspace/cycle.ts` (create) — pure `nextWorkspaceId(config, currentId, dir)` cycling in config order (wraps).
- `components/personal/command-center-slot.tsx` (create) — a top-edge `Shell.Slot` (with handle) whose content is:
  - **Workspace switcher**: clickable list of `config.workspaces`, active highlighted; click → `setActiveWorkspace(id)`.
  - **Ambient status**: clock (live), now-playing placeholder, timer placeholder (real data wired by 011/013; render graceful empty states now).
  - **Toggles**: scene picker (the four `SceneName`s) → `patchOverride({ scene })`; per-widget on/off switches → `patchOverride({ widgets })`; a **Reset** button → `resetWorkspace(activeWorkspaceId)`.
- `hooks/use-clock.ts` (create) — ticking time honoring `config.clock` (format/timezone), shared by command center + clock widget (plan 014).
- Wire `Tab` (or `config.shortcuts.cycleWorkspace`) to cycle workspaces when no input is focused. Keep this minimal; full command surface is plan 010.
- `app/page.tsx` — mount `<CommandCenterSlot />`.
- `lib/workspace/__tests__/cycle.test.ts` (create).
- `plans/README.md` — status row only.

**Out of scope:**

- The command bar / type-to-search (plan 010). Only the explicit `Tab` cycle + clickable switcher here.
- Real now-playing/timer data (placeholders until 011/013).
- The View-Transitions ripple on switch (nice-to-have; defer).

## Steps

### Step 1: Cycle helper

- `nextWorkspaceId(config, currentId, "next"|"prev")` returns the neighboring id, wrapping. Unknown current → first.

**Verify**: `cycle.test.ts` — wrap forward/back, single workspace returns itself, unknown id → first.

### Step 2: Command center slot

- Top-edge `Shell.Slot id="command-center"` with a handle (e.g. workspace name or a grid icon). Content sections as in Scope. Use the effective active workspace for current scene/widget toggle states.
- Toggles call `patchOverride`; switcher calls `setActiveWorkspace`; Reset calls `resetWorkspace`. Confirm overridden values visibly differ from config defaults and that Reset restores config.

### Step 3: Clock hook

- `useClock()` returns formatted time honoring `config.clock`; updates each second (interval, cleared on unmount). Timezone `"local"` or absent → local; IANA string → `Intl.DateTimeFormat` with that tz.

### Step 4: Tab cycle

- A keydown listener (document-level, ignore when `event.target` is an editable element) maps the cycle binding to `setActiveWorkspace(nextWorkspaceId(...))`.

**Verify**: `npm run dev` — switcher lists workspaces, click switches (bookmarks/scene change), Tab cycles, scene/widget toggles persist across reload, Reset reverts to config.

## Test plan

- Unit: `cycle.test.ts`.
- Manual: switch persists active workspace across reload (override); toggles persist; reset clears; Tab ignored while typing in a field.

## Done criteria

- [ ] Top command-center slot with workspace switcher, ambient status (clock live; now-playing/timer placeholders), scene + widget toggles, and reset.
- [ ] Switching workspace updates the whole shell and persists via override.
- [ ] Tab (or configured binding) cycles workspaces when not typing.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` exit 0.
- [ ] `plans/README.md` row 009 → DONE.

## Commits (Conventional Commits — commit per atomic change; see README Conventions)

- `feat(workspace): add workspace cycle helper`
- `test(workspace): cover cycle`
- `feat(command-center): add top slot with workspace switcher`
- `feat(command-center): add ambient status (clock) + placeholders`
- `feat(command-center): add scene/widget toggles and reset`
- `feat(workspace): wire Tab cycle`

## Modularity & styling (ADR-0009)

- `lib/workspace/cycle.ts` and `useClock` are pure/standalone with barrels. `CommandCenterSlot` takes everything via the provider hook — no `app/` coupling.
- Use **shadcn** primitives for the toggles/switches/buttons (`components/ui/`) rather than hand-rolled controls. Tailwind utilities for layout; no global CSS.

## Skill passes (see README → Skill workflow)

- **improve**: `improve review-plan plans/009-workspaces-command-center.md` before starting.
- **impeccable**: `impeccable shape "command center (workspace switcher + status + toggles)"` before building, `impeccable critique "command center"` before the final commit. This is a dense control surface — watch information architecture, hierarchy, and toggle affordance clarity.
- **ponytail (full)**: `cycle.ts` is a few lines; don't build a workspace "manager". Reuse shadcn switches/buttons rather than custom controls. Pre-commit: `ponytail-review` the diff.

## STOP conditions

- Switching workspace mid-animation corrupts the shell notch state — STOP; switching must be a discrete state change, never on the rAF path (ADR-0006).

## Maintenance notes

- Now-playing/timer status blocks are intentionally placeholder; plans 011/013 fill them in (don't block on real data).
- The scene picker writes `override.scene`; plan 014 reads it to choose the Scene component.
