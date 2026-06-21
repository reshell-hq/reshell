"use client";

import { useCallback } from "react";
import { Shell } from "@/components/shell";
import { useLibrary } from "@/components/library/library-provider";
import { usePomodoroPhaseAdvance } from "@/hooks/use-pomodoro-phase-advance";
import {
  internalToolSlotId,
  resolveInternalToolHandle,
} from "@/lib/internal-tools/handles";
import { createDefaultWorkspaceInternalTools } from "@/lib/internal-tools/pomodoro";
import { INTERNAL_TOOL_IDS } from "@/lib/internal-tools/types";
import type { WorkspaceInternalTools } from "@/lib/internal-tools/types";
import {
  resolveWorkspaceInternalTools,
  setWorkspaceInternalTools,
} from "@/lib/internal-tools/workspace-tools";
import type { Library } from "@/lib/library/types";
import { GhostHandle } from "./ghost-handle";
import { PomodoroFlyout } from "./pomodoro-flyout";
import { TasksFlyout } from "./tasks-flyout";

/**
 * Composes the active workspace's internal tools (CONTEXT: "Internal tool") as
 * right-edge `Shell.Slot`s, mirroring the left rim's handle/flyout model. v1
 * tools — pomodoro and focus tasks — render in a fixed order (rim drag-reorder
 * deferred) with ghost handles (glyph only, no card) to suit the narrow right
 * rim. Tool state is the active workspace's per-workspace internal-tools record;
 * changes persist through the injected library store.
 */
export function RightRimTools({ library }: { library: Library }) {
  const { save } = useLibrary();

  const active = library.workspaces.find(
    (workspace) => workspace.id === library.activeWorkspaceId,
  );

  const internalTools = active
    ? resolveWorkspaceInternalTools(active)
    : null;
  const activeId = active?.id;

  const handleChange = useCallback(
    (next: WorkspaceInternalTools) => {
      if (!activeId) {
        return;
      }
      void save(setWorkspaceInternalTools(library, activeId, next));
    },
    [save, library, activeId],
  );

  // Auto-advance the timer / play the chime when an interval ends. Owned here
  // (above the slots) so it fires once despite the slot rendering twice. The
  // hook runs unconditionally (rules of hooks); it is disabled when there is no
  // active workspace, so the default record below is never advanced.
  usePomodoroPhaseAdvance(
    internalTools ?? createDefaultWorkspaceInternalTools(),
    internalTools !== null,
    (pomodoro) => {
      if (internalTools) {
        handleChange({ ...internalTools, pomodoro });
      }
    },
  );

  if (!active || !internalTools) {
    return null;
  }

  const textColor = active.theme.palette.text;

  return (
    <Shell.Edge side="right">
      {INTERNAL_TOOL_IDS.map((toolId) => {
        const { label, glyph } = resolveInternalToolHandle(toolId);
        return (
          <Shell.Slot
            key={toolId}
            id={internalToolSlotId(toolId)}
            handle={<span aria-hidden>{glyph}</span>}
            handleLabel={label}
            Handle={GhostHandle}
          >
            {toolId === "pomodoro" ? (
              <PomodoroFlyout
                internalTools={internalTools}
                onChange={handleChange}
                textColor={textColor}
              />
            ) : (
              <TasksFlyout
                internalTools={internalTools}
                onChange={handleChange}
                textColor={textColor}
              />
            )}
          </Shell.Slot>
        );
      })}
    </Shell.Edge>
  );
}
