import { describe, expect, it, vi } from "vitest";
import {
  advancePhase,
  BUILTIN_FOCUS_SPLITS,
  createDefaultTimerState,
  displaySeconds,
  formatPhaseLabel,
  formatSplitSummary,
  formatTimerSeconds,
  getSplit,
  isPhaseComplete,
  pause,
  playChimeIfEnabled,
  remainingSeconds,
  reset,
  resume,
  startCountdown,
  startPomodoro,
} from "../pomodoro";

const CLASSIC = getSplit("classic");

describe("createDefaultTimerState", () => {
  it("starts in pomodoro mode with no countdown duration and chime off", () => {
    expect(createDefaultTimerState()).toMatchObject({
      mode: "pomodoro",
      phase: "work",
      splitId: "classic",
      countdownMinutes: null,
      chimeEnabled: false,
      running: false,
      endsAt: null,
      activeTaskId: null,
      completedWorkSessions: 0,
    });
  });
});

describe("startCountdown", () => {
  it("arms a single-interval timer for the requested minutes", () => {
    const now = new Date("2026-06-09T12:00:00.000Z");
    const started = startCountdown(createDefaultTimerState(), 30, now);

    expect(started).toMatchObject({
      mode: "countdown",
      countdownMinutes: 30,
      running: true,
      endsAt: "2026-06-09T12:30:00.000Z",
    });
  });

  it("rejects non-positive or fractional minute values", () => {
    const state = createDefaultTimerState();
    const now = new Date("2026-06-09T12:00:00.000Z");

    expect(startCountdown(state, 0, now)).toBe(state);
    expect(startCountdown(state, 1.5, now)).toBe(state);
  });
});

describe("startPomodoro", () => {
  it("sets endsAt from the active split work interval", () => {
    const now = new Date("2026-06-09T12:00:00.000Z");
    const started = startPomodoro(createDefaultTimerState(), now, CLASSIC);

    expect(started.running).toBe(true);
    expect(started.endsAt).toBe("2026-06-09T12:25:00.000Z");
    expect(started.mode).toBe("pomodoro");
    expect(started.countdownMinutes).toBeNull();
  });

  it("replaces an active countdown with a pomodoro session", () => {
    const now = new Date("2026-06-09T12:00:00.000Z");
    const countdown = startCountdown(createDefaultTimerState(), 20, now);
    const started = startPomodoro(countdown, now, CLASSIC);

    expect(started.mode).toBe("pomodoro");
    expect(started.countdownMinutes).toBeNull();
  });

  it("uses the supplied split's work minutes", () => {
    const now = new Date("2026-06-09T12:00:00.000Z");
    const deep = getSplit("deep");
    const started = startPomodoro({ ...createDefaultTimerState(), splitId: "deep" }, now, deep);

    expect(started.endsAt).toBe("2026-06-09T12:50:00.000Z");
  });
});

describe("pause", () => {
  it("stops a running timer without preserving endsAt", () => {
    const paused = pause({
      ...createDefaultTimerState(),
      running: true,
      endsAt: "2026-06-09T12:25:00.000Z",
    });

    expect(paused.running).toBe(false);
    expect(paused.endsAt).toBeNull();
  });
});

describe("resume", () => {
  it("re-arms the current pomodoro phase from now", () => {
    const now = new Date("2026-06-09T12:00:00.000Z");
    const resumed = resume(
      { ...createDefaultTimerState(), phase: "shortBreak" },
      now,
      CLASSIC,
    );

    expect(resumed.running).toBe(true);
    expect(resumed.endsAt).toBe("2026-06-09T12:05:00.000Z");
    expect(resumed.phase).toBe("shortBreak");
  });

  it("re-arms a countdown for its remembered minutes", () => {
    const now = new Date("2026-06-09T12:00:00.000Z");
    const idle = { ...createDefaultTimerState(), mode: "countdown" as const, countdownMinutes: 12 };

    expect(resume(idle, now, CLASSIC).endsAt).toBe("2026-06-09T12:12:00.000Z");
  });
});

describe("reset", () => {
  it("returns to a fresh work phase while keeping split / chime / task", () => {
    const value = reset({
      ...createDefaultTimerState(),
      splitId: "short",
      running: true,
      phase: "shortBreak",
      endsAt: "2026-06-09T12:25:00.000Z",
      chimeEnabled: true,
      activeTaskId: "task-1",
      completedWorkSessions: 3,
    });

    expect(value).toMatchObject({
      splitId: "short",
      phase: "work",
      running: false,
      endsAt: null,
      chimeEnabled: true,
      activeTaskId: "task-1",
      completedWorkSessions: 0,
    });
  });
});

describe("remainingSeconds", () => {
  it("counts down toward zero from endsAt", () => {
    const state = startPomodoro(createDefaultTimerState(), new Date("2026-06-09T12:00:00.000Z"), CLASSIC);

    expect(remainingSeconds(state, new Date("2026-06-09T12:10:00.000Z"))).toBe(900);
    expect(remainingSeconds(state, new Date("2026-06-09T12:30:00.000Z"))).toBe(0);
  });

  it("reads a reloaded state with a past endsAt as complete (zero remaining)", () => {
    const state = startPomodoro(createDefaultTimerState(), new Date("2026-06-09T12:00:00.000Z"), CLASSIC);

    // Simulate a reload an hour later: the saved endsAt is in the past.
    expect(remainingSeconds(state, new Date("2026-06-09T13:00:00.000Z"))).toBe(0);
  });

  it("is zero when idle or paused", () => {
    expect(remainingSeconds(createDefaultTimerState(), new Date())).toBe(0);
  });
});

describe("isPhaseComplete", () => {
  it("is true only for a running timer whose interval has elapsed", () => {
    const state = startPomodoro(createDefaultTimerState(), new Date("2026-06-09T12:00:00.000Z"), CLASSIC);

    expect(isPhaseComplete(state, new Date("2026-06-09T12:10:00.000Z"))).toBe(false);
    expect(isPhaseComplete(state, new Date("2026-06-09T12:25:00.000Z"))).toBe(true);
    expect(isPhaseComplete(pause(state), new Date("2026-06-09T12:25:00.000Z"))).toBe(false);
  });
});

describe("advancePhase", () => {
  it("moves from work to short break after a work interval", () => {
    const advanced = advancePhase(createDefaultTimerState());

    expect(advanced).toMatchObject({
      phase: "shortBreak",
      running: false,
      endsAt: null,
      completedWorkSessions: 1,
    });
  });

  it("uses a long break after four completed work sessions", () => {
    const advanced = advancePhase({ ...createDefaultTimerState(), completedWorkSessions: 3 });

    expect(advanced.phase).toBe("longBreak");
    expect(advanced.completedWorkSessions).toBe(4);
  });

  it("returns to work after a break interval", () => {
    const advanced = advancePhase({
      ...createDefaultTimerState(),
      phase: "shortBreak",
      running: true,
      endsAt: "2026-06-09T12:05:00.000Z",
    });

    expect(advanced).toMatchObject({ phase: "work", running: false, endsAt: null });
  });

  it("stops a finished countdown without advancing pomodoro phases", () => {
    const running = startCountdown(createDefaultTimerState(), 15, new Date("2026-06-09T12:00:00.000Z"));
    const advanced = advancePhase(running);

    expect(advanced).toMatchObject({
      mode: "countdown",
      countdownMinutes: 15,
      phase: "work",
      running: false,
      endsAt: null,
      completedWorkSessions: 0,
    });
  });
});

describe("displaySeconds", () => {
  it("previews countdown duration when idle in countdown mode", () => {
    const idleCountdown = { ...createDefaultTimerState(), mode: "countdown" as const, countdownMinutes: 45 };

    expect(displaySeconds(idleCountdown, CLASSIC, new Date("2026-06-09T12:00:00.000Z"))).toBe(45 * 60);
  });

  it("previews the current phase duration when the timer is idle", () => {
    expect(displaySeconds(createDefaultTimerState(), CLASSIC, new Date("2026-06-09T12:00:00.000Z"))).toBe(25 * 60);
  });

  it("counts down remaining time while the timer is running", () => {
    const running = startPomodoro(createDefaultTimerState(), new Date("2026-06-09T12:00:00.000Z"), CLASSIC);

    expect(displaySeconds(running, CLASSIC, new Date("2026-06-09T12:10:00.000Z"))).toBe(900);
  });
});

describe("getSplit", () => {
  it("falls back to the first split for unknown ids", () => {
    expect(getSplit("missing").id).toBe("classic");
  });

  it("resolves from a supplied split list (config splits)", () => {
    const splits = [{ id: "tiny", label: "Tiny", workMinutes: 1, shortBreakMinutes: 1, longBreakMinutes: 1 }];
    expect(getSplit("tiny", splits).workMinutes).toBe(1);
  });
});

describe("BUILTIN_FOCUS_SPLITS", () => {
  it("includes a deep focus preset", () => {
    expect(BUILTIN_FOCUS_SPLITS).toContainEqual(
      expect.objectContaining({ id: "deep", workMinutes: 50, shortBreakMinutes: 10 }),
    );
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

describe("formatters", () => {
  it("renders mm:ss for the timer display", () => {
    expect(formatTimerSeconds(125)).toBe("2:05");
    expect(formatTimerSeconds(0)).toBe("0:00");
  });

  it("names phases distinctly for the status line", () => {
    expect(formatPhaseLabel("work")).toBe("Work");
    expect(formatPhaseLabel("shortBreak")).toBe("Short break");
    expect(formatPhaseLabel("longBreak")).toBe("Long break");
  });

  it("summarises a split's work / short / long minutes", () => {
    expect(formatSplitSummary(CLASSIC)).toBe("25 / 5 / 15");
  });
});
