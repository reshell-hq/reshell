import { resolveLinkTitle } from "@/link-display/link-display";
import type { Library, Link, Workspace } from "@/library/types";

export type LinkSearchResult = {
  link: Link;
  source: "workspace" | "catalog";
};

function fuzzyMatch(query: string, text: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return false;
  }

  const haystack = text.toLowerCase();
  let queryIndex = 0;

  for (let i = 0; i < haystack.length && queryIndex < normalizedQuery.length; i++) {
    if (haystack[i] === normalizedQuery[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === normalizedQuery.length;
}

function getPlacedLinkIds(workspace: Workspace): Set<string> {
  const ids = new Set<string>();

  for (const edge of ["left", "top", "bottom"] as const) {
    for (const group of workspace.placements.edges[edge]) {
      for (const placement of group.links) {
        ids.add(placement.linkId);
      }
    }
  }

  return ids;
}

export function searchLinks(library: Library, query: string): LinkSearchResult[] {
  const workspace = library.workspaces.find((w) => w.id === library.activeWorkspaceId);

  if (!workspace || !query.trim()) {
    return [];
  }

  const placedIds = getPlacedLinkIds(workspace);
  const workspaceResults: LinkSearchResult[] = [];
  const catalogResults: LinkSearchResult[] = [];

  for (const link of library.catalog) {
    const title = resolveLinkTitle(link);
    if (!fuzzyMatch(query, title)) {
      continue;
    }

    if (placedIds.has(link.id)) {
      workspaceResults.push({ link, source: "workspace" });
    } else {
      catalogResults.push({ link, source: "catalog" });
    }
  }

  return [...workspaceResults, ...catalogResults];
}

export function filterLinks(links: Link[], query: string): Link[] {
  if (!query.trim()) {
    return links;
  }

  return links.filter((link) => fuzzyMatch(query, resolveLinkTitle(link)));
}

export function searchWorkspaces(library: Library, query: string): Workspace[] {
  if (!query.trim()) {
    return [];
  }

  return library.workspaces.filter((workspace) => fuzzyMatch(query, workspace.name));
}
