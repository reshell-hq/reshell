import { describe, expect, it } from "vitest";
import { createDefaultCanvasWidgets } from "@/canvas-widgets/config";
import { createTestTheme } from "./theme-defaults";
import { applyLayoutPreset, getLayoutPreset, LAYOUT_PRESETS } from "./layout-presets";

describe("layout preset catalog", () => {
  it("ships four layout presets including meridian and atelier", () => {
    expect(LAYOUT_PRESETS.map((preset) => preset.id)).toEqual([
      "default",
      "editorial",
      "meridian",
      "atelier",
    ]);
    expect(getLayoutPreset("meridian")?.presentation).toBe("meridian-stage");
    expect(getLayoutPreset("atelier")?.presentation).toBe("atelier-stage");
  });
});

describe("applyLayoutPreset", () => {
  it("changes widget zones without changing palette colours", () => {
    const workspace = {
      id: "ws-1",
      name: "Test",
      theme: createTestTheme({
        palette: { background: "#000000", surface: "#111111", text: "#ffffff", accent: "#ff0000" },
        appliedThemePresetId: "work",
      }),
      placements: { edges: { left: [], top: [], bottom: [] } },
      internalTools: {} as never,
      canvasWidgets: createDefaultCanvasWidgets(),
    };

    const updated = applyLayoutPreset(workspace, "editorial");

    expect(updated.theme.appliedLayoutPresetId).toBe("editorial");
    expect(updated.theme.widgets.clock?.zone).toBe("bottom-center");
    expect(updated.theme.palette).toEqual(workspace.theme.palette);
  });

  it("lets users mix editorial layout with a different theme palette", () => {
    const workspace = {
      id: "ws-1",
      name: "Test",
      theme: createTestTheme({
        appliedThemePresetId: "ocean",
        palette: { background: "#0c1a2e", surface: "#152640", text: "#d8e8f4", accent: "#4a9fd4" },
      }),
      placements: { edges: { left: [], top: [], bottom: [] } },
      internalTools: {} as never,
      canvasWidgets: createDefaultCanvasWidgets(),
    };

    const updated = applyLayoutPreset(workspace, "editorial");

    expect(updated.theme.appliedLayoutPresetId).toBe("editorial");
    expect(updated.theme.appliedThemePresetId).toBe("ocean");
    expect(updated.theme.palette.accent).toBe("#4a9fd4");
    expect(updated.theme.widgets.quote?.zone).toBe("lower-left");
  });
});
