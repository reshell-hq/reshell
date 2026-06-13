import type { Library, Workspace } from "@/library/types";

export function resolveWorkspaceIcsFeedUrl(workspace: Workspace): string | null {
  const trimmed = workspace.icsFeedUrl?.trim();
  return trimmed ? trimmed : null;
}

export function updateWorkspaceIcsFeedUrl(
  library: Library,
  workspaceId: string,
  url: string | null,
): Library {
  if (!library.workspaces.some((workspace) => workspace.id === workspaceId)) {
    throw new Error(`Workspace "${workspaceId}" not found`);
  }

  const trimmed = url?.trim();

  return {
    ...library,
    workspaces: library.workspaces.map((workspace) =>
      workspace.id === workspaceId
        ? trimmed
          ? { ...workspace, icsFeedUrl: trimmed }
          : (({ icsFeedUrl: _removed, ...rest }) => rest)(workspace)
        : workspace,
    ),
  };
}
