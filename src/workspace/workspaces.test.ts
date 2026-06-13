import { describe, expect, it } from "vitest";
import { loadOrSeedLibrary } from "@/library/library";
import { createInMemoryLibraryStore } from "@/library/store";
import {
  createWorkspace,
  cycleActiveWorkspace,
  deleteWorkspace,
  renameWorkspace,
} from "./workspaces";

describe("createWorkspace", () => {
  it("adds a named workspace with default theme and empty placements", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const beforeCount = library.workspaces.length;

    const updated = createWorkspace(library, "Side project");

    expect(updated.workspaces).toHaveLength(beforeCount + 1);
    const created = updated.workspaces.find((workspace) => workspace.name === "Side project");
    expect(created).toBeDefined();
    expect(created!.id).toBeTruthy();
    expect(created!.placements.edges.left).toEqual([]);
    expect(created!.theme.palette.background).toBeTruthy();
    expect(updated.activeWorkspaceId).toBe(library.activeWorkspaceId);
  });

  it("rejects a workspace without a name", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());

    expect(() => createWorkspace(library, "   ")).toThrow(/name is required/i);
  });
});

describe("renameWorkspace", () => {
  it("renames an existing workspace", async () => {
    const library = createWorkspace(await loadOrSeedLibrary(createInMemoryLibraryStore()), "Lab");
    const workspaceId = library.workspaces.find((workspace) => workspace.name === "Lab")!.id;

    const updated = renameWorkspace(library, workspaceId, "Laboratory");

    expect(updated.workspaces.find((workspace) => workspace.id === workspaceId)?.name).toBe(
      "Laboratory",
    );
  });
});

describe("cycleActiveWorkspace", () => {
  it("advances to the next workspace in list order", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const [first, second] = library.workspaces;

    const next = cycleActiveWorkspace({ ...library, activeWorkspaceId: first.id }, "next");
    expect(next.activeWorkspaceId).toBe(second.id);

    const wrapped = cycleActiveWorkspace({ ...library, activeWorkspaceId: second.id }, "next");
    expect(wrapped.activeWorkspaceId).toBe(first.id);
  });

  it("moves to the previous workspace with previous direction", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const [first, second] = library.workspaces;

    const previous = cycleActiveWorkspace({ ...library, activeWorkspaceId: first.id }, "previous");
    expect(previous.activeWorkspaceId).toBe(second.id);
  });
});

describe("deleteWorkspace", () => {
  it("removes a workspace from the library", async () => {
    const library = createWorkspace(await loadOrSeedLibrary(createInMemoryLibraryStore()), "Temp");
    const workspaceId = library.workspaces.find((workspace) => workspace.name === "Temp")!.id;

    const updated = deleteWorkspace(library, workspaceId);

    expect(updated.workspaces.some((workspace) => workspace.id === workspaceId)).toBe(false);
  });

  it("rejects deleting the last remaining workspace", async () => {
    let library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const onlyId = library.workspaces[0].id;
    for (const workspace of [...library.workspaces].slice(1)) {
      library = deleteWorkspace(library, workspace.id);
    }

    expect(() => deleteWorkspace(library, onlyId)).toThrow(/last workspace/i);
  });

  it("switches the active workspace when deleting the current one", async () => {
    const library = createWorkspace(await loadOrSeedLibrary(createInMemoryLibraryStore()), "Temp");
    const activeId = library.activeWorkspaceId;

    const updated = deleteWorkspace(library, activeId);

    expect(updated.activeWorkspaceId).not.toBe(activeId);
    expect(updated.workspaces.some((workspace) => workspace.id === updated.activeWorkspaceId)).toBe(
      true,
    );
  });
});
