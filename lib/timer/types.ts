/**
 * The timer tool's data model (CONTEXT: "Tool"), ported from yeti-workspace's
 * `internal-tools` `PomodoroState`. Pure types — zero React/DOM deps — so this
 * is part of the portable core the paid tiers import (ADR-0009).
 *
 * Timestamp-based: a running timer persists across reload via the saved
 * `endsAt` ISO instant; `remainingSeconds` derives from it, so a reload with a
 * past `endsAt` reads as already complete.
 */

/** Pomodoro work/break phases. */
export type TimerPhase = "work" | "shortBreak" | "longBreak";

/** Cycling pomodoro vs a single-interval countdown. */
export type TimerMode = "pomodoro" | "countdown";

/** A pomodoro timing preset — work / short break / long break minutes. */
export type FocusSplit = {
  id: string;
  label: string;
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
};

/**
 * The per-workspace timer state, persisted in the override (ADR-0007). An active
 * timer survives reload via `endsAt`; `chimeEnabled` is off by default.
 */
export type TimerState = {
  mode: TimerMode;
  splitId: string;
  phase: TimerPhase;
  /** Minutes for the active countdown, or null in pomodoro mode / idle. */
  countdownMinutes: number | null;
  running: boolean;
  /** ISO instant the active interval ends at, or null when idle/paused. */
  endsAt: string | null;
  chimeEnabled: boolean;
  /** The task this timer is tied to, or null. Kept stable for plan 012. */
  activeTaskId: string | null;
  completedWorkSessions: number;
};
