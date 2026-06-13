import { describe, expect, it } from "vitest";
import { initialKey } from "@/fractional-order/fractional-order";
import type { FocusTask } from "@/internal-tools/types";
import {
  canStartFocusCountdown,
  formatCanvasFocusTaskEstimate,
  listCanvasFocusTasks,
} from "./focus-tasks";

describe("formatCanvasFocusTaskEstimate", () => {
  it("formats a minute estimate for the canvas task row", () => {
    expect(formatCanvasFocusTaskEstimate(45)).toBe("45 min");
  });

  it("returns null when no estimate is set", () => {
    expect(formatCanvasFocusTaskEstimate(undefined)).toBeNull();
  });
});

describe("canStartFocusCountdown", () => {
  it("is true when the task has a positive minute estimate", () => {
    expect(canStartFocusCountdown({ estimateMinutes: 30 } as FocusTask)).toBe(true);
  });

  it("is false when the task has no estimate", () => {
    expect(canStartFocusCountdown({} as FocusTask)).toBe(false);
  });
});

describe("listCanvasFocusTasks", () => {
  it("returns today's tasks in order, including completed items", () => {
    const tasks = listCanvasFocusTasks({
      tasks: [
        {
          id: "done",
          title: "Done task",
          today: true,
          completed: true,
          orderKey: initialKey(),
        },
        {
          id: "backlog",
          title: "Backlog task",
          today: false,
          completed: false,
          orderKey: initialKey(),
        },
        {
          id: "second",
          title: "Second",
          estimateMinutes: 20,
          today: true,
          completed: false,
          orderKey: "a1",
        },
        {
          id: "first",
          title: "First",
          estimateMinutes: 10,
          today: true,
          completed: false,
          orderKey: "a0",
        },
      ],
      pomodoro: {
        splitId: "classic",
        phase: "work",
        running: false,
        endsAt: null,
        chimeEnabled: false,
        activeTaskId: null,
        completedWorkSessions: 0,
      },
      customFocusSplit: null,
    });

    expect(tasks.map((task) => task.id)).toEqual(["done", "first", "second"]);
  });
});
