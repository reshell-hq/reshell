import { sortByKey } from "@/fractional-order/fractional-order";
import { moveEdgeGroupToSlot } from "@/edge-order/edge-order";
import type { EdgeGroup, EdgePosition, Library, Link } from "@/library/types";

export const EDGE_PREVIEW_LIMIT = 8;

export type ResolvedEdgeLinks = {
  links: Link[];
  totalCount: number;
  hasMore: boolean;
};

function activeWorkspace(library: Library) {
  return library.workspaces.find((w) => w.id === library.activeWorkspaceId);
}

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

  const reordered = moveEdgeGroupToSlot(workspace.placements.edges[edge], groupId, targetSlotIndex);

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

export function resolveEdgeGroupName(
  library: Library,
  edge: EdgePosition,
  groupId: string,
): string | null {
  const workspace = activeWorkspace(library);
  const group = workspace?.placements.edges[edge].find((entry) => entry.id === groupId);
  return group?.name ?? null;
}

export function resolveEdgeGroups(library: Library, edge: EdgePosition): EdgeGroup[] {
  const workspace = activeWorkspace(library);
  if (!workspace) {
    return [];
  }

  return sortByKey(workspace.placements.edges[edge], (group) => group.orderKey);
}

export function resolveEdgeGroupLinks(
  library: Library,
  edge: EdgePosition,
  groupId: string,
): Link[] {
  const workspace = activeWorkspace(library);
  if (!workspace) {
    return [];
  }

  const group = workspace.placements.edges[edge].find((entry) => entry.id === groupId);
  if (!group) {
    return [];
  }

  const catalogById = new Map(library.catalog.map((link) => [link.id, link]));

  return sortByKey(group.links, (placement) => placement.orderKey)
    .map((placement) => catalogById.get(placement.linkId))
    .filter((link): link is Link => link !== undefined);
}

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

export function resolveEdgeLinksOnRim(library: Library, edge: EdgePosition): Link[] {
  const groups = resolveEdgeGroups(library, edge);
  const seen = new Set<string>();
  const links: Link[] = [];

  for (const group of groups) {
    for (const link of resolveEdgeGroupLinks(library, edge, group.id)) {
      if (seen.has(link.id)) {
        continue;
      }

      seen.add(link.id);
      links.push(link);
    }
  }

  return links;
}

export function resolveWorkspacePlacedLinks(library: Library): Link[] {
  const workspace = library.workspaces.find((w) => w.id === library.activeWorkspaceId);

  if (!workspace) {
    return [];
  }

  const catalogById = new Map(library.catalog.map((link) => [link.id, link]));
  const seen = new Set<string>();
  const links: Link[] = [];

  for (const edge of ["left", "top", "bottom"] as const) {
    for (const group of resolveEdgeGroups(library, edge)) {
      for (const link of resolveEdgeGroupLinks(library, edge, group.id)) {
        if (seen.has(link.id)) {
          continue;
        }

        seen.add(link.id);
        links.push(link);
      }
    }
  }

  return links;
}
