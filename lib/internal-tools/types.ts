import type { FractionalOrderKey } from "@/lib/fractional-order/fractional-order";

/**
 * Internal-tool data model (CONTEXT: "Internal tool"). v1 ships two tools on the
 * right rim — the pomodoro timer and the focus-tasks list — and their state is a
 * first-class, per-workspace library record (CONTEXT: "Right rim"). Ported from
 * the pre-rewrite `src/internal-tools/types.ts`, trimmed to what pomodoro +
 * focus tasks need now (canvas-widget mirrors land in issue 09).
 */

/** The built-in tools on the right rim; fixed order in v1 (drag-reorder deferred). */
export type InternalToolId = "pomodoro" | "tasks";

export const INTERNAL_TOOL_IDS: readonly InternalToolId[] = ["pomodoro", "tasks"];

/** Pomodoro work/break phases (CONTEXT: "Focus split"). */
export type PomodoroPhase = "work" | "shortBreak" | "longBreak";

/** Pomodoro cycling vs single-interval countdown (CONTEXT: "Focus countdown"). */
export type PomodoroTimerMode = "pomodoro" | "countdown";

/** A pomodoro timing preset — work / short break / long break (CONTEXT: "Focus split"). */
export type FocusSplit = {
  id: string;
  label: string;
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
};

/**
 * The per-workspace pomodoro timer state. An active timer persists across reload
 * via the saved `endsAt` timestamp; `chimeEnabled` is off by default.
 */
export type PomodoroState = {
  mode: PomodoroTimerMode;
  splitId: string;
  phase: PomodoroPhase;
  countdownMinutes: number | null;
  running: boolean;
  /** ISO timestamp the active interval ends at, or null when idle/paused. */
  endsAt: string | null;
  chimeEnabled: boolean;
  /** The focus task this timer is tied to, or null (CONTEXT: "Focus task"). */
  activeTaskId: string | null;
  completedWorkSessions: number;
};

/**
 * A lightweight focus list item (CONTEXT: "Focus task"). Per-workspace,
 * local-only, ordered via fractional order. `today` drives the flyout's default
 * subset; `scheduledDate` (a calendar day, no time-of-day) is separate planning
 * metadata for the calendar timeline.
 */
export type FocusTask = {
  id: string;
  title: string;
  estimateMinutes?: number;
  /** Calendar day (YYYY-MM-DD), no time-of-day; optional planning metadata. */
  scheduledDate?: string;
  today: boolean;
  completed: boolean;
  orderKey: FractionalOrderKey;
};

/** The per-workspace internal-tools record stored on a workspace in the library. */
export type WorkspaceInternalTools = {
  pomodoro: PomodoroState;
  tasks: FocusTask[];
  customFocusSplit: FocusSplit | null;
};
