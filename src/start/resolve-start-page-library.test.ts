import { describe, expect, it } from "vitest";
import { getLibrary, loadOrSeedLibrary } from "@/library/library";
import { createInMemoryLibraryStore } from "@/library/store";
import { resolveStartPageLibrary } from "./resolve-start-page-library";

describe("resolveStartPageLibrary", () => {
  it("uses the stored library without writing when IndexedDB has data", async () => {
    const store = createInMemoryLibraryStore();
    const seeded = await loadOrSeedLibrary(store);

    const resolved = await resolveStartPageLibrary(store);

    expect(resolved.source).toBe("library");
    expect(resolved.library.catalog).toEqual(seeded.catalog);
  });

  it("returns starter defaults without seeding when the store is empty", async () => {
    const store = createInMemoryLibraryStore();

    const resolved = await resolveStartPageLibrary(store);

    expect(resolved.source).toBe("starter");
    expect(resolved.library.catalog.length).toBeGreaterThan(0);
    expect(await getLibrary(store)).toBeNull();
  });
});
