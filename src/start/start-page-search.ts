import { resolveLinkTitle } from "@/link-display/link-display";
import type { Library } from "@/library/types";
import { searchLinks } from "@/search/search";

export type StartPageSearchResult = {
  linkId: string;
  url: string;
  title: string;
  source: "workspace" | "catalog";
};

export function buildStartPageSearchResults(
  library: Library,
  query: string,
): StartPageSearchResult[] {
  if (query.startsWith(":")) {
    return [];
  }

  return searchLinks(library, query).map(({ link, source }) => ({
    linkId: link.id,
    url: link.url,
    title: resolveLinkTitle(link),
    source,
  }));
}
