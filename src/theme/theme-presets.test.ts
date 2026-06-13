import { describe, expect, it } from "vitest";
import { createDefaultCanvasWidgets } from "@/canvas-widgets/config";
import { createTestTheme } from "./theme-defaults";
import {
  THEME_PRESETS,
  applyThemePreset,
  getThemePreset,
} from "./theme-presets";

describe("theme preset catalog", () => {
  it("ships six named presets including Work and Personal", () => {
    expect(THEME_PRESETS).toHaveLength(6);
    expect(THEME_PRESETS.map((preset) => preset.id)).toEqual([
      "work",
      "personal",
      "editorial",
      "forest",
      "sunset",
      "ocean",
    ]);
    expect(THEME_PRESETS.map((preset) => preset.name)).toEqual([
      "Work",
      "Personal",
      "Editorial",
      "Forest",
      "Sunset",
      "Ocean",
    ]);
  });

  it("ships an Editorial preset with monochrome corner widget placement", () => {
    const editorial = getThemePreset("editorial")!;

    expect(editorial.theme.palette).toEqual({
      background: "#ffffff",
      surface: "#ffffff",
      text: "#000000",
      accent: "#000000",
    });
    expect(editorial.theme.shellBorderColor).toBe("#000000");
    expect(editorial.theme.backgroundUrl).toBe("");
    expect(editorial.theme.widgets.quote?.zone).toBe("lower-left");
    expect(editorial.theme.widgets.nowPlaying?.zone).toBe("lower-left");
    expect(editorial.theme.widgets.focusTasks?.zone).toBe("lower-right");
    expect(editorial.theme.widgets.welcome?.zone).toBe("bottom-center");
    expect(editorial.theme.widgets.clock?.zone).toBe("bottom-center");
    expect(editorial.theme.widgets.quote?.order).toBe(0);
    expect(editorial.theme.widgets.nowPlaying?.order).toBe(1);
    expect(editorial.theme.widgets.welcome?.order).toBe(0);
    expect(editorial.theme.widgets.clock?.order).toBe(1);
  });

  it("ships solid-only themes without glass modes or glassOpacity", () => {
    for (const preset of THEME_PRESETS) {
      expect(preset.theme).not.toHaveProperty("shellSurface");
      expect(preset.theme).not.toHaveProperty("glassOpacity");
    }
  });

  it("each preset defines a complete theme with per-widget styling", () => {
    for (const preset of THEME_PRESETS) {
      expect(preset.theme.palette.background).toMatch(/^#/);
      expect(preset.theme.widgets.clock?.text).toMatch(/^#/);
      expect(preset.theme.widgets.welcome?.zone).toBeTruthy();
    }
  });
});

describe("applyThemePreset", () => {
  it("copies colour fields without moving widget zones", () => {
    const workspace = {
      id: "ws-1",
      name: "Test",
      theme: createTestTheme({ palette: { background: "#000000", surface: "#111111", text: "#ffffff", accent: "#ff0000" } }),
      placements: { edges: { left: [], top: [], bottom: [] } },
      internalTools: {} as never,
      canvasWidgets: createDefaultCanvasWidgets(),
    };
    workspace.canvasWidgets.clock = false;

    const preset = getThemePreset("forest")!;
    const updated = applyThemePreset(workspace, "forest");

    expect(updated.theme.appliedThemePresetId).toBe("forest");
    expect(updated.theme.palette).toEqual(preset.theme.palette);
    expect(updated.theme.backgroundUrl).toBe(preset.theme.backgroundUrl);
    expect(updated.theme.borderRadius).toBe(preset.theme.borderRadius);
    expect(updated.theme.widgets.clock?.text).toBe(preset.theme.widgets.clock?.text);
    expect(updated.theme.widgets.clock?.zone).toBe("upper-center");
    expect(updated.canvasWidgets.clock).toBe(false);
  });
});
