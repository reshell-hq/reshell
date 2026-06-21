import { describe, expect, it } from "vitest";
import { rebalanceKeys } from "@/lib/fractional-order/fractional-order";
import type {
  EdgeGroup,
  EdgeGroupLinkPlacement,
  Library,
  Link,
  Workspace,
} from "@/lib/library/types";
import {
  EDGE_PREVIEW_LIMIT,
  reorderEdgeGroupOnRim,
  resolveEdgeGroupFlyout,
  resolveEdgeGroupLinks,
  resolveEdgeGroups,
} from "../placement";

function placedLinks(linkIds: string[]): EdgeGroupLinkPlacement[] {
  const keys = rebalanceKeys(linkIds.length);
  return linkIds.map((linkId, index) => ({ linkId, orderKey: keys[index] }));
}

function group(id: string, orderKey: string, linkIds: string[]): EdgeGroup {
  return { id, name: id, orderKey, links: placedLinks(linkIds) };
}

function library(left: EdgeGroup[], catalog: Link[]): Library {
  const workspace: Workspace = {
    id: "work",
    name: "Work",
    theme: {
      palette: {
        background: "#000",
        surface: "#111",
        text: "#fff",
        accent: "#f00",
      },
      borderRadius: 20,
    },
    placements: { edges: { left, top: [], bottom: [] } },
  };
  return {
    schemaVersion: 1,
    catalog,
    workspaces: [workspace],
    shortcuts: { focusCommandBar: "Meta+k", cycleWorkspace: "Control+Tab" },
    activeWorkspaceId: "work",
  };
}

function link(id: string): Link {
  return { id, url: `https://${id}.example.com`, title: id };
}

describe("resolveEdgeGroups", () => {
  it("returns the active workspace's edge groups in edge order", () => {
    const [keyA, keyB] = rebalanceKeys(2);
    const lib = library(
      [group("second", keyB, []), group("first", keyA, [])],
      [],
    );

    expect(resolveEdgeGroups(lib, "left").map((g) => g.id)).toEqual([
      "first",
      "second",
    ]);
  });
});

describe("resolveEdgeGroupLinks", () => {
  it("resolves placed link ids to catalog links in link order", () => {
    const [key] = rebalanceKeys(1);
    const lib = library(
      [group("g", key, ["a", "b"])],
      [link("a"), link("b"), link("c")],
    );

    expect(resolveEdgeGroupLinks(lib, "left", "g").map((l) => l.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("drops placements whose link is missing from the catalog", () => {
    const [key] = rebalanceKeys(1);
    const lib = library([group("g", key, ["a", "ghost"])], [link("a")]);

    expect(resolveEdgeGroupLinks(lib, "left", "g").map((l) => l.id)).toEqual([
      "a",
    ]);
  });
});

describe("resolveEdgeGroupFlyout", () => {
  it("previews up to the limit and flags more when a group overflows", () => {
    const ids = Array.from({ length: EDGE_PREVIEW_LIMIT + 2 }, (_, i) => `l${i}`);
    const [key] = rebalanceKeys(1);
    const lib = library([group("g", key, ids)], ids.map(link));

    const flyout = resolveEdgeGroupFlyout(lib, "left", "g");

    expect(flyout.links).toHaveLength(EDGE_PREVIEW_LIMIT);
    expect(flyout.totalCount).toBe(EDGE_PREVIEW_LIMIT + 2);
    expect(flyout.hasMore).toBe(true);
  });

  it("does not flag more when the group fits within the limit", () => {
    const [key] = rebalanceKeys(1);
    const lib = library([group("g", key, ["a", "b"])], [link("a"), link("b")]);

    const flyout = resolveEdgeGroupFlyout(lib, "left", "g");

    expect(flyout.links).toHaveLength(2);
    expect(flyout.hasMore).toBe(false);
  });
});

describe("reorderEdgeGroupOnRim", () => {
  it("persists a new group order into the returned library via fractional keys", () => {
    const keys = rebalanceKeys(3);
    const lib = library(
      [
        group("a", keys[0], []),
        group("b", keys[1], []),
        group("c", keys[2], []),
      ],
      [],
    );

    const next = reorderEdgeGroupOnRim(lib, "left", "c", 0);

    expect(resolveEdgeGroups(next, "left").map((g) => g.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
    // Original library is untouched (pure mutation).
    expect(resolveEdgeGroups(lib, "left").map((g) => g.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});
