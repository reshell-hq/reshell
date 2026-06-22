# Plan 012: Tasks tool

> **Executor instructions**: Follow step by step, run every verification command, honor STOP conditions, update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 38ba3a9..HEAD -- lib/timer/ hooks/use-timer.ts` — plan 011 must be DONE.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/011
- **Category**: feature
- **Planned at**: commit `38ba3a9`, 2026-06-21

## Why this matters

Tasks are the second tool and pair with the timer (start focus on a task; countdown from its estimate). They are pure runtime state in the override — not in config. Full feature port: today/backlog split, estimates, reorder, complete.

## Current state

After 011: timer state in override; `useTimer` exposes `startPomodoro`/`startCountdown` and `TimerState.activeTaskId`. No tasks anywhere. yeti's `internal-tools/tasks.ts` + `FocusTask` are the reference.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Tests | `npm test` | all pass |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope:**

- `lib/tasks/types.ts` (create) — `FocusTask`: `id`, `title`, `estimateMinutes?`, `today` (today vs backlog), `completed`, `order` (number for ordering; simpler than yeti's fractional keys since this is local-only).
- `lib/tasks/tasks.ts` (create) — pure transforms: `addTask`, `editTitle`, `setEstimate`, `toggleToday`, `toggleCompleted`, `removeTask`, `moveTask` (reorder), `splitTodayBacklog(tasks)`.
- Extend `WorkspaceOverride` with `tasks?: FocusTask[]` (default `[]`).
- `lib/tasks/timer-link.ts` (create) — pure descriptors: `startFocusOnTask(timer, taskId)` (set `activeTaskId`, mode pomodoro, not running) and `startCountdownFromEstimate(timer, task)` (countdown from `estimateMinutes`; disabled if absent). These return timer-state patches consumed by `useTimer`.
- `hooks/use-tasks.ts` (create) — reads effective tasks, exposes actions that `patchOverride({ tasks })`, plus the two timer integrations (call into `useTimer`).
- `components/personal/tasks-slot.tsx` (create) — right-edge `Shell.Slot` (handle = checklist glyph / today count): today + backlog sections, add input, complete checkbox, estimate field, reorder (drag or up/down), and per-task "Focus" / "Start estimate" actions.
- `app/page.tsx` — mount `<TasksSlot />` on the right edge (sibling to the timer slot). Add command-bar verbs (`add task …`, `focus on …`).
- `lib/tasks/__tests__/{tasks,timer-link}.test.ts` (create) — port relevant yeti tests.
- `plans/README.md` — status row only.

**Out of scope:**

- Canvas focus-tasks widget (plan 014).
- Persisting tasks beyond the override (no config seeding — decided runtime-only).

## Steps

### Step 1: Pure task logic

- Port `tasks.ts` transforms; ordering via integer `order` with a `moveTask` that re-spaces or swaps. `splitTodayBacklog` partitions + sorts by `order`.

**Verify**: `tasks.test.ts` — add/complete/toggleToday/estimate/remove/reorder; today/backlog partition.

### Step 2: Timer link

- `timer-link.ts`: pure functions returning `Partial<TimerState>`. `startCountdownFromEstimate` returns null/throws-guard when no estimate.

**Verify**: `timer-link.test.ts` — focus sets activeTaskId + pomodoro + not running; estimate countdown sets countdownMinutes; no-estimate is disabled.

### Step 3: Hook + slot

- `useTasks()` persists via `patchOverride`; focus/estimate actions call `useTimer` setters with the patch. `TasksSlot` renders today/backlog with full controls.

### Step 4: Wiring

- Command-bar verbs for add/focus. Command-center status (optional: today count).

**Verify**: `npm run dev` — add tasks, toggle today/complete, set estimate, reorder; "Focus" arms the timer with that task; "Start estimate" launches a countdown; tasks persist per workspace and clear on reset.

## Test plan

- Unit: `tasks.test.ts`, `timer-link.test.ts`.
- Manual: full CRUD + reorder; timer integration; per-workspace isolation + reset.

## Done criteria

- [ ] Pure task logic + timer-link ported and unit-tested.
- [ ] `FocusTask[]` in the override; right-edge tasks slot with today/backlog, estimates, reorder, complete.
- [ ] Focus-on-task + countdown-from-estimate drive the timer.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` exit 0.
- [ ] `plans/README.md` row 012 → DONE.

## Commits (Conventional Commits — commit per atomic change; see README Conventions)

- `feat(tasks): add task transforms`
- `test(tasks): cover task transforms`
- `feat(tasks): add timer-link descriptors`
- `test(tasks): cover timer-link`
- `feat(tasks): add useTasks and tasks slot`

## Modularity & styling (ADR-0009)

- `lib/tasks/*` is React-free, tested, barrel-exported. `useTasks`/`TasksSlot` are app-decoupled; persistence only via the override interface.
- shadcn primitives for inputs/checkboxes/buttons; Tailwind utilities for layout; no global CSS.

## Skill passes (see README → Skill workflow)

- **improve**: `improve review-plan plans/012-tasks-tool.md` before starting.
- **impeccable** (UI = the tasks slot only): `impeccable polish "tasks slot"` before the final commit — today/backlog hierarchy, completion affordance, estimate input, empty state. Logic has no impeccable pass.
- **ponytail (full)**: integer `order` over fractional keys (simpler, local-only). Prefer up/down reorder before reaching for a drag-and-drop dependency. `ponytail:` the ordering approach. Pre-commit: `ponytail-review` the diff.

## STOP conditions

- Reorder UX (drag) fights the slot portal/measurement — STOP; fall back to up/down buttons (still satisfies "reorder") and report.

## Maintenance notes

- Tasks are override-only; "reset workspace" wipes them by design.
- Keep `FocusTask` and the timer-link descriptors stable — plan 014's focus-tasks widget reads them.
