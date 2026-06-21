import { describe, expect, it } from "vitest";
import { createDefaultWorkspaceInternalTools } from "../pomodoro";
import {
  addFocusTask,
  clearActiveFocusTask,
  completeFocusTask,
  getActiveFocusTask,
  listBacklogTasks,
  listTodayTasks,
  moveFocusTask,
  setFocusTaskEstimate,
  setFocusTaskScheduledDate,
  setFocusTaskToday,
  startCountdownFromEstimate,
  startFocusOnTask,
  toggleFocusTaskCompletion,
} from "../tasks";

describe("focus tasks", () => {
  it("adds a today task and lists only open today items", () => {
    let tools = createDefaultWorkspaceInternalTools();
    tools = addFocusTask(tools, "Ship pomodoro", { id: "task-1" });

    expect(listTodayTasks(tools)).toMatchObject([
      { id: "task-1", title: "Ship pomodoro", today: true },
    ]);
  });

  it("ignores blank titles", () => {
    const tools = createDefaultWorkspaceInternalTools();
    expect(addFocusTask(tools, "   ", { id: "task-x" })).toBe(tools);
  });

  it("completes a task so it drops out of the today list", () => {
    let tools = addFocusTask(createDefaultWorkspaceInternalTools(), "Ship tasks", {
      id: "task-1",
    });
    tools = completeFocusTask(tools, "task-1");

    expect(listTodayTasks(tools)).toEqual([]);
  });

  it("moves a task off today while keeping it in the backlog (today subset)", () => {
    const tools = addFocusTask(createDefaultWorkspaceInternalTools(), "Ship tasks", {
      id: "task-1",
    });

    const updated = setFocusTaskToday(tools, "task-1", false);

    expect(listTodayTasks(updated)).toEqual([]);
    expect(listBacklogTasks(updated)).toMatchObject([
      { id: "task-1", title: "Ship tasks" },
    ]);
    expect(listTodayTasks(tools)).toHaveLength(1);
  });

  it("reorders tasks within the today list by slot index (fractional order)", () => {
    let tools = createDefaultWorkspaceInternalTools();
    tools = addFocusTask(tools, "First", { id: "task-1" });
    tools = addFocusTask(tools, "Second", { id: "task-2" });

    tools = moveFocusTask(tools, "task-2", 0);

    expect(listTodayTasks(tools).map((task) => task.id)).toEqual([
      "task-2",
      "task-1",
    ]);
  });

  it("persists optional minute estimates on add and edit", () => {
    let tools = addFocusTask(createDefaultWorkspaceInternalTools(), "Ship tasks", {
      id: "task-1",
      estimateMinutes: 30,
    });

    expect(listTodayTasks(tools)[0]?.estimateMinutes).toBe(30);

    tools = setFocusTaskEstimate(tools, "task-1", 45);

    expect(listTodayTasks(tools)[0]?.estimateMinutes).toBe(45);

    tools = setFocusTaskEstimate(tools, "task-1", undefined);
    expect(listTodayTasks(tools)[0]?.estimateMinutes).toBeUndefined();
  });

  it("sets and clears an optional scheduled date", () => {
    let tools = addFocusTask(createDefaultWorkspaceInternalTools(), "Plan launch", {
      id: "task-1",
    });

    tools = setFocusTaskScheduledDate(tools, "task-1", "2026-06-21");
    expect(listTodayTasks(tools)[0]?.scheduledDate).toBe("2026-06-21");

    tools = setFocusTaskScheduledDate(tools, "task-1", undefined);
    expect(listTodayTasks(tools)[0]?.scheduledDate).toBeUndefined();
  });

  it("accepts a scheduled date at creation time", () => {
    const tools = addFocusTask(createDefaultWorkspaceInternalTools(), "Plan launch", {
      id: "task-1",
      scheduledDate: "2026-07-01",
    });

    expect(listTodayTasks(tools)[0]?.scheduledDate).toBe("2026-07-01");
  });

  it("arms the active task without starting the pomodoro timer (start focus)", () => {
    const tools = addFocusTask(createDefaultWorkspaceInternalTools(), "Ship tasks", {
      id: "task-1",
    });

    const updated = startFocusOnTask(tools, "task-1");

    expect(updated.pomodoro).toMatchObject({
      activeTaskId: "task-1",
      phase: "work",
      running: false,
      endsAt: null,
    });
  });

  it("starts a focus countdown from a task estimate", () => {
    let tools = addFocusTask(createDefaultWorkspaceInternalTools(), "Ship tasks", {
      id: "task-1",
      estimateMinutes: 25,
    });
    const now = new Date("2026-06-09T12:00:00.000Z");

    tools = startCountdownFromEstimate(tools, "task-1", now);

    expect(tools.pomodoro).toMatchObject({
      mode: "countdown",
      activeTaskId: "task-1",
      countdownMinutes: 25,
      running: true,
      endsAt: "2026-06-09T12:25:00.000Z",
    });
  });

  it("refuses to start a countdown when the task has no estimate", () => {
    const tools = addFocusTask(createDefaultWorkspaceInternalTools(), "Ship tasks", {
      id: "task-1",
    });

    expect(
      startCountdownFromEstimate(tools, "task-1", new Date("2026-06-09T12:00:00.000Z")),
    ).toBe(tools);
  });

  it("clears the armed focus task without changing the timer", () => {
    let tools = addFocusTask(createDefaultWorkspaceInternalTools(), "Ship tasks", {
      id: "task-1",
    });
    tools = startFocusOnTask(tools, "task-1");

    const cleared = clearActiveFocusTask(tools);

    expect(cleared.pomodoro.activeTaskId).toBeNull();
    expect(cleared.pomodoro.running).toBe(false);
    expect(getActiveFocusTask(cleared)).toBeNull();
  });
});

describe("toggleFocusTaskCompletion", () => {
  it("marks an open task complete and can reopen it", () => {
    let tools = addFocusTask(createDefaultWorkspaceInternalTools(), "Ship tasks", {
      id: "task-1",
    });

    tools = toggleFocusTaskCompletion(tools, "task-1");
    expect(tools.tasks[0]?.completed).toBe(true);

    tools = toggleFocusTaskCompletion(tools, "task-1");
    expect(tools.tasks[0]?.completed).toBe(false);
  });
});
