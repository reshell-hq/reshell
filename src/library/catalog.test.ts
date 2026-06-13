import { describe, expect, it } from "vitest";
import { addCatalogLink, deleteCatalogLink, updateCatalogLink } from "./catalog";
import { loadOrSeedLibrary } from "./library";
import { createInMemoryLibraryStore } from "./store";

describe("addCatalogLink", () => {
  it("adds a link with a URL to the catalog", async () => {
    const store = createInMemoryLibraryStore();
    const library = await loadOrSeedLibrary(store);
    const beforeCount = library.catalog.length;

    const updated = addCatalogLink(library, { url: "https://example.com/docs" });

    expect(updated.catalog).toHaveLength(beforeCount + 1);
    const added = updated.catalog.find((link) => link.url === "https://example.com/docs");
    expect(added).toBeDefined();
    expect(added!.id).toBeTruthy();
  });

  it("stores optional title and image on a new catalog link", async () => {
    const store = createInMemoryLibraryStore();
    const library = await loadOrSeedLibrary(store);

    const updated = addCatalogLink(library, {
      url: "https://example.com/app",
      title: "Example App",
      image: "https://example.com/icon.png",
    });

    const added = updated.catalog.find((link) => link.url === "https://example.com/app");
    expect(added?.title).toBe("Example App");
    expect(added?.image).toBe("https://example.com/icon.png");
  });

  it("rejects a catalog link without a URL", async () => {
    const store = createInMemoryLibraryStore();
    const library = await loadOrSeedLibrary(store);

    expect(() => addCatalogLink(library, { url: "   " })).toThrow(/url is required/i);
  });
});

describe("updateCatalogLink", () => {
  it("updates an existing catalog link", async () => {
    const store = createInMemoryLibraryStore();
    const library = addCatalogLink(await loadOrSeedLibrary(store), {
      url: "https://example.com/old",
      title: "Old title",
    });
    const linkId = library.catalog.find((link) => link.url === "https://example.com/old")!.id;

    const updated = updateCatalogLink(library, linkId, {
      url: "https://example.com/new",
      title: "New title",
      image: "https://example.com/new.png",
    });

    const link = updated.catalog.find((entry) => entry.id === linkId);
    expect(link?.url).toBe("https://example.com/new");
    expect(link?.title).toBe("New title");
    expect(link?.image).toBe("https://example.com/new.png");
  });
});

describe("deleteCatalogLink", () => {
  it("removes a link from the catalog and all workspace placements", async () => {
    const store = createInMemoryLibraryStore();
    const seeded = await loadOrSeedLibrary(store);
    const withLink = addCatalogLink(seeded, {
      url: "https://example.com/remove-me",
      title: "Remove me",
    });
    const linkId = withLink.catalog.find((link) => link.title === "Remove me")!.id;
    const work = withLink.workspaces.find((workspace) => workspace.name === "Work")!;

    work.placements.edges.left[0].links.push({
      linkId,
      orderKey: "z99",
    });

    const updated = deleteCatalogLink(withLink, linkId);

    expect(updated.catalog.some((link) => link.id === linkId)).toBe(false);
    for (const workspace of updated.workspaces) {
      for (const edge of ["left", "top", "bottom"] as const) {
        for (const group of workspace.placements.edges[edge]) {
          expect(group.links.some((placement) => placement.linkId === linkId)).toBe(false);
        }
      }
    }
  });
});
