import type { Library } from "@/library/types";

export type ControlCenterWorkspaceRow = {
  id: string;
  name: string;
  active: boolean;
  accentColor: string;
};

export function buildControlCenterWorkspaceRows(library: Library): ControlCenterWorkspaceRow[] {
  return library.workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    active: workspace.id === library.activeWorkspaceId,
    accentColor: workspace.theme.palette.accent,
  }));
}
