"use client";

import { Shell } from "@/components/shell";
import { useReshellState } from "@/hooks/use-reshell-state";
import type { BookmarkGroup } from "@/lib/config";
import type { ShellEdge } from "@/lib/shell/types";
import { BookmarkGroupSlot } from "./bookmark-group-slot";

// Bookmark groups live on these edges only; `right` is reserved for tools
// (plans 011–013) and the config schema omits it.
//
// ponytail: `top` is also the command center's edge. Because the command center
// and these groups each mount their own `<Shell.Edge side="top">`, and the
// shell distributes anchors *within* one edge (not across edges), a top
// bookmark group's handle collides with the command-center handle at
// top-centre. The starter config keeps bookmark groups off `top` and AGENTS.md
// documents the reservation; `top` stays in the union so a deliberate config
// still renders. Upgrade path (deferred): merge same-edge `Shell.Edge`s or add
// cross-edge handle-collision avoidance in the shell geometry (plan 017+).
const BOOKMARK_EDGES = ["left", "top", "bottom"] as const satisfies ShellEdge[];

/**
 * Projects the active workspace's config bookmark groups onto shell edges: one
 * `<Shell.Edge>` per non-empty edge, each holding its groups in array order.
 * App-decoupled (ADR-0009) — reads everything via the provider hook.
 */
export function WorkspaceEdges() {
  const { activeWorkspace } = useReshellState();
  const bookmarks = activeWorkspace.bookmarks;

  if (!bookmarks) {
    return null;
  }

  return (
    <>
      {BOOKMARK_EDGES.map((edge) => {
        const groups: BookmarkGroup[] | undefined = bookmarks[edge];
        if (!groups || groups.length === 0) {
          return null;
        }
        return (
          <Shell.Edge key={edge} side={edge}>
            {groups.map((group, index) => (
              <BookmarkGroupSlot
                key={`${edge}:${index}`}
                group={group}
                edge={edge}
                index={index}
              />
            ))}
          </Shell.Edge>
        );
      })}
    </>
  );
}
