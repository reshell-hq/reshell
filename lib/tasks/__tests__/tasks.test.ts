import { describe, expect, it } from "vitest";
import {
  addTask,
  editTitle,
  moveTask,
  removeTask,
  setEstimate,
  splitTodayBacklog,
  toggleCompleted,
  toggleToday,
} from "../tasks";
import type { FocusTask } from "../types";

function seed(): FocusTask[] {
  let tasks: FocusTask[] = [];
  tasks = addTask(tasks, "First", { id: "task-1" });
  tasks = addTask(tasks, "Second", { id: "task-2" });
  return tasks;
}

describe("addTask", () => {
  it("appends a today task with a trimmed title and increasing order", () => {
    const tasks = seed();
    expect(tasks).toMatchObject([
      { id: "task-1", title: "First", today: true, completed: false, order: 0 },
      { id: "task-2", title: "Second", today: true, completed: false, order: 1 },
    ]);
  });

  it("ignores blank titles", () => {
    const tasks = seed();
    expect(addTask(tasks, "   ", { id: "task-x" })).toBe(tasks);
  });

  it("stores a valid estimate and drops an invalid one", () => {
    const withEstimate = addTask([], "Ship", { id: "a", estimateMinutes: 30 });
    expect(withEstimate[0].estimateMinutes).toBe(30);

    const noEstimate = addTask([], "Ship", { id: "b", estimateMinutes: 0 });
    expect(noEstimate[0].estimateMinutes).toBeUndefined();
  });
});

describe("editTitle", () => {
  it("renames a task but ignores a blank title", () => {
    let tasks = seed();
    tasks = editTitle(tasks, "task-1", "  Renamed  ");
    expect(tasks.find((t) => t.id === "task-1")?.title).toBe("Renamed");
    expect(editTitle(tasks, "task-1", "  ")).toBe(tasks);
  });
});

describe("setEstimate", () => {
  it("sets, clears, and rejects invalid estimates", () => {
    let tasks = seed();
    tasks = setEstimate(tasks, "task-1", 45);
    expect(tasks.find((t) => t.id === "task-1")?.estimateMinutes).toBe(45);

    expect(setEstimate(tasks, "task-1", 45)).toBe(tasks);
    expect(setEstimate(tasks, "task-1", -5)).toBe(tasks);

    tasks = setEstimate(tasks, "task-1", undefined);
    expect(tasks.find((t) => t.id === "task-1")?.estimateMinutes).toBeUndefined();
    expect(setEstimate(tasks, "task-1", undefined)).toBe(tasks);
  });
});

describe("toggleToday / toggleCompleted / removeTask", () => {
  it("moves a task to the backlog", () => {
    const tasks = toggleToday(seed(), "task-1");
    const { today, backlog } = splitTodayBacklog(tasks);
    expect(today.map((t) => t.id)).toEqual(["task-2"]);
    expect(backlog.map((t) => t.id)).toEqual(["task-1"]);
  });

  it("flips completion both ways", () => {
    let tasks = toggleCompleted(seed(), "task-1");
    expect(tasks.find((t) => t.id === "task-1")?.completed).toBe(true);
    tasks = toggleCompleted(tasks, "task-1");
    expect(tasks.find((t) => t.id === "task-1")?.completed).toBe(false);
  });

  it("removes a task", () => {
    const tasks = removeTask(seed(), "task-1");
    expect(tasks.map((t) => t.id)).toEqual(["task-2"]);
  });
});

describe("moveTask", () => {
  it("reorders within the today list by swapping order keys", () => {
    let tasks = seed();
    tasks = moveTask(tasks, "task-2", "up");
    expect(splitTodayBacklog(tasks).today.map((t) => t.id)).toEqual([
      "task-2",
      "task-1",
    ]);

    tasks = moveTask(tasks, "task-2", "down");
    expect(splitTodayBacklog(tasks).today.map((t) => t.id)).toEqual([
      "task-1",
      "task-2",
    ]);
  });

  it("is a no-op at the list edges and for an unknown id", () => {
    const tasks = seed();
    expect(moveTask(tasks, "task-1", "up")).toBe(tasks);
    expect(moveTask(tasks, "task-2", "down")).toBe(tasks);
    expect(moveTask(tasks, "nope", "up")).toBe(tasks);
  });

  it("reorders within the task's own list only", () => {
    let tasks = seed();
    tasks = toggleToday(tasks, "task-2"); // task-2 -> backlog
    tasks = addTask(tasks, "Third", { id: "task-3" }); // today
    // task-1 and task-3 are the today list; moving task-3 up swaps with task-1.
    tasks = moveTask(tasks, "task-3", "up");
    expect(splitTodayBacklog(tasks).today.map((t) => t.id)).toEqual([
      "task-3",
      "task-1",
    ]);
    expect(splitTodayBacklog(tasks).backlog.map((t) => t.id)).toEqual(["task-2"]);
  });
});

describe("splitTodayBacklog", () => {
  it("partitions by list and sorts each by order", () => {
    const { today, backlog } = splitTodayBacklog(seed());
    expect(today.map((t) => t.id)).toEqual(["task-1", "task-2"]);
    expect(backlog).toEqual([]);
  });
});
