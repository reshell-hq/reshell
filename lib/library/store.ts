import type { LibraryStore } from "./types";

/**
 * Ephemeral store — holds the library in memory only. Used by demo mode (ADR
 * 0016) and tests; never touches IndexedDB. Reload resets it.
 */
export function createInMemoryLibraryStore(): LibraryStore {
  let library: Parameters<LibraryStore["write"]>[0] | null = null;

  return {
    async read() {
      return library;
    },
    async write(next) {
      library = next;
    },
  };
}
