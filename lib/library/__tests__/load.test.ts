import { describe, expect, it } from "vitest";
import { loadOrSeedLibrary } from "../load";
import { createInMemoryLibraryStore } from "../store";
import { createStarterLibrary } from "../starter-template";

describe("loadOrSeedLibrary", () => {
  it("seeds the starter template on first run and writes it back", async () => {
    const store = createInMemoryLibraryStore();

    const loaded = await loadOrSeedLibrary(store);

    expect(loaded.activeWorkspaceId).toBe("work");
    expect(loaded.workspaces).toHaveLength(2);
    // Persisted, so a second read returns the same data without re-seeding.
    expect(await store.read()).toEqual(loaded);
  });

  it("returns the existing library without overwriting it", async () => {
    const store = createInMemoryLibraryStore();
    const existing = createStarterLibrary();
    existing.displayName = "Ada";
    await store.write(existing);

    const loaded = await loadOrSeedLibrary(store);

    expect(loaded.displayName).toBe("Ada");
  });
});
