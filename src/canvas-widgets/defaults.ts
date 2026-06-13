import type { Library, Workspace } from "@/library/types";
import { createDefaultCanvasWidgets } from "./config";

export function ensureWorkspaceCanvasWidgets(workspace: Workspace): Workspace {
  return {
    ...workspace,
    canvasWidgets: {
      ...createDefaultCanvasWidgets(),
      ...workspace.canvasWidgets,
    },
  };
}

export function ensureLibraryCanvasWidgets(library: Library): Library {
  return {
    ...library,
    workspaces: library.workspaces.map(ensureWorkspaceCanvasWidgets),
  };
}
