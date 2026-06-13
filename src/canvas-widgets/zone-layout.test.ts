import { describe, expect, it } from "vitest";
import { createTestTheme } from "@/theme/theme-defaults";
import { createDefaultCanvasWidgets } from "./config";
import type { CanvasWidgetId } from "./types";
import { buildCanvasZoneLayout } from "./zone-layout";

function workspace(widgets: Partial<Record<CanvasWidgetId, boolean>> = {}) {
  return {
    id: "ws",
    name: "Test",
    theme: createTestTheme({
      widgets: {
        clock: { zone: "upper-center", order: 0, text: "#fff", textMuted: "#ccc", textShadow: "none" },
        welcome: { zone: "center", order: 0, text: "#fff", textMuted: "#ccc", textShadow: "none" },
        quote: { zone: "center", order: 1, text: "#fff", textMuted: "#ccc", textShadow: "none" },
        focusTasks: { zone: "lower-right", order: 0, text: "#fff", textMuted: "#ccc", textShadow: "none" },
      },
    }),
    canvasWidgets: {
      ...createDefaultCanvasWidgets(),
      nowPlaying: false,
      pomodoro: false,
      ...widgets,
    },
    internalTools: {
      pomodoro: { running: false, splitId: "classic", phase: "work", endsAt: null },
      focusTasks: [],
    },
  } as const;
}

describe("buildCanvasZoneLayout", () => {
  it("groups enabled widgets by theme zone sorted by order", () => {
    const layout = buildCanvasZoneLayout(workspace());

    expect(layout["upper-center"]).toEqual(["clock"]);
    expect(layout.center).toEqual(["welcome", "quote"]);
    expect(layout["lower-right"]).toEqual(["focusTasks"]);
    expect(layout["lower-left"]).toEqual([]);
    expect(layout["bottom-center"]).toEqual([]);
  });

  it("skips disabled widgets even when theme assigns a zone", () => {
    const layout = buildCanvasZoneLayout(workspace({ quote: false }));

    expect(layout.center).toEqual(["welcome"]);
  });

  it("hides the wall clock while the pomodoro timer is running", () => {
    const active = {
      ...workspace(),
      internalTools: {
        ...workspace().internalTools,
        pomodoro: {
          running: true,
          splitId: "classic",
          phase: "work" as const,
          endsAt: Date.now() + 60_000,
        },
      },
      canvasWidgets: {
        ...createDefaultCanvasWidgets(),
        clock: true,
        pomodoro: true,
        welcome: false,
        quote: false,
        nowPlaying: false,
        focusTasks: false,
      },
      theme: createTestTheme({
        widgets: {
          clock: { zone: "upper-center", order: 0, text: "#fff", textMuted: "#ccc", textShadow: "none" },
          pomodoro: { zone: "center", order: 0, text: "#fff", textMuted: "#ccc", textShadow: "none" },
        },
      }),
    };

    const layout = buildCanvasZoneLayout(active);

    expect(layout["upper-center"]).toEqual([]);
    expect(layout.center).toEqual(["pomodoro"]);
  });
});
