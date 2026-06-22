import { playChime } from "./chime";
import type { FocusSplit, TimerPhase, TimerState } from "./types";

/**
 * Pure, timestamp-based timer transforms, ported from yeti-workspace's
 * `internal-tools/pomodoro.ts` and reshaped for the config + override model:
 * the split list is injected (resolved by the hook from `config.timer.splits`)
 * rather than read from a mutable library record. Zero React/DOM deps — the
 * portable core (ADR-0009). `start*` set `endsAt = now + minutes·60_000`;
 * remaining derives from `endsAt - now`, so a running timer survives reload.
 */

export const DEFAULT_SPLIT_ID = "classic";

/** Long break after this many completed work sessions. */
export const WORK_SESSIONS_BEFORE_LONG_BREAK = 4;

/** Built-in presets, used when config supplies no `timer.splits`. */
export const BUILTIN_FOCUS_SPLITS: FocusSplit[] = [
  { id: "classic", label: "Classic", workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 },
  { id: "short", label: "Short", workMinutes: 15, shortBreakMinutes: 3, longBreakMinutes: 10 },
  { id: "deep", label: "Deep focus", workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20 },
];

/**
 * Resolve a split by id from the provided list (config splits, else built-ins),
 * falling back to the first available split for an unknown id so the timer
 * always has a valid duration.
 */
export function getSplit(
  splitId: string,
  splits: FocusSplit[] = BUILTIN_FOCUS_SPLITS,
): FocusSplit {
  const pool = splits.length > 0 ? splits : BUILTIN_FOCUS_SPLITS;
  return pool.find((split) => split.id === splitId) ?? pool[0];
}

export function createDefaultTimerState(
  splitId: string = DEFAULT_SPLIT_ID,
  chimeEnabled = false,
): TimerState {
  return {
    mode: "pomodoro",
    splitId,
    phase: "work",
    countdownMinutes: null,
    running: false,
    endsAt: null,
    chimeEnabled,
    activeTaskId: null,
    completedWorkSessions: 0,
  };
}

export function phaseMinutes(phase: TimerPhase, split: FocusSplit): number {
  if (phase === "work") {
    return split.workMinutes;
  }
  if (phase === "shortBreak") {
    return split.shortBreakMinutes;
  }
  return split.longBreakMinutes;
}

function isValidCountdownMinutes(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/** Arm a single-interval countdown for `minutes`. Plan 012 reuses this signature. */
export function startCountdown(
  state: TimerState,
  minutes: number,
  now: Date,
): TimerState {
  if (!isValidCountdownMinutes(minutes)) {
    return state;
  }
  return {
    ...state,
    mode: "countdown",
    countdownMinutes: minutes,
    phase: "work",
    running: true,
    endsAt: new Date(now.getTime() + minutes * 60_000).toISOString(),
  };
}

/** Arm the current pomodoro phase for its full split interval. */
export function startPomodoro(
  state: TimerState,
  now: Date,
  split: FocusSplit,
): TimerState {
  const minutes = phaseMinutes(state.phase, split);
  return {
    ...state,
    mode: "pomodoro",
    countdownMinutes: null,
    running: true,
    endsAt: new Date(now.getTime() + minutes * 60_000).toISOString(),
  };
}

/**
 * Pause a running timer. ponytail: like yeti, this clears `endsAt` rather than
 * banking the elapsed time, so `resume` re-arms the current interval in full.
 * Ceiling — no mid-interval pause/resume. Upgrade path: persist the remaining
 * seconds on pause and offset `endsAt` from it on resume.
 */
export function pause(state: TimerState): TimerState {
  return { ...state, running: false, endsAt: null };
}

/** Re-arm the current phase/countdown from `now` (see `pause`). */
export function resume(state: TimerState, now: Date, split: FocusSplit): TimerState {
  if (state.mode === "countdown") {
    return startCountdown(state, state.countdownMinutes ?? phaseMinutes("work", split), now);
  }
  return startPomodoro(state, now, split);
}

/** Back to a fresh work phase, keeping split / chime / task preferences. */
export function reset(state: TimerState): TimerState {
  return {
    ...createDefaultTimerState(state.splitId, state.chimeEnabled),
    activeTaskId: state.activeTaskId,
  };
}

/**
 * Advance past a completed interval. A countdown simply stops. A finished work
 * interval increments the session count and routes to a long break every
 * `WORK_SESSIONS_BEFORE_LONG_BREAK`th session; a finished break returns to work.
 * Always lands stopped (`running: false`) so the user starts the next interval.
 */
export function advancePhase(state: TimerState): TimerState {
  if (state.mode === "countdown") {
    return { ...state, running: false, endsAt: null };
  }

  if (state.phase === "work") {
    const completedWorkSessions = state.completedWorkSessions + 1;
    const nextPhase: TimerPhase =
      completedWorkSessions % WORK_SESSIONS_BEFORE_LONG_BREAK === 0
        ? "longBreak"
        : "shortBreak";
    return { ...state, phase: nextPhase, running: false, endsAt: null, completedWorkSessions };
  }

  return { ...state, phase: "work", running: false, endsAt: null };
}

export function remainingSeconds(state: TimerState, now: Date): number {
  if (!state.running || !state.endsAt) {
    return 0;
  }
  const endsAtMs = new Date(state.endsAt).getTime();
  return Math.max(0, Math.floor((endsAtMs - now.getTime()) / 1000));
}

export function isPhaseComplete(state: TimerState, now: Date): boolean {
  return state.running && remainingSeconds(state, now) === 0;
}

/** Seconds to display: the live remaining when running, else the idle preview. */
export function displaySeconds(state: TimerState, split: FocusSplit, now: Date): number {
  if (state.running) {
    return remainingSeconds(state, now);
  }
  if (state.mode === "countdown" && state.countdownMinutes !== null) {
    return state.countdownMinutes * 60;
  }
  return phaseMinutes(state.phase, split) * 60;
}

/** Run `play` only when the chime is enabled (injectable for tests). */
export function playChimeIfEnabled(
  chimeEnabled: boolean,
  play: () => void = () => void playChime(),
): void {
  if (chimeEnabled) {
    play();
  }
}

export function formatTimerSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatPhaseLabel(phase: TimerPhase): string {
  if (phase === "work") {
    return "Work";
  }
  if (phase === "shortBreak") {
    return "Short break";
  }
  return "Long break";
}

export function formatModeLabel(state: TimerState): string {
  return state.mode === "countdown" ? "Countdown" : formatPhaseLabel(state.phase);
}

export function formatSplitSummary(split: FocusSplit): string {
  return `${split.workMinutes} / ${split.shortBreakMinutes} / ${split.longBreakMinutes}`;
}
