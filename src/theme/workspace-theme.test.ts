import { describe, expect, it } from "vitest";
import { setCanvasWidgetEnabled } from "@/canvas-widgets/config";
import { loadOrSeedLibrary } from "@/library/library";
import { createInMemoryLibraryStore } from "@/library/store";
import { getThemePreset } from "./theme-presets";
import { applyThemePresetToWorkspace, updateWorkspaceTheme } from "./workspace-theme";

describe("updateWorkspaceTheme", () => {
  it("updates the palette on a workspace theme", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspaceId = library.activeWorkspaceId;

    const updated = updateWorkspaceTheme(library, workspaceId, {
      palette: { accent: "#112233" },
    });

    const workspace = updated.workspaces.find((entry) => entry.id === workspaceId);
    expect(workspace?.theme.palette.accent).toBe("#112233");
    expect(workspace?.theme.palette.background).toBeTruthy();
  });

  it("updates background image URL and border radius", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspaceId = library.activeWorkspaceId;

    const updated = updateWorkspaceTheme(library, workspaceId, {
      backgroundUrl: "https://example.com/bg.jpg",
      borderRadius: 12,
    });

    const workspace = updated.workspaces.find((entry) => entry.id === workspaceId);
    expect(workspace?.theme.backgroundUrl).toBe("https://example.com/bg.jpg");
    expect(workspace?.theme.borderRadius).toBe(12);
  });

  it("updates shell border color on a workspace theme", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspaceId = library.activeWorkspaceId;

    const updated = updateWorkspaceTheme(library, workspaceId, {
      shellBorderColor: "#112233",
    });

    const workspace = updated.workspaces.find((entry) => entry.id === workspaceId);
    expect(workspace?.theme.shellBorderColor).toBe("#112233");
  });

  it("merges per-widget style patches onto defaults", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspaceId = library.activeWorkspaceId;

    const updated = updateWorkspaceTheme(library, workspaceId, {
      widgets: {
        clock: {
          text: "#ffffff",
          textMuted: "#dddddd",
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
        },
      },
    });

    const workspace = updated.workspaces.find((entry) => entry.id === workspaceId);
    expect(workspace?.theme.widgets.clock?.text).toBe("#ffffff");
    expect(workspace?.theme.widgets.clock?.zone).toBe("upper-center");
  });

  it("applies a theme preset to a workspace without changing canvas widget toggles", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspaceId = library.activeWorkspaceId;
    const withToggles = setCanvasWidgetEnabled(library, workspaceId, "clock", false);
    const preset = getThemePreset("ocean")!;

    const updated = applyThemePresetToWorkspace(withToggles, workspaceId, "ocean");
    const workspace = updated.workspaces.find((entry) => entry.id === workspaceId)!;

    expect(workspace.theme.appliedThemePresetId).toBe("ocean");
    expect(workspace.theme.palette).toEqual(preset.theme.palette);
    expect(workspace.theme.widgets.clock?.text).toBe(preset.theme.widgets.clock?.text);
    expect(workspace.theme.widgets.clock?.zone).toBe("upper-center");
    expect(workspace.canvasWidgets.clock).toBe(false);
  });

  it("clears the background image when backgroundUrl is null", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspaceId = library.activeWorkspaceId;
    const withBackground = updateWorkspaceTheme(library, workspaceId, {
      backgroundUrl: "https://example.com/bg.jpg",
    });

    const updated = updateWorkspaceTheme(withBackground, workspaceId, {
      backgroundUrl: null,
    });

    const workspace = updated.workspaces.find((entry) => entry.id === workspaceId);
    expect(workspace?.theme.backgroundUrl).toBeUndefined();
  });
});
