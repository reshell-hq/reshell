import { sortByKey } from "@/lib/fractional-order/fractional-order";
import { moveEdgeGroupToSlot } from "@/lib/edge-order/edge-order";
import type {
  EdgeGroup,
  EdgePosition,
  Library,
  Link,
} from "@/lib/library/types";

/**
 * Placement queries (CONTEXT: "Placement") — where catalog links surface within
 * the active workspace's edge groups, and in what order. Read helpers resolve
 * groups and their flyout links from the library; the mutation reorders groups
 * along an edge using fractional order (CONTEXT: "Edge order").
 */

/** Edge flyouts preview up to this many links before "see more". */
export const EDGE_PREVIEW_LIMIT = 8;

export type ResolvedEdgeLinks = {
  links: Link[];
  totalCount: number;
  hasMore: boolean;
};

function activeWorkspace(library: Library) {
  return library.workspaces.find((w) => w.id === library.activeWorkspaceId);
}

/** Edge groups on one edge of the active workspace, in edge order. */
export function resolveEdgeGroups(
  library: Library,
  edge: EdgePosition,
): EdgeGroup[] {
  const workspace = activeWorkspace(library);
  if (!workspace) {
    return [];
  }

  return sortByKey(workspace.placements.edges[edge], (group) => group.orderKey);
}

/** Catalog links placed in one edge group, in link order. */
export function resolveEdgeGroupLinks(
  library: Library,
  edge: EdgePosition,
  groupId: string,
): Link[] {
  const workspace = activeWorkspace(library);
  if (!workspace) {
    return [];
  }

  const group = workspace.placements.edges[edge].find(
    (entry) => entry.id === groupId,
  );
  if (!group) {
    return [];
  }

  const catalogById = new Map(library.catalog.map((link) => [link.id, link]));

  return sortByKey(group.links, (placement) => placement.orderKey)
    .map((placement) => catalogById.get(placement.linkId))
    .filter((link): link is Link => link !== undefined);
}

/** Flyout preview for one edge group: first 8 links plus a "see more" flag. */
export function resolveEdgeGroupFlyout(
  library: Library,
  edge: EdgePosition,
  groupId: string,
): ResolvedEdgeLinks {
  const allLinks = resolveEdgeGroupLinks(library, edge, groupId);

  return {
    links: allLinks.slice(0, EDGE_PREVIEW_LIMIT),
    totalCount: allLinks.length,
    hasMore: allLinks.length > EDGE_PREVIEW_LIMIT,
  };
}

/**
 * Reorder one edge group along its rim and return the updated library. The new
 * order persists via fractional indices, so saving the result keeps the new
 * group order. Live drag is deferred (this slice has no drag trigger).
 */
export function reorderEdgeGroupOnRim(
  library: Library,
  edge: EdgePosition,
  groupId: string,
  targetSlotIndex: number,
): Library {
  const workspace = activeWorkspace(library);
  if (!workspace) {
    return library;
  }

  const reordered = moveEdgeGroupToSlot(
    workspace.placements.edges[edge],
    groupId,
    targetSlotIndex,
  );

  return {
    ...library,
    workspaces: library.workspaces.map((entry) =>
      entry.id === workspace.id
        ? {
            ...entry,
            placements: {
              ...entry.placements,
              edges: {
                ...entry.placements.edges,
                [edge]: reordered,
              },
            },
          }
        : entry,
    ),
  };
}
