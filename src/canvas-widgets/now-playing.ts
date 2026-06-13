import { resolveFocusRadioNowPlaying } from "@/focus-radio/playback";
import type { Library, Workspace } from "@/library/types";

export function shouldShowCanvasNowPlayingWidget(workspace: Workspace, library: Library): boolean {
  if (!workspace.canvasWidgets.nowPlaying) {
    return false;
  }

  if (workspace.canvasNowPlayingDismissed) {
    return false;
  }

  return resolveFocusRadioNowPlaying(library) !== null;
}

export function dismissCanvasNowPlaying(library: Library, workspaceId: string): Library {
  return {
    ...library,
    workspaces: library.workspaces.map((workspace) =>
      workspace.id === workspaceId
        ? {
            ...workspace,
            canvasNowPlayingDismissed: true,
          }
        : workspace,
    ),
  };
}

export function clearCanvasNowPlayingDismiss(library: Library): Library {
  return {
    ...library,
    workspaces: library.workspaces.map((workspace) => ({
      ...workspace,
      canvasNowPlayingDismissed: false,
    })),
  };
}
