import { resolveLinkTitle } from "@/lib/link-display/link-display";
import type { Library, Link, Workspace } from "@/lib/library/types";

/**
 * Command-bar fuzzy search (CONTEXT: "Command bar") — pure ranking over the
 * library. Default mode fuzzy-finds workspace switches first, then links:
 * placed-in-the-active-workspace links rank above unplaced catalog fallbacks.
 * Ported from the pre-rewrite `src/search` (ADR 0017), adapted to the reduced
 * `@/lib` library model.
 */

/** A catalog link matched by the command bar, tagged by where it surfaced. */
export type LinkSearchResult = {
  link: Link;
  source: "workspace" | "catalog";
};

/**
 * Subsequence fuzzy match: every character of the (trimmed, lowercased) query
 * appears in order within the text, not necessarily contiguously. An empty
 * query never matches (the command bar shows nothing until the user types).
 */
export function fuzzyMatch(query: string, text: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return false;
  }

  const haystack = text.toLowerCase();
  let queryIndex = 0;

  for (
    let i = 0;
    i < haystack.length && queryIndex < normalizedQuery.length;
    i++
  ) {
    if (haystack[i] === normalizedQuery[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === normalizedQuery.length;
}

/** Catalog ids placed in any edge group of the given workspace. */
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

/**
 * Links matching the query, placed-first: links placed on the active
 * workspace's rims rank above unplaced catalog fallbacks. Empty query → none.
 */
export function searchLinks(library: Library, query: string): LinkSearchResult[] {
  const workspace = library.workspaces.find(
    (w) => w.id === library.activeWorkspaceId,
  );

  if (!workspace || !query.trim()) {
    return [];
  }

  const placedIds = getPlacedLinkIds(workspace);
  const workspaceResults: LinkSearchResult[] = [];
  const catalogResults: LinkSearchResult[] = [];

  for (const link of library.catalog) {
    if (!fuzzyMatch(query, resolveLinkTitle(link))) {
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

/** Workspaces whose names fuzzy-match the query. Empty query → none. */
export function searchWorkspaces(library: Library, query: string): Workspace[] {
  if (!query.trim()) {
    return [];
  }

  return library.workspaces.filter((workspace) =>
    fuzzyMatch(query, workspace.name),
  );
}
