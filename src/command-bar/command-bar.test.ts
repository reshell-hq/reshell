import { describe, expect, it } from "vitest";
import { createDefaultFocusRadio } from "@/focus-radio/config";
import { initialKey } from "@/fractional-order/fractional-order";
import { LIBRARY_SCHEMA_VERSION } from "@/library/schema";
import type { Library } from "@/library/types";
import { createTestTheme } from "@/theme/theme-defaults";
import {
  buildCommandBarActionResults,
  buildCommandBarRows,
  initialCommandBarSelection,
  isCommandBarActionMode,
  moveCommandBarSelection,
  shortcutMatchesEvent,
} from "./command-bar";

function makeLibrary(): Library {
  return {
    schemaVersion: LIBRARY_SCHEMA_VERSION,
    catalog: [
      { id: "github", url: "https://github.com", title: "GitHub" },
      { id: "penpot", url: "https://penpot.app", title: "Penpot" },
    ],
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
                links: [{ linkId: "github", orderKey: initialKey() }],
              },
            ],
            top: [],
            bottom: [],
          },
        },
      },
      {
        id: "personal",
        name: "Personal",
        theme: createTestTheme({
          palette: {
            background: "#111",
            surface: "#222",
            text: "#fff",
            accent: "#0f0",
          },
          borderRadius: 16,
        }),
        placements: {
          edges: { left: [], top: [], bottom: [] },
        },
      },
    ],
    shortcuts: { focusCommandBar: "Meta+Shift+k", cycleWorkspace: "Control+Tab" },
    focusRadio: createDefaultFocusRadio(),
    activeWorkspaceId: "work",
  };
}

describe("buildCommandBarRows", () => {
  it("lists workspace switches before links in the command bar", () => {
    const results = buildCommandBarRows(makeLibrary(), "pe");

    expect(results.map((result) => result.kind)).toEqual(["workspace", "link"]);
    expect(results[0]).toMatchObject({
      kind: "workspace",
      workspaceId: "personal",
      name: "Personal",
    });
  });
});

describe("buildCommandBarActionResults", () => {
  it("returns shell actions when the query uses the action prefix", () => {
    expect(isCommandBarActionMode(":reset")).toBe(true);
    expect(buildCommandBarActionResults(":reset")[0]).toMatchObject({
      kind: "action",
      actionId: "reset",
      label: "Reset to starter template",
    });
  });

  it("filters actions by text after the prefix", () => {
    expect(buildCommandBarActionResults(":res")).toHaveLength(1);
    expect(buildCommandBarActionResults(":zzzz")).toHaveLength(0);
  });
});

describe("moveCommandBarSelection", () => {
  it("cycles the highlighted command bar row with arrow-key directions", () => {
    expect(moveCommandBarSelection(0, "down", 3)).toBe(1);
    expect(moveCommandBarSelection(2, "down", 3)).toBe(0);
    expect(moveCommandBarSelection(0, "up", 3)).toBe(2);
  });
});

describe("initialCommandBarSelection", () => {
  it("selects the first result when results appear", () => {
    expect(initialCommandBarSelection(3)).toBe(0);
    expect(initialCommandBarSelection(0)).toBe(-1);
  });
});

describe("shortcutMatchesEvent", () => {
  it("matches the library focus-command-bar binding", () => {
    const event = {
      key: "k",
      metaKey: true,
      shiftKey: true,
      ctrlKey: false,
      altKey: false,
    } as KeyboardEvent;

    expect(shortcutMatchesEvent(event, "Meta+Shift+k")).toBe(true);
  });
});
