import { describe, expect, it } from "vitest";
import { visibleWidgets } from "../visibility";
import type { CanvasWidgetId } from "@/lib/config";

const ALL: CanvasWidgetId[] = [
  "clock",
  "welcome",
  "quote",
  "nowPlaying",
  "pomodoro",
  "focusTasks",
];

describe("visibleWidgets", () => {
  it("hides pomodoro when no timer is running", () => {
    expect(visibleWidgets(ALL, { timerRunning: false })).not.toContain("pomodoro");
  });

  it("shows pomodoro only when it is enabled AND a timer is running", () => {
    expect(visibleWidgets(ALL, { timerRunning: true })).toContain("pomodoro");
    // Enabled but idle → hidden.
    expect(visibleWidgets(ALL, { timerRunning: false })).not.toContain("pomodoro");
    // Running but not enabled → still absent (can't conjure a disabled widget).
    const withoutPomodoro = ALL.filter((id) => id !== "pomodoro");
    expect(visibleWidgets(withoutPomodoro, { timerRunning: true })).not.toContain(
      "pomodoro",
    );
  });

  it("hides clock when the pomodoro readout is visible", () => {
    const result = visibleWidgets(ALL, { timerRunning: true });
    expect(result).toContain("pomodoro");
    expect(result).not.toContain("clock");
  });

  it("keeps clock when a timer is running but pomodoro is not enabled", () => {
    const withoutPomodoro = ALL.filter((id) => id !== "pomodoro");
    const result = visibleWidgets(withoutPomodoro, { timerRunning: true });
    expect(result).toContain("clock");
  });

  it("keeps clock when pomodoro is enabled but no timer is running", () => {
    expect(visibleWidgets(ALL, { timerRunning: false })).toContain("clock");
  });

  it("leaves the other widgets untouched", () => {
    const result = visibleWidgets(ALL, { timerRunning: true });
    for (const id of ["welcome", "quote", "nowPlaying", "focusTasks"] as const) {
      expect(result).toContain(id);
    }
  });

  it("preserves the input order", () => {
    const enabled: CanvasWidgetId[] = ["focusTasks", "quote", "welcome", "clock"];
    expect(visibleWidgets(enabled, { timerRunning: false })).toEqual(enabled);
  });

  it("returns an empty list for no enabled widgets", () => {
    expect(visibleWidgets([], { timerRunning: true })).toEqual([]);
  });
});
