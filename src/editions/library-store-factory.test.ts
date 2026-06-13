import { afterEach, describe, expect, it } from "vitest";
import type { Library, LibraryStore } from "@/library/types";
import {
  getLibraryStore,
  resetLibraryStoreFactory,
  setLibraryStoreFactory,
} from "./library-store-factory";

afterEach(() => {
  resetLibraryStoreFactory();
});

describe("library store factory", () => {
  it("returns an IndexedDB-backed store with read/write by default", () => {
    const store = getLibraryStore();
    expect(typeof store.read).toBe("function");
    expect(typeof store.write).toBe("function");
  });

  it("returns a stable singleton", () => {
    expect(getLibraryStore()).toBe(getLibraryStore());
  });

  it("lets the compose override the factory", async () => {
    let written: Library | null = null;
    const fake: LibraryStore = {
      async read() {
        return written;
      },
      async write(library) {
        written = library;
      },
    };

    setLibraryStoreFactory(() => fake);
    expect(getLibraryStore()).toBe(fake);

    const library = { activeWorkspaceId: "x" } as Library;
    await getLibraryStore().write(library);
    expect(await getLibraryStore().read()).toBe(library);
  });

  it("restores the default factory on reset", () => {
    const fake: LibraryStore = {
      async read() {
        return null;
      },
      async write() {},
    };
    setLibraryStoreFactory(() => fake);
    expect(getLibraryStore()).toBe(fake);

    resetLibraryStoreFactory();
    expect(getLibraryStore()).not.toBe(fake);
  });
});
