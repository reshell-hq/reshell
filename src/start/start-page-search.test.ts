import { describe, expect, it } from "vitest";
import { createDefaultFocusRadio } from "@/focus-radio/config";
import { initialKey } from "@/fractional-order/fractional-order";
import { LIBRARY_SCHEMA_VERSION } from "@/library/schema";
import type { Library, Link } from "@/library/types";
import { createTestTheme } from "@/theme/theme-defaults";
import { buildStartPageSearchResults } from "./start-page-search";

function link(id: string, title: string): Link {
  return { id, url: `https://${id}.example.com`, title };
}

function makeLibrary(catalog: Link[]): Library {
  return {
    schemaVersion: LIBRARY_SCHEMA_VERSION,
    catalog,
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
        },
        internalTools: {
          pomodoro: { orderKey: initialKey(), splitId: "classic" },
          tasks: { orderKey: initialKey(), items: [] },
        },
      },
    ],
    activeWorkspaceId: "work",
    shortcuts: {},
    focusRadio: createDefaultFocusRadio(),
  };
}

describe("buildStartPageSearchResults", () => {
  it("searches links only and ignores command bar action mode", () => {
    const library = makeLibrary([link("gh", "GitHub")]);

    expect(buildStartPageSearchResults(library, "git")).toEqual([
      {
        linkId: "gh",
        url: "https://gh.example.com",
        title: "GitHub",
        source: "catalog",
      },
    ]);
    expect(buildStartPageSearchResults(library, ":settings")).toEqual([]);
  });
});
