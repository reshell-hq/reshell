import { openDB } from "idb";
import type { Library, LibraryStore } from "./types";

/** IndexedDB database name for the local library. */
const LIBRARY_DB_NAME = "reshell";
const STORE_NAME = "library";
const LIBRARY_KEY = "library";

/**
 * The default Personal-edition store: persists the library to the browser's
 * IndexedDB on the active machine (CONTEXT: "Library"). Browser-only — the
 * database is opened lazily on first read/write, so constructing the store is
 * safe during SSR.
 */
export function createIndexedDbLibraryStore(): LibraryStore {
  async function getDb() {
    return openDB(LIBRARY_DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
  }

  return {
    async read() {
      const db = await getDb();
      return (await db.get(STORE_NAME, LIBRARY_KEY)) ?? null;
    },
    async write(library: Library) {
      const db = await getDb();
      await db.put(STORE_NAME, library, LIBRARY_KEY);
    },
  };
}
