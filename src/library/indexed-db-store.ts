import { openDB } from "idb";
import { LIBRARY_DB_NAME } from "@/branding/branding";
import type { Library, LibraryStore } from "./types";
const STORE_NAME = "library";
const LIBRARY_KEY = "library";

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
