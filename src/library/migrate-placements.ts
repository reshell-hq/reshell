import type { EdgePlacements, Workspace, WorkspacePlacements } from "./types";

type LegacyWorkspacePlacements = {
  edges: EdgePlacements;
  pins?: unknown;
};

export function normalizeWorkspacePlacements(
  placements: LegacyWorkspacePlacements,
): WorkspacePlacements {
  return { edges: placements.edges };
}

export function normalizeWorkspacePlacementsInLibrary(library: {
  workspaces: Array<Workspace & { placements: LegacyWorkspacePlacements }>;
}): { workspaces: Workspace[] } {
  return {
    workspaces: library.workspaces.map((workspace) => ({
      ...workspace,
      placements: normalizeWorkspacePlacements(workspace.placements),
    })),
  };
}
