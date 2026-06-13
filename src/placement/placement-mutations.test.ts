import { describe, expect, it } from "vitest";
import {
  addEdgeGroup,
  addLinkToEdgeGroup,
  deleteEdgeGroup,
  moveLinkInEdgeGroup,
  removeLinkFromEdgeGroup,
  updateEdgeGroup,
} from "./placement-mutations";
import { resolveEdgeGroupLinks, resolveEdgeGroups } from "./placement";
import { loadOrSeedLibrary } from "@/library/library";
import { addCatalogLink } from "@/library/catalog";

async function seededLibrary() {
  return loadOrSeedLibrary({ read: async () => null, write: async () => {} });
}

async function libraryWithFreshLink() {
  const library = await seededLibrary();
  return addCatalogLink(library, {
    url: "https://fresh-link.example.com",
    title: "Fresh link",
  });
}

describe("addEdgeGroup", () => {
  it("adds an edge group to the active workspace on the chosen edge", async () => {
    const library = await seededLibrary();
    const workspaceId = library.activeWorkspaceId;
    const beforeCount = library.workspaces.find((w) => w.id === workspaceId)!.placements.edges.left
      .length;

    const updated = addEdgeGroup(library, workspaceId, "left", {
      name: "Side projects",
      handleIcon: "🚀",
    });

    const groups = resolveEdgeGroups(updated, "left");
    expect(groups).toHaveLength(beforeCount + 1);
    const added = groups.find((group) => group.name === "Side projects");
    expect(added?.handleIcon).toBe("🚀");
    expect(added?.links).toEqual([]);
  });
});

describe("updateEdgeGroup", () => {
  it("updates edge group name and handle icon", async () => {
    const seeded = await seededLibrary();
    const library = addEdgeGroup(seeded, seeded.activeWorkspaceId, "left", {
      name: "Draft",
      handleIcon: "📝",
    });
    const groupId = resolveEdgeGroups(library, "left").find((g) => g.name === "Draft")!.id;

    const updated = updateEdgeGroup(library, seeded.activeWorkspaceId, "left", groupId, {
      name: "Drafts",
      handleIcon: "📄",
    });

    const group = resolveEdgeGroups(updated, "left").find((entry) => entry.id === groupId);
    expect(group?.name).toBe("Drafts");
    expect(group?.handleIcon).toBe("📄");
  });
});

describe("deleteEdgeGroup", () => {
  it("removes an edge group from the workspace edge", async () => {
    const seeded = await seededLibrary();
    const library = addEdgeGroup(seeded, seeded.activeWorkspaceId, "left", {
      name: "Temporary",
    });
    const groupId = resolveEdgeGroups(library, "left").find((g) => g.name === "Temporary")!.id;

    const updated = deleteEdgeGroup(library, seeded.activeWorkspaceId, "left", groupId);

    expect(resolveEdgeGroups(updated, "left").some((group) => group.id === groupId)).toBe(false);
  });
});

describe("edge group link placements", () => {
  it("assigns a catalog link to an edge group", async () => {
    const library = await libraryWithFreshLink();
    const linkId = library.catalog.find((link) => link.url.includes("fresh-link"))!.id;
    const group = resolveEdgeGroups(library, "left")[0];

    const updated = addLinkToEdgeGroup(
      library,
      library.activeWorkspaceId,
      "left",
      group.id,
      linkId,
    );

    expect(resolveEdgeGroupLinks(updated, "left", group.id).map((link) => link.id)).toContain(
      linkId,
    );
  });

  it("allows the same catalog link in multiple edge groups", async () => {
    const seeded = await libraryWithFreshLink();
    const linkId = seeded.catalog.find((link) => link.url.includes("fresh-link"))!.id;
    const [first, second] = resolveEdgeGroups(seeded, "left");

    const withFirst = addLinkToEdgeGroup(
      seeded,
      seeded.activeWorkspaceId,
      "left",
      first.id,
      linkId,
    );
    const updated = addLinkToEdgeGroup(
      withFirst,
      seeded.activeWorkspaceId,
      "left",
      second.id,
      linkId,
    );

    expect(
      resolveEdgeGroupLinks(updated, "left", first.id).some((link) => link.id === linkId),
    ).toBe(true);
    expect(
      resolveEdgeGroupLinks(updated, "left", second.id).some((link) => link.id === linkId),
    ).toBe(true);
  });

  it("removes a link from an edge group without deleting it from the catalog", async () => {
    const seeded = await libraryWithFreshLink();
    const linkId = seeded.catalog.find((link) => link.url.includes("fresh-link"))!.id;
    const group = resolveEdgeGroups(seeded, "left")[0];
    const withLink = addLinkToEdgeGroup(seeded, seeded.activeWorkspaceId, "left", group.id, linkId);

    const updated = removeLinkFromEdgeGroup(
      withLink,
      seeded.activeWorkspaceId,
      "left",
      group.id,
      linkId,
    );

    expect(
      resolveEdgeGroupLinks(updated, "left", group.id).some((link) => link.id === linkId),
    ).toBe(false);
    expect(updated.catalog.some((link) => link.id === linkId)).toBe(true);
  });

  it("reorders a link within an edge group", async () => {
    const seeded = await libraryWithFreshLink();
    const withGroup = addEdgeGroup(seeded, seeded.activeWorkspaceId, "left", {
      name: "Reorder test",
    });
    const group = resolveEdgeGroups(withGroup, "left").find(
      (entry) => entry.name === "Reorder test",
    )!;
    const firstId = withGroup.catalog.find((link) => link.url.includes("fresh-link"))!.id;
    const withSecondLink = addCatalogLink(withGroup, {
      url: "https://second-fresh.example.com",
      title: "Second fresh",
    });
    const secondId = withSecondLink.catalog.find((link) => link.url.includes("second-fresh"))!.id;

    const withLinks = addLinkToEdgeGroup(
      addLinkToEdgeGroup(
        withSecondLink,
        withSecondLink.activeWorkspaceId,
        "left",
        group.id,
        firstId,
      ),
      withSecondLink.activeWorkspaceId,
      "left",
      group.id,
      secondId,
    );

    const reordered = moveLinkInEdgeGroup(
      withLinks,
      withSecondLink.activeWorkspaceId,
      "left",
      group.id,
      secondId,
      0,
    );

    expect(resolveEdgeGroupLinks(reordered, "left", group.id).map((link) => link.id)).toEqual([
      secondId,
      firstId,
    ]);
  });
});
