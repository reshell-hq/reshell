import { initialKey, insertBetween, sortByKey } from "@/fractional-order/fractional-order";
import type {
  EdgeGroup,
  EdgeGroupLinkPlacement,
  EdgePosition,
  Library,
  Workspace,
} from "@/library/types";

export type EdgeGroupInput = {
  name: string;
  handleIcon?: string;
};

export type EdgeGroupPatch = {
  name?: string;
  handleIcon?: string;
};

function createEdgeGroupId(): string {
  return crypto.randomUUID();
}

function findWorkspace(library: Library, workspaceId: string): Workspace {
  const workspace = library.workspaces.find((entry) => entry.id === workspaceId);
  if (!workspace) {
    throw new Error(`Workspace "${workspaceId}" not found`);
  }
  return workspace;
}

function updateWorkspace(
  library: Library,
  workspaceId: string,
  update: (workspace: Workspace) => Workspace,
): Library {
  return {
    ...library,
    workspaces: library.workspaces.map((workspace) =>
      workspace.id === workspaceId ? update(workspace) : workspace,
    ),
  };
}

function appendOrderKey(items: readonly { orderKey: string }[]): string {
  const sorted = sortByKey([...items], (item) => item.orderKey);
  const last = sorted.at(-1);
  return last ? insertBetween(last.orderKey, null) : initialKey();
}

function nextGroupOrderKey(groups: readonly EdgeGroup[]): string {
  return appendOrderKey(groups);
}

export function addEdgeGroup(
  library: Library,
  workspaceId: string,
  edge: EdgePosition,
  input: EdgeGroupInput,
): Library {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Edge group name is required");
  }

  const workspace = findWorkspace(library, workspaceId);
  const groups = workspace.placements.edges[edge];

  const group: EdgeGroup = {
    id: createEdgeGroupId(),
    name,
    orderKey: nextGroupOrderKey(groups),
    links: [],
    ...(input.handleIcon?.trim() ? { handleIcon: input.handleIcon.trim() } : {}),
  };

  return updateWorkspace(library, workspaceId, (current) => ({
    ...current,
    placements: {
      ...current.placements,
      edges: {
        ...current.placements.edges,
        [edge]: [...groups, group],
      },
    },
  }));
}

function findEdgeGroup(workspace: Workspace, edge: EdgePosition, groupId: string): EdgeGroup {
  const group = workspace.placements.edges[edge].find((entry) => entry.id === groupId);
  if (!group) {
    throw new Error(`Edge group "${groupId}" not found on ${edge} edge`);
  }
  return group;
}

export function updateEdgeGroup(
  library: Library,
  workspaceId: string,
  edge: EdgePosition,
  groupId: string,
  patch: EdgeGroupPatch,
): Library {
  findWorkspace(library, workspaceId);

  return updateWorkspace(library, workspaceId, (workspace) => {
    const group = findEdgeGroup(workspace, edge, groupId);
    const name = patch.name !== undefined ? patch.name.trim() : group.name;
    if (!name) {
      throw new Error("Edge group name is required");
    }

    return {
      ...workspace,
      placements: {
        ...workspace.placements,
        edges: {
          ...workspace.placements.edges,
          [edge]: workspace.placements.edges[edge].map((entry) =>
            entry.id === groupId
              ? {
                  ...entry,
                  name,
                  ...(patch.handleIcon !== undefined
                    ? patch.handleIcon.trim()
                      ? { handleIcon: patch.handleIcon.trim() }
                      : { handleIcon: undefined }
                    : {}),
                }
              : entry,
          ),
        },
      },
    };
  });
}

export function deleteEdgeGroup(
  library: Library,
  workspaceId: string,
  edge: EdgePosition,
  groupId: string,
): Library {
  findWorkspace(library, workspaceId);

  return updateWorkspace(library, workspaceId, (workspace) => ({
    ...workspace,
    placements: {
      ...workspace.placements,
      edges: {
        ...workspace.placements.edges,
        [edge]: workspace.placements.edges[edge].filter((entry) => entry.id !== groupId),
      },
    },
  }));
}

function assertCatalogLink(library: Library, linkId: string): void {
  if (!library.catalog.some((link) => link.id === linkId)) {
    throw new Error(`Catalog link "${linkId}" not found`);
  }
}

export function addLinkToEdgeGroup(
  library: Library,
  workspaceId: string,
  edge: EdgePosition,
  groupId: string,
  linkId: string,
): Library {
  assertCatalogLink(library, linkId);
  findWorkspace(library, workspaceId);

  return updateWorkspace(library, workspaceId, (workspace) => {
    const group = findEdgeGroup(workspace, edge, groupId);
    if (group.links.some((placement) => placement.linkId === linkId)) {
      throw new Error(`Link "${linkId}" is already placed in edge group "${groupId}"`);
    }

    return {
      ...workspace,
      placements: {
        ...workspace.placements,
        edges: {
          ...workspace.placements.edges,
          [edge]: workspace.placements.edges[edge].map((entry) =>
            entry.id === groupId
              ? {
                  ...entry,
                  links: [...entry.links, { linkId, orderKey: appendOrderKey(entry.links) }],
                }
              : entry,
          ),
        },
      },
    };
  });
}

export function removeLinkFromEdgeGroup(
  library: Library,
  workspaceId: string,
  edge: EdgePosition,
  groupId: string,
  linkId: string,
): Library {
  findWorkspace(library, workspaceId);

  return updateWorkspace(library, workspaceId, (workspace) => ({
    ...workspace,
    placements: {
      ...workspace.placements,
      edges: {
        ...workspace.placements.edges,
        [edge]: workspace.placements.edges[edge].map((entry) =>
          entry.id === groupId
            ? {
                ...entry,
                links: entry.links.filter((placement) => placement.linkId !== linkId),
              }
            : entry,
        ),
      },
    },
  }));
}

function moveLinkToSlot(
  links: readonly EdgeGroupLinkPlacement[],
  linkId: string,
  targetSlotIndex: number,
): EdgeGroupLinkPlacement[] {
  const sorted = sortByKey([...links], (link) => link.orderKey);
  const fromIndex = sorted.findIndex((link) => link.linkId === linkId);
  if (fromIndex === -1) {
    return [...links];
  }

  const targetIndex = Math.max(0, Math.min(targetSlotIndex, sorted.length - 1));
  if (fromIndex === targetIndex) {
    return [...links];
  }

  const reordered = [...sorted];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(targetIndex, 0, moved);

  const beforeKey = targetIndex === 0 ? null : reordered[targetIndex - 1].orderKey;
  const afterKey =
    targetIndex === reordered.length - 1 ? null : reordered[targetIndex + 1].orderKey;
  const newOrderKey = insertBetween(beforeKey, afterKey);

  return links.map((link) => (link.linkId === linkId ? { ...link, orderKey: newOrderKey } : link));
}

export function moveLinkInEdgeGroup(
  library: Library,
  workspaceId: string,
  edge: EdgePosition,
  groupId: string,
  linkId: string,
  targetSlotIndex: number,
): Library {
  findWorkspace(library, workspaceId);

  return updateWorkspace(library, workspaceId, (workspace) => ({
    ...workspace,
    placements: {
      ...workspace.placements,
      edges: {
        ...workspace.placements.edges,
        [edge]: workspace.placements.edges[edge].map((entry) =>
          entry.id === groupId
            ? {
                ...entry,
                links: moveLinkToSlot(entry.links, linkId, targetSlotIndex),
              }
            : entry,
        ),
      },
    },
  }));
}
