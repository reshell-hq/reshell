import { describe, expect, it } from "vitest";
import { createDefaultCanvasWidgets } from "@/canvas-widgets/config";
import { createDefaultFocusRadio } from "@/focus-radio/config";
import { initialKey } from "@/fractional-order/fractional-order";
import { defaultInternalToolsForTests } from "@/internal-tools/test-fixtures";
import { LIBRARY_SCHEMA_VERSION } from "@/library/schema";
import type { Library } from "@/library/types";
import { createTestTheme } from "@/theme/theme-defaults";
import { buildShellZones } from "./build-zones";

function makeLibrary(): Library {
  return {
    schemaVersion: LIBRARY_SCHEMA_VERSION,
    catalog: [],
    workspaces: [
      {
        id: "work",
        name: "Work",
        theme: createTestTheme({
          palette: {
            background: "#000",
            surface: "#111",
            text: "#fff",
            accent: "#f00",
          },
          borderRadius: 16,
        }),
        placements: {
          edges: {
            left: [
              {
                id: "left-default",
                name: "Left",
                orderKey: initialKey(),
                links: [],
              },
            ],
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

describe("buildShellZones", () => {
  it("does not register a right-rim settings zone", () => {
    const zones = buildShellZones(makeLibrary());

    expect(zones.some((zone) => zone.kind === "config")).toBe(false);
  });

  it("registers pomodoro and tasks on the right rim", () => {
    const zones = buildShellZones(makeLibrary());

    expect(zones.filter((zone) => zone.rim === "right")).toEqual([
      expect.objectContaining({ kind: "internal-tool", id: "__tool_pomodoro__" }),
      expect.objectContaining({ kind: "internal-tool", id: "__tool_tasks__" }),
    ]);
  });
});
