import { createIndexedDbLibraryStore } from "@/library/indexed-db-store";
import type { LibraryStore } from "@/library/types";

export type LibraryStoreFactory = () => LibraryStore;

let factory: LibraryStoreFactory = createIndexedDbLibraryStore;
let cached: LibraryStore | null = null;

/**
 * Override the LibraryStore factory. The private compose calls this at startup
 * (before any library hook resolves its store) to swap in a cloud-backed store;
 * the OSS build never calls it and keeps the IndexedDB default.
 */
export function setLibraryStoreFactory(next: LibraryStoreFactory): void {
  factory = next;
  cached = null;
}

/** The active LibraryStore singleton — IndexedDB-backed by default. */
export function getLibraryStore(): LibraryStore {
  cached ??= factory();
  return cached;
}

/** Test helper: restore the default IndexedDB-backed factory. */
export function resetLibraryStoreFactory(): void {
  factory = createIndexedDbLibraryStore;
  cached = null;
}
