import { describe, expect, it } from "vitest";
import { createDefaultCanvasWidgets } from "@/canvas-widgets/config";
import { createTestTheme } from "./theme-defaults";
import { getThemePreset } from "./theme-presets";
import {
  resetShellThemeToPreset,
  resetWidgetThemeToPreset,
} from "./theme-preset-reset";

function workspace(overrides: {
  appliedPresetId?: string;
  theme?: ReturnType<typeof createTestTheme>;
} = {}) {
  return {
    id: "ws",
    name: "Test",
    theme: overrides.theme ?? createTestTheme({ appliedPresetId: overrides.appliedPresetId ?? "work" }),
    canvasWidgets: createDefaultCanvasWidgets(),
    internalTools: {} as never,
    placements: { edges: { left: [], top: [], bottom: [] } },
  };
}

describe("resetShellThemeToPreset", () => {
  it("restores shell fields from the applied preset", () => {
    const preset = getThemePreset("forest")!;
    const patch = resetShellThemeToPreset(
      workspace({
        appliedPresetId: "forest",
        theme: createTestTheme({
          appliedPresetId: "forest",
          palette: { background: "#000000", surface: "#111111", text: "#ffffff", accent: "#ff0000" },
          shellBorderColor: "#ff00ff",
        }),
      }),
    );

    expect(patch).toEqual({
      palette: preset.theme.palette,
      shellBorderColor: null,
      borderRadius: preset.theme.borderRadius,
      backgroundUrl: preset.theme.backgroundUrl,
    });
  });

  it("returns null when no preset has been applied", () => {
    expect(resetShellThemeToPreset(workspace({ theme: createTestTheme() }))).toBeNull();
  });
});

describe("resetWidgetThemeToPreset", () => {
  it("restores one widget style block from the applied preset", () => {
    const preset = getThemePreset("personal")!;
    const patch = resetWidgetThemeToPreset(
      workspace({ appliedPresetId: "personal" }),
      "clock",
    );

    expect(patch).toEqual({
      widgets: {
        clock: {
          text: preset.theme.widgets.clock?.text,
          textMuted: preset.theme.widgets.clock?.textMuted,
          textShadow: preset.theme.widgets.clock?.textShadow,
        },
      },
    });
  });

  it("returns null when no preset has been applied", () => {
    expect(resetWidgetThemeToPreset(workspace({ theme: createTestTheme() }), "clock")).toBeNull();
  });
});
