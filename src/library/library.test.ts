import { describe, expect, it } from "vitest";
import { addEdgeGroup, addLinkToEdgeGroup } from "@/placement/placement-mutations";
import { serializeSnapshot } from "@/snapshot/snapshot";
import { addCatalogLink as addCatalogLinkToLibrary } from "./catalog";
import {
  addCatalogLink,
  applyPatch,
  getLibrary,
  importLibrarySnapshot,
  loadOrSeedLibrary,
  mutateLibrary,
  resetLibrary,
  saveLibrary,
} from "./library";
import { getThemePreset } from "@/theme/theme-presets";
import { LIBRARY_SCHEMA_VERSION, StaleLibraryError } from "./schema";
import { STARTER_CATALOG } from "./starter-template";
import { createInMemoryLibraryStore } from "./store";
import { EDGE_PREVIEW_LIMIT } from "@/placement/placement";

describe("loadOrSeedLibrary", () => {
  it("seeds libraries with the current schema version", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());

    expect(library.schemaVersion).toBe(LIBRARY_SCHEMA_VERSION);
  });

  it("rejects stale libraries missing the current schema version", async () => {
    const store = createInMemoryLibraryStore();
    const library = await loadOrSeedLibrary(store);
    const stale = { ...library, schemaVersion: 1 };

    await store.write(stale);

    await expect(loadOrSeedLibrary(store)).rejects.toBeInstanceOf(StaleLibraryError);
  });

  it("returns starter template with Work and Personal workspaces when store is empty", async () => {
    const store = createInMemoryLibraryStore();

    const library = await loadOrSeedLibrary(store);

    expect(library.workspaces.map((w) => w.name)).toEqual(["Work", "Personal"]);
    expect(library.activeWorkspaceId).toBe(library.workspaces[0].id);
  });

  it("seeds each workspace with a distinct theme", async () => {
    const store = createInMemoryLibraryStore();

    const library = await loadOrSeedLibrary(store);
    const [work, personal] = library.workspaces;

    expect(work.theme.backgroundUrl).not.toBe(personal.theme.backgroundUrl);
    expect(work.theme.palette.background).not.toBe(personal.theme.palette.background);
  });

  it("seeds Work and Personal from the theme preset catalog", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const work = library.workspaces.find((workspace) => workspace.name === "Work")!;
    const personal = library.workspaces.find((workspace) => workspace.name === "Personal")!;
    const workPreset = getThemePreset("work")!;
    const personalPreset = getThemePreset("personal")!;

    expect(work.theme.appliedPresetId).toBe("work");
    expect(work.theme.palette).toEqual(workPreset.theme.palette);
    expect(work.theme.widgets).toEqual(workPreset.theme.widgets);
    expect(personal.theme.appliedPresetId).toBe("personal");
    expect(personal.theme.palette).toEqual(personalPreset.theme.palette);
    expect(personal.theme.widgets).toEqual(personalPreset.theme.widgets);
  });

  it("seeds workspaces without pin placements", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());

    for (const workspace of library.workspaces) {
      expect(workspace.placements).toEqual({ edges: workspace.placements.edges });
      expect("pins" in workspace.placements).toBe(false);
    }
  });

  it("seeds a large catalog with enough left-edge links to open the launcher", async () => {
    const store = createInMemoryLibraryStore();

    const library = await loadOrSeedLibrary(store);
    const work = library.workspaces.find((workspace) => workspace.name === "Work")!;

    expect(library.catalog.length).toBe(STARTER_CATALOG.length);
    expect(library.catalog.length).toBeGreaterThanOrEqual(29);
    const ship = work.placements.edges.left.find((group) => group.name === "Ship")!;
    expect(ship.links.length).toBeGreaterThan(EDGE_PREVIEW_LIMIT);
    expect(work.placements.edges.left.length).toBeGreaterThan(1);
    const today = work.placements.edges.left.find((group) => group.name === "Today")!;
    expect(today.name).toBe("Today");
    expect(today.handleIcon).toBe("☀️");
  });

  it("does not re-seed when the store already has a library", async () => {
    const store = createInMemoryLibraryStore();
    const seeded = await loadOrSeedLibrary(store);
    seeded.catalog = [];
    await saveLibrary(store, seeded);

    const loaded = await loadOrSeedLibrary(store);

    expect(loaded.catalog).toEqual([]);
    expect(loaded.workspaces.map((w) => w.name)).toEqual(["Work", "Personal"]);
  });
});

describe("saveLibrary and getLibrary", () => {
  it("persists the library so a later read returns the same data", async () => {
    const store = createInMemoryLibraryStore();
    const library = await loadOrSeedLibrary(store);
    library.catalog[0].title = "GitHub — updated";

    await saveLibrary(store, library);
    const retrieved = await getLibrary(store);

    expect(retrieved?.catalog[0].title).toBe("GitHub — updated");
  });
});

describe("resetLibrary", () => {
  it("wipes custom data and re-seeds the starter template", async () => {
    const store = createInMemoryLibraryStore();
    const library = await loadOrSeedLibrary(store);
    library.catalog = [];
    library.workspaces[0].name = "Custom";
    await saveLibrary(store, library);

    const reset = await resetLibrary(store);

    expect(reset.schemaVersion).toBe(LIBRARY_SCHEMA_VERSION);
    expect(reset.catalog.length).toBe(STARTER_CATALOG.length);
    expect(reset.workspaces.map((workspace) => workspace.name)).toEqual(["Work", "Personal"]);
    expect((await getLibrary(store))?.catalog.length).toBe(STARTER_CATALOG.length);
  });
});

describe("applyPatch", () => {
  it("switches the active workspace", async () => {
    const store = createInMemoryLibraryStore();
    const library = await loadOrSeedLibrary(store);
    const personalId = library.workspaces.find((w) => w.name === "Personal")!.id;

    const updated = await applyPatch(store, { activeWorkspaceId: personalId });

    expect(updated.activeWorkspaceId).toBe(personalId);
    expect((await getLibrary(store))?.activeWorkspaceId).toBe(personalId);
  });

  it("merges shortcut binding updates into the library", async () => {
    const store = createInMemoryLibraryStore();
    await loadOrSeedLibrary(store);

    const updated = await applyPatch(store, {
      shortcuts: { focusCommandBar: "Meta+k" },
    });

    expect(updated.shortcuts.focusCommandBar).toBe("Meta+k");
    expect(updated.shortcuts.cycleWorkspace).toBe("Control+Tab");
    expect((await getLibrary(store))?.shortcuts.focusCommandBar).toBe("Meta+k");
  });
});

describe("catalog mutations via store", () => {
  it("persists a newly added catalog link", async () => {
    const store = createInMemoryLibraryStore();
    await loadOrSeedLibrary(store);
    const beforeCount = (await getLibrary(store))!.catalog.length;

    await addCatalogLink(store, { url: "https://example.com/persisted", title: "Persisted" });

    const loaded = await getLibrary(store);
    expect(loaded?.catalog).toHaveLength(beforeCount + 1);
    expect(loaded?.catalog.some((link) => link.title === "Persisted")).toBe(true);
  });
});

describe("mutateLibrary", () => {
  it("persists arbitrary library mutations", async () => {
    const store = createInMemoryLibraryStore();
    const library = await loadOrSeedLibrary(store);
    const beforeCount = library.workspaces.find((w) => w.id === library.activeWorkspaceId)!
      .placements.edges.left.length;

    await mutateLibrary(store, (current) =>
      addEdgeGroup(current, current.activeWorkspaceId, "left", { name: "Config test" }),
    );

    const loaded = await getLibrary(store);
    const leftCount = loaded!.workspaces.find((w) => w.id === loaded!.activeWorkspaceId)!.placements
      .edges.left.length;
    expect(leftCount).toBe(beforeCount + 1);
  });
});

describe("importLibrarySnapshot", () => {
  it("replaces the stored library with a deserialized snapshot", async () => {
    const store = createInMemoryLibraryStore();
    const seeded = await loadOrSeedLibrary(store);
    const withLink = addCatalogLinkToLibrary(seeded, {
      url: "https://example.com/from-snapshot",
      title: "From snapshot",
    });
    const newLinkId = withLink.catalog.find((link) => link.title === "From snapshot")!.id;
    const groupId = withLink.workspaces.find((workspace) => workspace.id === withLink.activeWorkspaceId)!
      .placements.edges.left[0]!.id;
    const snapshotLibrary = addLinkToEdgeGroup(
      withLink,
      withLink.activeWorkspaceId,
      "left",
      groupId,
      newLinkId,
    );
    const yaml = serializeSnapshot(snapshotLibrary);
    await saveLibrary(store, { ...seeded, catalog: [] });

    const imported = await importLibrarySnapshot(store, yaml);
    const loaded = await getLibrary(store);

    expect(imported.catalog.some((link) => link.title === "From snapshot")).toBe(true);
    expect(loaded).toEqual(imported);
  });

  it("leaves the library unchanged when snapshot YAML is invalid", async () => {
    const store = createInMemoryLibraryStore();
    const seeded = await loadOrSeedLibrary(store);

    await expect(importLibrarySnapshot(store, "version: 99")).rejects.toThrow(
      /unsupported snapshot version/i,
    );

    const loaded = await getLibrary(store);
    expect(loaded).toEqual(seeded);
  });
});
