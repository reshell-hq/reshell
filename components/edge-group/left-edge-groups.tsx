"use client";

import { Shell } from "@/components/shell";
import { resolveEdgeHandleDisplay } from "@/lib/edge-handle/edge-handle";
import {
  resolveEdgeGroupFlyout,
  resolveEdgeGroups,
} from "@/lib/placement/placement";
import type { Library } from "@/lib/library/types";
import { EdgeFlyout } from "./edge-flyout";
import { EdgeHandle } from "./edge-handle";

/**
 * Composes the active workspace's left-rim edge groups (CONTEXT: "Edge group")
 * as left-edge `Shell.Slot`s, ordered by edge order. Each slot's handle is the
 * group's edge handle and its content is the edge flyout. Group order is read
 * from the library (persisted via fractional indices); live drag reordering is
 * deferred to a later slice.
 */
export function LeftEdgeGroups({ library }: { library: Library }) {
  const groups = resolveEdgeGroups(library, "left");
  if (groups.length === 0) {
    return null;
  }

  const active = library.workspaces.find(
    (workspace) => workspace.id === library.activeWorkspaceId,
  );
  const textColor = active?.theme.palette.text ?? "inherit";

  return (
    <Shell.Edge side="left">
      {groups.map((group) => {
        const flyout = resolveEdgeGroupFlyout(library, "left", group.id);
        return (
          <Shell.Slot
            key={group.id}
            id={`edge-group-${group.id}`}
            handle={<EdgeHandle display={resolveEdgeHandleDisplay(group)} />}
            handleLabel={`Open ${group.name}`}
          >
            <EdgeFlyout
              links={flyout.links}
              hasMore={flyout.hasMore}
              textColor={textColor}
            />
          </Shell.Slot>
        );
      })}
    </Shell.Edge>
  );
}
