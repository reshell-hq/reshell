import { describe, expect, it } from "vitest";
import { createDefaultCanvasWidgets } from "@/canvas-widgets/config";
import { createTestTheme } from "@/theme/theme-defaults";
import { createDefaultWorkspaceInternalTools } from "@/internal-tools/pomodoro";
import {
  normalizeWorkspacePlacements,
  normalizeWorkspacePlacementsInLibrary,
} from "./migrate-placements";

describe("normalizeWorkspacePlacements", () => {
  it("drops legacy pin placements while keeping edge groups", () => {
    const placements = normalizeWorkspacePlacements({
      edges: { left: [], top: [], bottom: [] },
      pins: [{ linkId: "github", position: { kind: "strip", orderKey: "a0" } }],
    });

    expect(placements).toEqual({
      edges: { left: [], top: [], bottom: [] },
    });
    expect("pins" in placements).toBe(false);
  });
});

describe("normalizeWorkspacePlacementsInLibrary", () => {
  it("strips pins from every workspace in a loaded library", () => {
    const normalized = normalizeWorkspacePlacementsInLibrary({
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
            edges: { left: [], top: [], bottom: [] },
            pins: [{ linkId: "github", position: { kind: "strip", orderKey: "a0" } }],
          },
          internalTools: createDefaultWorkspaceInternalTools(),
          canvasWidgets: createDefaultCanvasWidgets(),
        },
      ],
    });

    expect(normalized.workspaces[0]?.placements).toEqual({
      edges: { left: [], top: [], bottom: [] },
    });
  });
});
