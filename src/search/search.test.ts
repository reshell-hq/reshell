import { describe, expect, it } from "vitest";
import { createDefaultFocusRadio } from "@/focus-radio/config";
import { initialKey } from "@/fractional-order/fractional-order";
import { filterLinks, searchLinks, searchWorkspaces } from "./search";
import { LIBRARY_SCHEMA_VERSION } from "@/library/schema";
import type { Library, Link } from "@/library/types";
import { createTestTheme } from "@/theme/theme-defaults";

function link(id: string, title: string): Link {
  return { id, url: `https://${id}.example.com`, title };
}

function makeLibrary(catalog: Link[], placedIds: string[], activeWorkspaceId = "work"): Library {
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
    focusRadio: createDefaultFocusRadio(),
    activeWorkspaceId,
  };
}

describe("searchLinks", () => {
  it("returns placed links in the active workspace that fuzzy-match the query", () => {
    const library = makeLibrary([link("github", "GitHub"), link("mdn", "MDN")], ["github"]);

    const results = searchLinks(library, "git");

    expect(results).toEqual([{ link: library.catalog[0], source: "workspace" }]);
  });

  it("ranks placed workspace links above unplaced catalog links", () => {
    const library = makeLibrary([link("github", "GitHub"), link("gitlab", "GitLab")], ["github"]);

    const results = searchLinks(library, "git");

    expect(results.map((r) => r.link.id)).toEqual(["github", "gitlab"]);
    expect(results.map((r) => r.source)).toEqual(["workspace", "catalog"]);
  });

  it("includes unplaced catalog links as fallback results", () => {
    const library = makeLibrary([link("archive", "Archive Docs")], []);

    const results = searchLinks(library, "arch");

    expect(results).toEqual([{ link: library.catalog[0], source: "catalog" }]);
  });

  it("matches non-contiguous substrings in link titles", () => {
    const library = makeLibrary([link("github", "GitHub")], ["github"]);

    const results = searchLinks(library, "gh");

    expect(results).toHaveLength(1);
    expect(results[0].link.id).toBe("github");
  });
});

describe("filterLinks", () => {
  it("returns all links when the query is empty", () => {
    const links = [link("github", "GitHub"), link("mdn", "MDN")];

    expect(filterLinks(links, "")).toEqual(links);
  });

  it("narrows links with fuzzy matching", () => {
    const links = [link("github", "GitHub"), link("mdn", "MDN")];

    expect(filterLinks(links, "git").map((l) => l.id)).toEqual(["github"]);
  });
});

describe("searchWorkspaces", () => {
  it("returns workspaces whose names fuzzy-match the query", () => {
    const library = makeLibrary([link("github", "GitHub")], ["github"]);
    library.workspaces.push({
      id: "personal",
      name: "Personal",
      theme: library.workspaces[0].theme,
      placements: {
        edges: { left: [], top: [], bottom: [] },
      },
      internalTools: library.workspaces[0].internalTools,
      canvasWidgets: library.workspaces[0].canvasWidgets,
    });

    const results = searchWorkspaces(library, "pers");

    expect(results.map((w) => w.id)).toEqual(["personal"]);
  });
});
