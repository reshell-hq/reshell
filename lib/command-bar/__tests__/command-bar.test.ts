import { describe, expect, it } from "vitest";
import { initialKey } from "@/lib/fractional-order/fractional-order";
import { LIBRARY_SCHEMA_VERSION } from "@/lib/library/schema";
import type { Library } from "@/lib/library/types";
import type { Theme } from "@/lib/theme/types";
import {
  buildCommandBarActionResults,
  buildCommandBarRows,
  initialCommandBarSelection,
  isCommandBarActionMode,
  moveCommandBarSelection,
  resolveCommandBarListNavigation,
  shouldCaptureTypeToFocusKey,
  shouldHandleTypeToFocus,
  shortcutMatchesEvent,
} from "../command-bar";

const testTheme: Theme = {
  palette: {
    background: "#000",
    surface: "#111",
    text: "#fff",
    accent: "#f00",
  },
  borderRadius: 16,
};

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
        theme: testTheme,
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
        theme: testTheme,
        placements: { edges: { left: [], top: [], bottom: [] } },
      },
    ],
    shortcuts: { focusCommandBar: "Meta+Shift+k", cycleWorkspace: "Control+Tab" },
    activeWorkspaceId: "work",
  };
}

describe("buildCommandBarRows", () => {
  it("lists workspace switches before links in default mode", () => {
    const results = buildCommandBarRows(makeLibrary(), "pe");

    expect(results.map((result) => result.kind)).toEqual(["workspace", "link"]);
    expect(results[0]).toMatchObject({
      kind: "workspace",
      workspaceId: "personal",
      name: "Personal",
    });
  });

  it("switches to action mode (empty until issue 12) on the `:` prefix", () => {
    expect(isCommandBarActionMode(":reset")).toBe(true);
    expect(buildCommandBarRows(makeLibrary(), ":reset")).toEqual([]);
  });
});

describe("buildCommandBarActionResults", () => {
  it("is empty in this slice — actions land in issue 12", () => {
    expect(buildCommandBarActionResults(":reset")).toEqual([]);
    expect(buildCommandBarActionResults(":")).toEqual([]);
  });
});

describe("moveCommandBarSelection", () => {
  it("cycles the highlighted row with arrow-key directions", () => {
    expect(moveCommandBarSelection(0, "down", 3)).toBe(1);
    expect(moveCommandBarSelection(2, "down", 3)).toBe(0);
    expect(moveCommandBarSelection(0, "up", 3)).toBe(2);
  });

  it("has nothing to select when there are no results", () => {
    expect(moveCommandBarSelection(0, "down", 0)).toBe(-1);
  });
});

describe("initialCommandBarSelection", () => {
  it("selects the first result when results appear", () => {
    expect(initialCommandBarSelection(3)).toBe(0);
    expect(initialCommandBarSelection(0)).toBe(-1);
  });
});

describe("resolveCommandBarListNavigation", () => {
  it("moves selection with arrow keys and tab", () => {
    expect(resolveCommandBarListNavigation("ArrowDown", false)).toBe("down");
    expect(resolveCommandBarListNavigation("ArrowUp", false)).toBe("up");
    expect(resolveCommandBarListNavigation("Tab", false)).toBe("down");
    expect(resolveCommandBarListNavigation("Tab", true)).toBe("up");
  });

  it("does not treat j or k as navigation keys", () => {
    expect(resolveCommandBarListNavigation("j", false)).toBeNull();
    expect(resolveCommandBarListNavigation("k", false)).toBeNull();
  });
});

describe("type-to-focus", () => {
  it("captures printable keys without command modifiers", () => {
    expect(
      shouldCaptureTypeToFocusKey({
        key: "j",
        ctrlKey: false,
        metaKey: false,
        altKey: false,
      }),
    ).toBe(true);
  });

  it("ignores modified and non-printable keys", () => {
    expect(
      shouldCaptureTypeToFocusKey({
        key: "j",
        ctrlKey: false,
        metaKey: true,
        altKey: false,
      }),
    ).toBe(false);
    expect(
      shouldCaptureTypeToFocusKey({
        key: "Tab",
        ctrlKey: false,
        metaKey: false,
        altKey: false,
      }),
    ).toBe(false);
  });

  it("handles a printable key when focus is not in a text field", () => {
    expect(
      shouldHandleTypeToFocus({
        event: { key: "h", ctrlKey: false, metaKey: false, altKey: false },
        activeElement: null,
      }),
    ).toBe(true);
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
