# Plan 011: Timer tool

> **Executor instructions**: Follow step by step, run every verification command, honor STOP conditions, update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 38ba3a9..HEAD -- lib/override/ hooks/use-reshell-state.tsx` — plan 007 must be DONE.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MEDIUM
- **Depends on**: plans/007
- **Category**: feature
- **Planned at**: commit `38ba3a9`, 2026-06-21

## Why this matters

The timer is the first **tool**: a fixed right-edge slot for full control, with runtime state in the override. Full pomodoro + countdown port from yeti's clean, tested model — timestamp-based so a running timer survives reload. Plan 012 (tasks) and 014 (pomodoro widget) depend on this state.

## Current state

After 007: provider + override store; `config.timer` defines `splits`, `defaultSplitId`, `chimeEnabled`. Right edge is unused. yeti's `internal-tools/pomodoro.ts` + `internal-tools/types.ts` are the reference for the (portable, React-free) logic.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Tests | `npm test` | all pass |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope:**

- `lib/timer/types.ts` (create) — `TimerState` (port yeti `PomodoroState`): `mode "pomodoro"|"countdown"`, `splitId`, `phase "work"|"shortBreak"|"longBreak"`, `countdownMinutes`, `running`, `endsAt` (ISO), `chimeEnabled`, `activeTaskId` (added/used in 012), `completedWorkSessions`.
- `lib/timer/pomodoro.ts` (create) — port the pure transforms: `startPomodoro`, `startCountdown`, `pause`, `resume`, `reset`, `remainingSeconds(state, now)`, `isPhaseComplete(state, now)`, `advancePhase(state)` (long break every 4 work sessions). No React/DOM. Resolve the split from `config.timer.splits` by `splitId`.
- Extend `WorkspaceOverride` (plan 007) with `timer?: TimerState`; default (no override) derived from `config.timer.defaultSplitId` + `chimeEnabled`.
- `hooks/use-timer.ts` (create) — reads effective `TimerState`, exposes actions that `patchOverride({ timer })`, plus a `now` tick (interval) and a phase-advance effect: when `isPhaseComplete` and running, play chime (if enabled) and write `advancePhase`. Tick is discrete React state at ~1Hz, NOT the shell rAF path.
- `lib/timer/chime.ts` (create) — small WebAudio beep (no asset), guarded for autoplay.
- `components/personal/timer-slot.tsx` (create) — right-edge `Shell.Slot` (handle = timer glyph/remaining) with controls: mode toggle, split picker, start/pause/reset, remaining time, session count, chime toggle.
- `app/page.tsx` — mount `<TimerSlot />` on the right edge; wire the command-center timer status (plan 009 placeholder) + command-bar timer verbs (plan 010 stubs) to real state.
- `lib/timer/__tests__/pomodoro.test.ts` (create) — port yeti's timer tests.
- `plans/README.md` — status row only.

**Out of scope:**

- Task linking UI (plan 012) — keep `activeTaskId` in the type but no task UI here.
- Canvas pomodoro widget (plan 014).

## Steps

### Step 1: Pure timer logic

- Port `pomodoro.ts` + types. Timestamp-based: `start*` sets `endsAt = now + minutes*60_000`; `remainingSeconds` derives from `endsAt - now`. `advancePhase` cycles work→break→work, long break every 4th work session (`WORK_SESSIONS_BEFORE_LONG_BREAK = 4`).

**Verify**: `pomodoro.test.ts` — start/remaining/complete/advance, long-break cadence, countdown mode, reload restoration (state with past `endsAt` reads as complete).

### Step 2: Override + hook

- Extend `WorkspaceOverride.timer`. `useTimer()` returns `{ state, remaining, start, pause, resume, reset, setMode, setSplit, toggleChime }`, persisting via `patchOverride`. A 1s `now` interval drives `remaining` + the phase-advance effect.

### Step 3: Chime

- `playChime()` via a short oscillator; respects `chimeEnabled`; tolerant if AudioContext is blocked until first interaction.

### Step 4: Slot UI + wiring

- Right-edge `TimerSlot`. Fill in command-center status + command-bar verbs (`start timer`, `stop timer`).

**Verify**: `npm run dev` — start a 25/5, watch it count; reload mid-run restores remaining; phase advances + chimes; countdown mode works; state persists per workspace and resets on workspace reset.

## Test plan

- Unit: `pomodoro.test.ts` (ported).
- Manual: reload persistence; phase advance + chime; per-workspace isolation.

## Done criteria

- [ ] Pure timer logic ported + unit-tested (pomodoro + countdown, timestamp-based).
- [ ] `TimerState` in the override; right-edge timer slot with full controls.
- [ ] Running timer survives reload; phase advances; chime toggle works.
- [ ] Command-center status + command-bar verbs wired to real state.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` exit 0.
- [ ] `plans/README.md` row 011 → DONE.

## Commits (Conventional Commits — commit per atomic change; see README Conventions)

- `feat(timer): add timestamp-based pomodoro + countdown logic`
- `test(timer): port pomodoro tests`
- `feat(timer): add timer state to override and useTimer`
- `feat(timer): add chime`
- `feat(timer): add right-edge timer slot and wiring`

## Modularity & styling (ADR-0009)

- `lib/timer/*` is React-free, fully tested, and barrel-exported — the portable core the paid tiers import. `useTimer`/`TimerSlot` are app-decoupled and read/write only via the provider/override interface (no direct `localStorage`).
- shadcn primitives for the controls; Tailwind utilities for layout; no global CSS.

## Skill passes (see README → Skill workflow)

- **improve**: `improve review-plan plans/011-timer-tool.md` before starting.
- **impeccable** (UI = the timer slot only): `impeccable polish "timer slot"` before the final commit — readable remaining-time typography (tabular numbers), clear phase/state, calm motion. The pure timer logic has no impeccable pass.
- **ponytail (full)**: port yeti's clean timestamp-based logic as-is; don't add scheduling libs or a worker — a 1Hz interval + derived remaining is enough. `chime.ts` is a short oscillator, not an audio engine. Pre-commit: `ponytail-review` the diff.

## STOP conditions

- The 1Hz tick causes shell re-render/animation jank — STOP; scope the ticking state so it doesn't re-render the shell provider/animation path (ADR-0006).

## Maintenance notes

- `pomodoro.ts` stays React-free and fully tested — the portable core. UI/hook is thin.
- Plan 012 reuses `activeTaskId` + `startCountdown(estimate)`; keep those signatures stable.
