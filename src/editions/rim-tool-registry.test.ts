import { afterEach, describe, expect, it } from "vitest";
import { createDefaultCanvasWidgets } from "@/canvas-widgets/config";
import { createDefaultFocusRadio } from "@/focus-radio/config";
import { initialKey } from "@/fractional-order/fractional-order";
import { defaultInternalToolsForTests } from "@/internal-tools/test-fixtures";
import { LIBRARY_SCHEMA_VERSION } from "@/library/schema";
import type { Library } from "@/library/types";
import { buildShellZones } from "@/shell-frame/build-zones";
import { createTestTheme } from "@/theme/theme-defaults";
import { rimToolRegistry } from "./rim-tool-registry";

function makeLibrary(): Library {
  return {
    schemaVersion: LIBRARY_SCHEMA_VERSION,
    catalog: [],
    workspaces: [
      {
        id: "work",
        name: "Work",
        theme: createTestTheme({
          palette: { background: "#000", surface: "#111", text: "#fff", accent: "#f00" },
          borderRadius: 16,
        }),
        placements: {
          edges: {
            left: [{ id: "left-default", name: "Left", orderKey: initialKey(), links: [] }],
            top: [],
            bottom: [],
          },
        },
        internalTools: defaultInternalToolsForTests(),
        canvasWidgets: createDefaultCanvasWidgets(),
      },
    ],
    shortcuts: { focusCommandBar: "Meta+Shift+k", cycleWorkspace: "Control+Tab" },
    focusRadio: createDefaultFocusRadio(),
    activeWorkspaceId: "work",
  };
}

function rightRimToolZoneIds(): string[] {
  return buildShellZones(makeLibrary())
    .filter((zone) => zone.rim === "right" && zone.kind === "internal-tool")
    .map((zone) => zone.id);
}

afterEach(() => {
  rimToolRegistry.clear();
});

describe("rimToolRegistry", () => {
  it("is empty by default so only builtin tools get zones", () => {
    expect(rimToolRegistry.list()).toEqual([]);
    expect(rightRimToolZoneIds()).toEqual(["__tool_pomodoro__", "__tool_tasks__"]);
  });

  it("contributes a right-rim zone for a registered tool", () => {
    rimToolRegistry.register({
      id: "agent",
      label: "Agent",
      glyph: "✦",
      menuSize: { width: 320, height: 420 },
    });

    expect(rightRimToolZoneIds()).toContain("__tool_agent__");
  });
});
