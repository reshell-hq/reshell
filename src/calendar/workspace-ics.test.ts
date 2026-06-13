import { describe, expect, it } from "vitest";
import { loadOrSeedLibrary } from "@/library/library";
import { createInMemoryLibraryStore } from "@/library/store";
import { resolveWorkspaceIcsFeedUrl, updateWorkspaceIcsFeedUrl } from "./workspace-ics";

describe("updateWorkspaceIcsFeedUrl", () => {
  it("stores a trimmed ICS feed URL on the workspace", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspaceId = library.activeWorkspaceId;

    const updated = updateWorkspaceIcsFeedUrl(
      library,
      workspaceId,
      "  https://calendar.example.com/work.ics  ",
    );

    const workspace = updated.workspaces.find((entry) => entry.id === workspaceId)!;
    expect(workspace.icsFeedUrl).toBe("https://calendar.example.com/work.ics");
    expect(resolveWorkspaceIcsFeedUrl(workspace)).toBe("https://calendar.example.com/work.ics");
  });

  it("clears the ICS feed URL when given null or blank input", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspaceId = library.activeWorkspaceId;
    const withUrl = updateWorkspaceIcsFeedUrl(
      library,
      workspaceId,
      "https://calendar.example.com/work.ics",
    );

    const cleared = updateWorkspaceIcsFeedUrl(withUrl, workspaceId, "   ");

    const workspace = cleared.workspaces.find((entry) => entry.id === workspaceId)!;
    expect(workspace.icsFeedUrl).toBeUndefined();
    expect(resolveWorkspaceIcsFeedUrl(workspace)).toBeNull();
  });
});

describe("resolveWorkspaceIcsFeedUrl", () => {
  it("returns null when the workspace has no configured feed", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspace = library.workspaces.find((entry) => entry.id === library.activeWorkspaceId)!;

    expect(resolveWorkspaceIcsFeedUrl(workspace)).toBeNull();
  });
});
