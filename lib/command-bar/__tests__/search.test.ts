import { describe, expect, it } from "vitest";
import { initialKey } from "@/lib/fractional-order/fractional-order";
import { LIBRARY_SCHEMA_VERSION } from "@/lib/library/schema";
import type { Library, Link } from "@/lib/library/types";
import type { Theme } from "@/lib/theme/types";
import { fuzzyMatch, searchLinks, searchWorkspaces } from "../search";

const testTheme: Theme = {
  palette: {
    background: "#000",
    surface: "#111",
    text: "#fff",
    accent: "#f00",
  },
  borderRadius: 16,
};

function link(id: string, title: string): Link {
  return { id, url: `https://${id}.example.com`, title };
}

function makeLibrary(
  catalog: Link[],
  placedIds: string[],
  activeWorkspaceId = "work",
): Library {
  return {
    schemaVersion: LIBRARY_SCHEMA_VERSION,
    catalog,
    workspaces: [
      {
        id: "work",
        name: "Work",
        theme: testTheme,
        placements: {
          edges: {
            left:
              placedIds.length === 0
                ? []
                : [
                    {
                      id: "left-default",
                      name: "Left",
                      orderKey: initialKey(),
                      links: placedIds.map((linkId) => ({
                        linkId,
                        orderKey: initialKey(),
                      })),
                    },
                  ],
            top: [],
            bottom: [],
          },
        },
      },
    ],
    shortcuts: { focusCommandBar: "Meta+Shift+k", cycleWorkspace: "Control+Tab" },
    activeWorkspaceId,
  };
}

describe("fuzzyMatch", () => {
  it("matches non-contiguous subsequences, case-insensitively", () => {
    expect(fuzzyMatch("gh", "GitHub")).toBe(true);
    expect(fuzzyMatch("ghb", "GitHub")).toBe(true);
    expect(fuzzyMatch("xyz", "GitHub")).toBe(false);
  });

  it("never matches an empty or whitespace query", () => {
    expect(fuzzyMatch("", "GitHub")).toBe(false);
    expect(fuzzyMatch("   ", "GitHub")).toBe(false);
  });
});

describe("searchLinks", () => {
  it("returns placed links in the active workspace that fuzzy-match", () => {
    const library = makeLibrary(
      [link("github", "GitHub"), link("mdn", "MDN")],
      ["github"],
    );

    const results = searchLinks(library, "git");

    expect(results).toEqual([{ link: library.catalog[0], source: "workspace" }]);
  });

  it("ranks placed workspace links above unplaced catalog links", () => {
    const library = makeLibrary(
      [link("github", "GitHub"), link("gitlab", "GitLab")],
      ["github"],
    );

    const results = searchLinks(library, "git");

    expect(results.map((r) => r.link.id)).toEqual(["github", "gitlab"]);
    expect(results.map((r) => r.source)).toEqual(["workspace", "catalog"]);
  });

  it("includes unplaced catalog links as fallback results", () => {
    const library = makeLibrary([link("archive", "Archive Docs")], []);

    const results = searchLinks(library, "arch");

    expect(results).toEqual([{ link: library.catalog[0], source: "catalog" }]);
  });

  it("returns nothing for an empty query", () => {
    const library = makeLibrary([link("github", "GitHub")], ["github"]);

    expect(searchLinks(library, "")).toEqual([]);
  });
});

describe("searchWorkspaces", () => {
  it("returns workspaces whose names fuzzy-match the query", () => {
    const library = makeLibrary([link("github", "GitHub")], ["github"]);
    library.workspaces.push({
      id: "personal",
      name: "Personal",
      theme: testTheme,
      placements: { edges: { left: [], top: [], bottom: [] } },
    });

    const results = searchWorkspaces(library, "pers");

    expect(results.map((w) => w.id)).toEqual(["personal"]);
  });

  it("returns nothing for an empty query", () => {
    const library = makeLibrary([link("github", "GitHub")], ["github"]);

    expect(searchWorkspaces(library, "")).toEqual([]);
  });
});
