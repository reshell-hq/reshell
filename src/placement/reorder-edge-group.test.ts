import { describe, expect, it } from "vitest";
import { createDefaultFocusRadio } from "@/focus-radio/config";
import { initialKey, insertBetween } from "@/fractional-order/fractional-order";
import { LIBRARY_SCHEMA_VERSION } from "@/library/schema";
import type { EdgeGroup, Library } from "@/library/types";
import { createTestTheme } from "@/theme/theme-defaults";
import { reorderEdgeGroupOnRim, resolveEdgeGroups } from "./placement";

function edgeGroup(id: string, orderKey: string): EdgeGroup {
  return { id, name: id, orderKey, links: [] };
}

function makeLibrary(groups: EdgeGroup[]): Library {
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
          edges: { left: groups, top: [], bottom: [] },
        },
      },
    ],
    shortcuts: { focusCommandBar: "Meta+Shift+k", cycleWorkspace: "Control+Tab" },
    focusRadio: createDefaultFocusRadio(),
    activeWorkspaceId: "work",
  };
}

describe("reorderEdgeGroupOnRim", () => {
  it("persists a new edge order after dragging a handle to another slot", () => {
    const first = initialKey();
    const second = insertBetween(first, null);
    const library = makeLibrary([edgeGroup("alpha", first), edgeGroup("beta", second)]);

    const updated = reorderEdgeGroupOnRim(library, "left", "beta", 0);

    expect(resolveEdgeGroups(updated, "left").map((group) => group.id)).toEqual(["beta", "alpha"]);
  });
});
