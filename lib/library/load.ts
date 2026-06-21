import { createStarterLibrary } from "./starter-template";
import type { Library, LibraryStore } from "./types";

/**
 * Read the library from a store, seeding the starter template on first run
 * (CONTEXT: "First run"). The seeded library is written back so subsequent
 * loads are stable. Schema migration is out of scope — a stale library is the
 * library reset / snapshot re-import path (issue 12).
 */
export async function loadOrSeedLibrary(store: LibraryStore): Promise<Library> {
  const existing = await store.read();
  if (existing) {
    return existing;
  }
  const seeded = createStarterLibrary();
  await store.write(seeded);
  return seeded;
}
