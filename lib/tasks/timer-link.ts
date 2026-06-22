import type { TimerState } from "@/lib/timer";
import type { FocusTask } from "./types";

/**
 * Pure descriptors linking a task to the timer tool (CONTEXT: "Tool"). Each
 * returns an absolute `Partial<TimerState>` patch to merge over the current
 * timer; the `useTimer` seam applies it (and supplies `new Date()` for a
 * launched countdown), so this stays clock-free and unit-testable. Zero
 * React/DOM deps — the portable core (ADR-0009).
 */

/** Arm a focus session on a task: pomodoro mode, task active, not yet running. */
export function startFocusOnTask(taskId: string): Partial<TimerState> {
  return {
    activeTaskId: taskId,
    mode: "pomodoro",
    countdownMinutes: null,
    phase: "work",
    running: false,
    endsAt: null,
  };
}

/**
 * Arm a countdown from a task's estimate, or `null` when it has no usable
 * estimate (so callers disable the action). The hook launches it on apply.
 */
export function startCountdownFromEstimate(
  task: FocusTask,
): Partial<TimerState> | null {
  if (
    task.estimateMinutes === undefined ||
    !Number.isInteger(task.estimateMinutes) ||
    task.estimateMinutes <= 0
  ) {
    return null;
  }

  return {
    activeTaskId: task.id,
    mode: "countdown",
    countdownMinutes: task.estimateMinutes,
    phase: "work",
    running: false,
    endsAt: null,
  };
}
