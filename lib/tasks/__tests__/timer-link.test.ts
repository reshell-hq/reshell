import { describe, expect, it } from "vitest";
import { createDefaultTimerState } from "@/lib/timer";
import { startCountdownFromEstimate, startFocusOnTask } from "../timer-link";
import type { FocusTask } from "../types";

const baseTask: FocusTask = {
  id: "task-1",
  title: "Ship tasks",
  today: true,
  completed: false,
  order: 0,
};

describe("startFocusOnTask", () => {
  it("arms the task in pomodoro mode without running the timer", () => {
    const patch = startFocusOnTask(createDefaultTimerState(), "task-1");
    expect(patch).toEqual({
      activeTaskId: "task-1",
      mode: "pomodoro",
      countdownMinutes: null,
      phase: "work",
      running: false,
      endsAt: null,
    });
  });
});

describe("startCountdownFromEstimate", () => {
  it("arms a countdown from the estimate", () => {
    const patch = startCountdownFromEstimate(createDefaultTimerState(), {
      ...baseTask,
      estimateMinutes: 25,
    });
    expect(patch).toMatchObject({
      activeTaskId: "task-1",
      mode: "countdown",
      countdownMinutes: 25,
      running: false,
    });
  });

  it("returns null when the task has no usable estimate", () => {
    expect(
      startCountdownFromEstimate(createDefaultTimerState(), baseTask),
    ).toBeNull();
    expect(
      startCountdownFromEstimate(createDefaultTimerState(), {
        ...baseTask,
        estimateMinutes: 0,
      }),
    ).toBeNull();
  });
});
