import { describe, expect, it } from "vitest";
import { compareKeys } from "@/lib/fractional-order/fractional-order";
import { LIBRARY_SCHEMA_VERSION, isCurrentLibrarySchema } from "../schema";
import { createStarterLibrary } from "../starter-template";

describe("createStarterLibrary", () => {
  const library = createStarterLibrary();

  it("ships Work and Personal workspaces with Work active, at the current schema", () => {
    expect(library.schemaVersion).toBe(LIBRARY_SCHEMA_VERSION);
    expect(isCurrentLibrarySchema(library)).toBe(true);
    expect(library.workspaces.map((w) => w.id)).toEqual(["work", "personal"]);
    expect(library.activeWorkspaceId).toBe("work");
  });

  it("has a non-empty catalog with unique link ids", () => {
    const ids = library.catalog.map((link) => link.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only places links that exist in the catalog", () => {
    const catalogIds = new Set(library.catalog.map((link) => link.id));
    for (const workspace of library.workspaces) {
      for (const group of workspace.placements.edges.left) {
        for (const placement of group.links) {
          expect(catalogIds.has(placement.linkId)).toBe(true);
        }
      }
    }
  });

  it("orders edge groups and their links by ascending fractional key", () => {
    for (const workspace of library.workspaces) {
      const groups = workspace.placements.edges.left;
      for (let i = 1; i < groups.length; i++) {
        expect(compareKeys(groups[i - 1].orderKey, groups[i].orderKey)).toBeLessThan(0);
      }
      for (const group of groups) {
        for (let i = 1; i < group.links.length; i++) {
          expect(
            compareKeys(group.links[i - 1].orderKey, group.links[i].orderKey),
          ).toBeLessThan(0);
        }
      }
    }
  });
});
