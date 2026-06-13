import { describe, expect, it } from "vitest";
import { loadOrSeedLibrary } from "@/library/library";
import { createInMemoryLibraryStore } from "@/library/store";
import { buildControlCenterWorkspaceRows } from "./workspaces";

describe("buildControlCenterWorkspaceRows", () => {
  it("lists workspaces with the active one marked for the control center tab", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const activeId = library.activeWorkspaceId;

    const rows = buildControlCenterWorkspaceRows(library);

    expect(rows).toHaveLength(library.workspaces.length);
    expect(rows.filter((row) => row.active)).toHaveLength(1);
    expect(rows.find((row) => row.active)).toMatchObject({
      id: activeId,
      name: library.workspaces.find((workspace) => workspace.id === activeId)!.name,
      accentColor: library.workspaces.find((workspace) => workspace.id === activeId)!.theme.palette
        .accent,
    });
  });
});
