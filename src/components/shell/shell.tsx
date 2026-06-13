"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useApplyLibraryPatch,
  useLibrary,
  useMutateLibrary,
  useResetLibrary,
  useSaveLibrary,
} from "@/hooks/use-library";
import { StaleLibraryError } from "@/library/library";
import { usePomodoroPhaseAdvance } from "@/hooks/use-pomodoro-phase-advance";
import type { Library, Workspace } from "@/library/types";
import { getShellLayout } from "@/shell-frame/layout";
import { applyTheme } from "@/theme/theme";
import { reorderEdgeGroupOnRim } from "@/placement/placement";
import { Launcher } from "./launcher";
import { ShellConfigDialog } from "./shell-config-dialog";
import { ShellWorkspaceSurface } from "./shell-workspace-surface";
import { FocusRadioPlaybackProvider } from "./focus-radio-playback-context";
import { LoadingGate } from "@/components/branding/loading-gate";
import { ShellEdgeLayer } from "./shell-edge-layer";

type PanelBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function readPanelBounds(): PanelBounds {
  const layout = getShellLayout();
  return {
    left: layout.panelX,
    top: layout.panelY,
    width: layout.panelW,
    height: layout.panelH,
  };
}

export function Shell() {
  const { data: library, isLoading, isError, error } = useLibrary();
  const applyLibraryPatch = useApplyLibraryPatch();
  const saveLibraryMutation = useSaveLibrary();
  const resetLibrary = useResetLibrary();
  const [panelBounds, setPanelBounds] = useState<PanelBounds>(readPanelBounds);

  const activeWorkspace = library?.workspaces.find((w) => w.id === library.activeWorkspaceId);

  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      if (!library || workspaceId === library.activeWorkspaceId) {
        return;
      }

      applyLibraryPatch.mutate({ activeWorkspaceId: workspaceId });
    },
    [applyLibraryPatch, library],
  );

  useEffect(() => {
    function handleResize() {
      setPanelBounds(readPanelBounds());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleReorderGroup(groupId: string, targetSlotIndex: number) {
    if (!library) {
      return;
    }

    const updated = reorderEdgeGroupOnRim(library, "left", groupId, targetSlotIndex);
    saveLibraryMutation.mutate(updated);
  }

  if (isError && error instanceof StaleLibraryError) {
    return (
      <div className="library-stale-gate">
        <p className="library-stale-gate-copy">{error.message}</p>
        <button
          type="button"
          className="library-stale-gate-reset"
          onClick={() => resetLibrary.mutate()}
          disabled={resetLibrary.isPending}
        >
          Reset to starter template
        </button>
      </div>
    );
  }

  if (isLoading || !library || !activeWorkspace) {
    return <LoadingGate label="Loading shell…" />;
  }

  return (
    <ShellLoaded
      library={library}
      activeWorkspace={activeWorkspace}
      panelBounds={panelBounds}
      onReorderGroup={handleReorderGroup}
      onSwitchWorkspace={switchWorkspace}
      saveLibraryMutation={saveLibraryMutation}
    />
  );
}

type ShellLoadedProps = {
  library: Library;
  activeWorkspace: Workspace;
  panelBounds: PanelBounds;
  onReorderGroup: (groupId: string, targetSlotIndex: number) => void;
  onSwitchWorkspace: (workspaceId: string) => void;
  saveLibraryMutation: ReturnType<typeof useSaveLibrary>;
};

function ShellLoaded({
  library,
  activeWorkspace,
  panelBounds,
  onReorderGroup,
  onSwitchWorkspace,
  saveLibraryMutation,
}: ShellLoadedProps) {
  const mutateLibrary = useMutateLibrary();

  useEffect(() => {
    applyTheme(document.documentElement, activeWorkspace.theme);
  }, [activeWorkspace.theme]);

  const handlePomodoroAdvance = useCallback(
    (nextPomodoro: Workspace["internalTools"]["pomodoro"]) => {
      mutateLibrary.mutate((current) => ({
        ...current,
        workspaces: current.workspaces.map((entry) =>
          entry.id === activeWorkspace.id
            ? {
                ...entry,
                internalTools: {
                  ...entry.internalTools,
                  pomodoro: nextPomodoro,
                },
              }
            : entry,
        ),
      }));
    },
    [activeWorkspace.id, mutateLibrary],
  );

  usePomodoroPhaseAdvance(activeWorkspace, library, handlePomodoroAdvance);

  return (
    <FocusRadioPlaybackProvider library={library}>
      <div className="relative isolate h-screen w-screen overflow-hidden">
        <ShellWorkspaceSurface
          workspace={activeWorkspace}
          displayName={library.displayName}
          panelBounds={panelBounds}
          className="absolute inset-0"
        />

        <ShellEdgeLayer
          library={library}
          onReorderGroup={onReorderGroup}
          onSwitchWorkspace={onSwitchWorkspace}
          onUpdateInternalTools={(internalTools) =>
            saveLibraryMutation.mutate({
              ...library,
              workspaces: library.workspaces.map((workspace) =>
                workspace.id === library.activeWorkspaceId
                  ? { ...workspace, internalTools }
                  : workspace,
              ),
            })
          }
        />

        <Launcher library={library} />
        <ShellConfigDialog library={library} workspaceName={activeWorkspace.name} />
      </div>
    </FocusRadioPlaybackProvider>
  );
}
