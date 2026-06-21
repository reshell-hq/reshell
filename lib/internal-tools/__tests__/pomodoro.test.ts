import { describe, expect, it, vi } from "vitest";
import {
  advancePomodoroPhase,
  BUILTIN_FOCUS_SPLITS,
  completeCountdown,
  createDefaultPomodoroState,
  createDefaultWorkspaceInternalTools,
  displayPomodoroSeconds,
  finishPomodoroInterval,
  formatFocusSplitSummary,
  formatPomodoroPhaseLabel,
  formatTimerSeconds,
  getFocusSplit,
  pausePomodoro,
  playChimeIfEnabled,
  remainingSeconds,
  resetPomodoro,
  resolveFocusSplit,
  setCustomFocusSplit,
  setPomodoroSplit,
  startCountdown,
  startPomodoro,
} from "../pomodoro";

describe("createDefaultPomodoroState", () => {
  it("starts in pomodoro mode with no countdown duration", () => {
    expect(createDefaultPomodoroState()).toMatchObject({
      mode: "pomodoro",
      countdownMinutes: null,
      chimeEnabled: false,
    });
  });
});

describe("startCountdown", () => {
  it("arms a single-interval timer for the requested minutes", () => {
    const now = new Date("2026-06-09T12:00:00.000Z");
    const started = startCountdown(createDefaultPomodoroState(), 30, now);

    expect(started).toMatchObject({
      mode: "countdown",
      countdownMinutes: 30,
      running: true,
      endsAt: "2026-06-09T12:30:00.000Z",
    });
  });

  it("rejects non-positive or fractional minute values", () => {
    const state = createDefaultPomodoroState();
    const now = new Date("2026-06-09T12:00:00.000Z");

    expect(startCountdown(state, 0, now)).toBe(state);
    expect(startCountdown(state, 1.5, now)).toBe(state);
  });
});

describe("startPomodoro", () => {
  it("sets endsAt from the active split work interval", () => {
    const now = new Date("2026-06-09T12:00:00.000Z");
    const started = startPomodoro(createDefaultPomodoroState(), now);

    expect(started.running).toBe(true);
    expect(started.endsAt).toBe("2026-06-09T12:25:00.000Z");
    expect(started.mode).toBe("pomodoro");
    expect(started.countdownMinutes).toBeNull();
  });

  it("replaces an active countdown with a pomodoro session", () => {
    const now = new Date("2026-06-09T12:00:00.000Z");
    const countdown = startCountdown(createDefaultPomodoroState(), 20, now);
    const started = startPomodoro(countdown, now);

    expect(started.mode).toBe("pomodoro");
    expect(started.countdownMinutes).toBeNull();
  });
});

describe("pausePomodoro", () => {
  it("stops a running timer without preserving endsAt", () => {
    const paused = pausePomodoro({
      ...createDefaultPomodoroState(),
      running: true,
      endsAt: "2026-06-09T12:25:00.000Z",
    });

    expect(paused.running).toBe(false);
    expect(paused.endsAt).toBeNull();
  });
});

describe("resetPomodoro", () => {
  it("returns to a fresh work phase while keeping split preferences", () => {
    const reset = resetPomodoro({
      ...createDefaultPomodoroState(),
      splitId: "short",
      running: true,
      phase: "shortBreak",
      endsAt: "2026-06-09T12:25:00.000Z",
      chimeEnabled: true,
      activeTaskId: "task-1",
    });

    expect(reset).toMatchObject({
      splitId: "short",
      phase: "work",
      running: false,
      endsAt: null,
      chimeEnabled: true,
      activeTaskId: "task-1",
    });
  });
});

describe("remainingSeconds", () => {
  it("counts down toward zero from endsAt", () => {
    const state = startPomodoro(
      createDefaultPomodoroState(),
      new Date("2026-06-09T12:00:00.000Z"),
    );

    expect(remainingSeconds(state, new Date("2026-06-09T12:10:00.000Z"))).toBe(900);
    expect(remainingSeconds(state, new Date("2026-06-09T12:30:00.000Z"))).toBe(0);
  });
});

describe("formatTimerSeconds", () => {
  it("renders mm:ss for the flyout display", () => {
    expect(formatTimerSeconds(125)).toBe("2:05");
  });
});

describe("formatPomodoroPhaseLabel", () => {
  it("names phases distinctly for the status line", () => {
    expect(formatPomodoroPhaseLabel("work")).toBe("Work");
    expect(formatPomodoroPhaseLabel("shortBreak")).toBe("Short break");
    expect(formatPomodoroPhaseLabel("longBreak")).toBe("Long break");
  });
});

describe("displayPomodoroSeconds", () => {
  it("previews countdown duration when idle in countdown mode", () => {
    const idleCountdown = {
      ...createDefaultPomodoroState(),
      mode: "countdown" as const,
      countdownMinutes: 45,
    };

    expect(
      displayPomodoroSeconds(
        idleCountdown,
        getFocusSplit("classic"),
        new Date("2026-06-09T12:00:00.000Z"),
      ),
    ).toBe(45 * 60);
  });

  it("previews the current phase duration when the timer is idle", () => {
    const split = getFocusSplit("classic");
    const idle = createDefaultPomodoroState();

    expect(
      displayPomodoroSeconds(idle, split, new Date("2026-06-09T12:00:00.000Z")),
    ).toBe(25 * 60);
  });

  it("counts down remaining time while the timer is running", () => {
    const split = getFocusSplit("classic");
    const running = startPomodoro(
      createDefaultPomodoroState(),
      new Date("2026-06-09T12:00:00.000Z"),
    );

    expect(
      displayPomodoroSeconds(running, split, new Date("2026-06-09T12:10:00.000Z")),
    ).toBe(900);
  });
});

describe("formatFocusSplitSummary", () => {
  it("shows work / short / long minutes for the active split", () => {
    expect(formatFocusSplitSummary(getFocusSplit("classic"))).toBe("25 / 5 / 15");
  });
});

describe("getFocusSplit", () => {
  it("falls back to the classic split for unknown ids", () => {
    expect(getFocusSplit("missing").id).toBe("classic");
  });
});

describe("BUILTIN_FOCUS_SPLITS", () => {
  it("includes a deep focus preset", () => {
    expect(BUILTIN_FOCUS_SPLITS).toContainEqual(
      expect.objectContaining({
        id: "deep",
        workMinutes: 50,
        shortBreakMinutes: 10,
      }),
    );
  });
});

describe("setPomodoroSplit", () => {
  it("persists the selected focus split without mutating the input", () => {
    const tools = createDefaultWorkspaceInternalTools();

    const updated = setPomodoroSplit(tools, "deep");

    expect(updated.pomodoro.splitId).toBe("deep");
    expect(tools.pomodoro.splitId).toBe("classic");
  });
});

describe("playChimeIfEnabled", () => {
  it("plays the chime only when enabled", () => {
    const play = vi.fn();

    playChimeIfEnabled(false, play);
    expect(play).not.toHaveBeenCalled();

    playChimeIfEnabled(true, play);
    expect(play).toHaveBeenCalledOnce();
  });
});

describe("setCustomFocusSplit", () => {
  it("stores a validated custom split and selects it", () => {
    const tools = createDefaultWorkspaceInternalTools();

    const updated = setCustomFocusSplit(tools, {
      label: "My split",
      workMinutes: 40,
      shortBreakMinutes: 8,
      longBreakMinutes: 16,
    });

    expect(updated.customFocusSplit).toEqual({
      id: "custom",
      label: "My split",
      workMinutes: 40,
      shortBreakMinutes: 8,
      longBreakMinutes: 16,
    });
    expect(updated.pomodoro.splitId).toBe("custom");
    expect(tools.customFocusSplit).toBeNull();
  });

  it("accepts any positive whole-minute values (no preset maximum)", () => {
    const tools = createDefaultWorkspaceInternalTools();

    const updated = setCustomFocusSplit(tools, {
      workMinutes: 120,
      shortBreakMinutes: 20,
      longBreakMinutes: 45,
    });

    expect(updated.customFocusSplit).toMatchObject({
      workMinutes: 120,
      shortBreakMinutes: 20,
      longBreakMinutes: 45,
      label: "Custom",
    });
  });

  it("rejects non-positive or fractional split minute values", () => {
    const tools = createDefaultWorkspaceInternalTools();

    expect(
      setCustomFocusSplit(tools, {
        workMinutes: 0,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
      }),
    ).toBe(tools);
    expect(
      setCustomFocusSplit(tools, {
        workMinutes: 25.5,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
      }),
    ).toBe(tools);
  });
});

describe("resolveFocusSplit", () => {
  it("returns the workspace custom split when custom is selected", () => {
    const custom = {
      id: "custom",
      label: "My split",
      workMinutes: 40,
      shortBreakMinutes: 8,
      longBreakMinutes: 16,
    };

    expect(resolveFocusSplit("custom", { customFocusSplit: custom })).toEqual(
      custom,
    );
  });
});

describe("completeCountdown", () => {
  it("stops a finished countdown without advancing pomodoro phases", () => {
    const running = startCountdown(
      createDefaultPomodoroState(),
      15,
      new Date("2026-06-09T12:00:00.000Z"),
    );
    const completed = completeCountdown(running);

    expect(completed).toMatchObject({
      mode: "countdown",
      countdownMinutes: 15,
      phase: "work",
      running: false,
      endsAt: null,
      completedWorkSessions: 0,
    });
  });
});

describe("finishPomodoroInterval", () => {
  it("auto-starts the next pomodoro phase after work completes", () => {
    const now = new Date("2026-06-09T12:25:00.000Z");
    const running = {
      ...createDefaultPomodoroState(),
      running: true,
      endsAt: now.toISOString(),
    };

    expect(finishPomodoroInterval(running, getFocusSplit("classic"), now)).toMatchObject({
      phase: "shortBreak",
      running: true,
      endsAt: "2026-06-09T12:30:00.000Z",
      completedWorkSessions: 1,
    });
  });

  it("stops a finished focus countdown without starting a break", () => {
    const now = new Date("2026-06-09T12:15:00.000Z");
    const running = startCountdown(
      createDefaultPomodoroState(),
      15,
      new Date("2026-06-09T12:00:00.000Z"),
    );

    expect(finishPomodoroInterval(running, getFocusSplit("classic"), now)).toMatchObject({
      mode: "countdown",
      running: false,
      endsAt: null,
    });
  });
});

describe("advancePomodoroPhase", () => {
  it("moves from work to short break after a work interval", () => {
    const advanced = advancePomodoroPhase(createDefaultPomodoroState());

    expect(advanced).toMatchObject({
      phase: "shortBreak",
      running: false,
      endsAt: null,
      completedWorkSessions: 1,
    });
  });

  it("uses a long break after four completed work sessions", () => {
    const advanced = advancePomodoroPhase({
      ...createDefaultPomodoroState(),
      completedWorkSessions: 3,
    });

    expect(advanced.phase).toBe("longBreak");
    expect(advanced.completedWorkSessions).toBe(4);
  });

  it("returns to work after a break interval", () => {
    const advanced = advancePomodoroPhase({
      ...createDefaultPomodoroState(),
      phase: "shortBreak",
      running: true,
      endsAt: "2026-06-09T12:05:00.000Z",
    });

    expect(advanced).toMatchObject({
      phase: "work",
      running: false,
      endsAt: null,
    });
  });
});
