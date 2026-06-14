import { createInMemoryLibraryStore } from "@/library/store";
import type { LibraryStore } from "@/library/types";

/** Ephemeral store for the reshell.xyz demo shell — never touches IndexedDB. */
export function createDemoLibraryStore(): LibraryStore {
  return createInMemoryLibraryStore();
}
