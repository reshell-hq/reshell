import type { Library, Workspace } from "@/lib/library/types";
import { createDefaultWorkspaceInternalTools } from "./pomodoro";
import type { WorkspaceInternalTools } from "./types";

/**
 * Read a workspace's internal-tools record, defaulting to a fresh per-workspace
 * record when absent (the field is seeded by the starter template but optional
 * on the type, so a library saved before this slice still resolves cleanly).
 */
export function resolveWorkspaceInternalTools(
  workspace: Workspace,
): WorkspaceInternalTools {
  return workspace.internalTools ?? createDefaultWorkspaceInternalTools();
}

/**
 * Return a new library with one workspace's internal-tools record replaced. Tool
 * state is per-workspace (CONTEXT: "Internal tool"), so this only touches the
 * named workspace — Work and Personal keep independent tasks and timers.
 */
export function setWorkspaceInternalTools(
  library: Library,
  workspaceId: string,
  internalTools: WorkspaceInternalTools,
): Library {
  return {
    ...library,
    workspaces: library.workspaces.map((workspace) =>
      workspace.id === workspaceId
        ? { ...workspace, internalTools }
        : workspace,
    ),
  };
}
