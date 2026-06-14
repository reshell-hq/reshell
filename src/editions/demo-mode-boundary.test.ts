import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCommandBarActionResults } from "@/command-bar/command-bar";
import * as indexedDbStore from "@/library/indexed-db-store";
import { loadOrSeedLibrary } from "@/library/library";
import {
  enableDemoMode,
  initializeDemoShell,
  isDemoMode,
  resetDemoMode,
} from "./demo-mode";
import { getLibraryStore, resetLibraryStoreFactory } from "./library-store-factory";

const createIndexedDbSpy = vi.spyOn(indexedDbStore, "createIndexedDbLibraryStore");

afterEach(() => {
  resetDemoMode();
  resetLibraryStoreFactory();
  createIndexedDbSpy.mockClear();
});

describe("demo mode boundary", () => {
  it("starts disabled in the OSS default runtime", () => {
    expect(isDemoMode()).toBe(false);
  });

  it("uses an in-memory library store that never opens IndexedDB", async () => {
    initializeDemoShell();

    expect(isDemoMode()).toBe(true);
    expect(createIndexedDbSpy).not.toHaveBeenCalled();

    const library = await loadOrSeedLibrary(getLibraryStore());
    expect(library.workspaces.map((workspace) => workspace.name)).toEqual(["Work", "Personal"]);
    expect(createIndexedDbSpy).not.toHaveBeenCalled();
  });

  it("suppresses command-bar configuration actions", () => {
    enableDemoMode();

    expect(buildCommandBarActionResults(":")).toEqual([]);
    expect(buildCommandBarActionResults(":settings")).toEqual([]);
    expect(buildCommandBarActionResults(":reset")).toEqual([]);
  });
});
