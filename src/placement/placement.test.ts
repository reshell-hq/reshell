import { describe, expect, it } from "vitest";
import { createDefaultFocusRadio } from "@/focus-radio/config";
import { initialKey, insertBetween } from "@/fractional-order/fractional-order";
import { LIBRARY_SCHEMA_VERSION } from "@/library/schema";
import type { EdgeGroup, Library } from "@/library/types";
import { createTestTheme } from "@/theme/theme-defaults";
import {
  EDGE_PREVIEW_LIMIT,
  resolveEdgeGroupFlyout,
  resolveEdgeGroupLinks,
  resolveEdgeGroups,
  resolveWorkspacePlacedLinks,
} from "./placement";

function edgeGroup(id: string, name: string, orderKey: string, linkIds: string[]): EdgeGroup {
  let previous: string | null = null;
  const links = linkIds.map((linkId) => {
    const orderKeyForLink = previous === null ? initialKey() : insertBetween(previous, null);
    previous = orderKeyForLink;
    return { linkId, orderKey: orderKeyForLink };
  });

  return { id, name, orderKey, links };
}

function makeLibrary(edgeGroups: {
  left?: EdgeGroup[];
  top?: EdgeGroup[];
  bottom?: EdgeGroup[];
}): Library {
  const linkIds = new Set<string>();
  for (const groups of Object.values(edgeGroups)) {
    for (const group of groups ?? []) {
      for (const link of group.links) {
        linkIds.add(link.linkId);
      }
    }
  }

  const catalog = [...linkIds].map((id) => ({
    id,
    url: `https://${id}.example.com`,
    title: id,
  }));

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
            left: edgeGroups.left ?? [],
            top: edgeGroups.top ?? [],
            bottom: edgeGroups.bottom ?? [],
          },
        },
      },
    ],
    shortcuts: { focusCommandBar: "Meta+Shift+k", cycleWorkspace: "Control+Tab" },
    focusRadio: createDefaultFocusRadio(),
    activeWorkspaceId: "work",
  };
}

describe("resolveEdgeGroups", () => {
  it("lists edge groups on a rim in fractional order", () => {
    const first = initialKey();
    const second = insertBetween(first, null);
    const library = makeLibrary({
      left: [edgeGroup("docs", "Docs", second, []), edgeGroup("dev", "Dev tools", first, [])],
    });

    const groups = resolveEdgeGroups(library, "left");

    expect(groups.map((group) => group.id)).toEqual(["dev", "docs"]);
  });
});

describe("resolveEdgeGroupLinks", () => {
  it("returns links for one edge group in fractional order", () => {
    const first = initialKey();
    const third = insertBetween(first, null);
    const second = insertBetween(first, third);
    const library = makeLibrary({
      left: [edgeGroup("dev", "Dev tools", first, ["gamma", "alpha", "beta"])],
    });
    library.catalog.find((link) => link.id === "alpha")!.title = "alpha";
    library.catalog.find((link) => link.id === "beta")!.title = "beta";
    library.catalog.find((link) => link.id === "gamma")!.title = "gamma";
    library.workspaces[0].placements.edges.left[0].links = [
      { linkId: "gamma", orderKey: third },
      { linkId: "alpha", orderKey: first },
      { linkId: "beta", orderKey: second },
    ];

    const links = resolveEdgeGroupLinks(library, "left", "dev");

    expect(links.map((link) => link.id)).toEqual(["alpha", "beta", "gamma"]);
  });

  it("returns every link in an edge group without flyout truncation", () => {
    const ids = Array.from({ length: 10 }, (_, index) => `link-${index}`);
    const library = makeLibrary({
      left: [edgeGroup("dev", "Dev tools", initialKey(), ids)],
    });

    const links = resolveEdgeGroupLinks(library, "left", "dev");

    expect(links.map((link) => link.id)).toEqual(ids);
  });
});

describe("resolveEdgeGroupFlyout", () => {
  it("truncates flyout preview to 8 links and sets hasMore", () => {
    const ids = Array.from({ length: 10 }, (_, index) => `link-${index}`);
    const library = makeLibrary({
      left: [edgeGroup("dev", "Dev tools", initialKey(), ids)],
    });

    const result = resolveEdgeGroupFlyout(library, "left", "dev");

    expect(result.links).toHaveLength(EDGE_PREVIEW_LIMIT);
    expect(result.links[0].id).toBe("link-0");
    expect(result.links[7].id).toBe("link-7");
    expect(result.totalCount).toBe(10);
    expect(result.hasMore).toBe(true);
  });
});

describe("resolveWorkspacePlacedLinks", () => {
  it("returns all placed links across edge groups in the active workspace", () => {
    const library = makeLibrary({
      left: [edgeGroup("dev", "Dev tools", initialKey(), ["alpha", "beta"])],
      top: [edgeGroup("refs", "References", initialKey(), ["gamma"])],
    });

    const result = resolveWorkspacePlacedLinks(library);

    expect(result.map((link) => link.id)).toEqual(["alpha", "beta", "gamma"]);
  });
});
