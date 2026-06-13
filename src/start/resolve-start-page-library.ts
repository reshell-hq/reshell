import { ensureLibraryDefaults } from "@/internal-tools/defaults";
import { getLibrary } from "@/library/library";
import { createStarterLibrary } from "@/library/starter-template";
import type { Library, LibraryStore } from "@/library/types";

export type StartPageLibrarySource = "library" | "starter";

export type ResolvedStartPageLibrary = {
  source: StartPageLibrarySource;
  library: Library;
};

export async function resolveStartPageLibrary(
  store: LibraryStore,
): Promise<ResolvedStartPageLibrary> {
  const existing = await getLibrary(store);
  if (existing) {
    return {
      source: "library",
      library: ensureLibraryDefaults(existing),
    };
  }

  return {
    source: "starter",
    library: createStarterLibrary(),
  };
}
