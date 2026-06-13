import type { Library, LibraryStore } from "./types";

export function createInMemoryLibraryStore(): LibraryStore {
  let library: Library | null = null;

  return {
    async read() {
      return library;
    },
    async write(next) {
      library = next;
    },
  };
}
