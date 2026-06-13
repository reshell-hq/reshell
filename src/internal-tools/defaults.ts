import type { Library, Workspace } from "@/library/types";
import { ensureLibraryCanvasWidgets } from "@/canvas-widgets/defaults";
import { ensureLibraryFocusRadio } from "@/focus-radio/defaults";
import { normalizeWorkspacePlacementsInLibrary } from "@/library/migrate-placements";
import { createDefaultWorkspaceInternalTools } from "./pomodoro";

export function ensureWorkspaceInternalTools(workspace: Workspace): Workspace {
  const defaults = createDefaultWorkspaceInternalTools();
  const internalTools = workspace.internalTools ?? defaults;

  return {
    ...workspace,
    internalTools: {
      ...defaults,
      ...internalTools,
      pomodoro: {
        ...defaults.pomodoro,
        ...internalTools.pomodoro,
        mode: internalTools.pomodoro.mode ?? "pomodoro",
        countdownMinutes: internalTools.pomodoro.countdownMinutes ?? null,
        completedWorkSessions: internalTools.pomodoro.completedWorkSessions ?? 0,
      },
      customFocusSplit: internalTools.customFocusSplit ?? null,
    },
  };
}

export function ensureLibraryDefaults(library: Library): Library {
  const normalized = normalizeWorkspacePlacementsInLibrary(library);

  return ensureLibraryFocusRadio(
    ensureLibraryCanvasWidgets({
      ...library,
      ...normalized,
      workspaces: normalized.workspaces.map(ensureWorkspaceInternalTools),
    }),
  );
}
