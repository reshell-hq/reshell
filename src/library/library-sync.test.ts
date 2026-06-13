import { describe, expect, it, afterEach } from "vitest";
import { loadOrSeedLibrary, saveLibrary } from "./library";
import {
  createBroadcastLibrarySync,
  createMemoryLibrarySync,
  resetLibrarySyncForTests,
  setLibrarySyncForTests,
} from "./library-sync";
import { createInMemoryLibraryStore } from "./store";
import { resolveStartPageLibrary } from "@/start/resolve-start-page-library";

describe("library sync", () => {
  afterEach(() => {
    resetLibrarySyncForTests();
  });

  it("notifies subscribers when the library is persisted", async () => {
    const sync = createMemoryLibrarySync();
    setLibrarySyncForTests(sync);
    let notifications = 0;
    sync.subscribe(() => {
      notifications += 1;
    });

    const store = createInMemoryLibraryStore();
    const library = await loadOrSeedLibrary(store);
    notifications = 0;

    await saveLibrary(store, library);

    expect(notifications).toBe(1);
  });

  it("keeps notifying remaining subscribers after one broadcast listener unsubscribes", () => {
    class MockBroadcastChannel {
      onmessage: ((event: MessageEvent) => void) | null = null;

      postMessage(_value: unknown) {
        // Same-tab senders do not receive their own broadcast messages.
      }

      close() {
        throw new DOMException(
          "An attempt was made to use an object that is not, or is no longer, usable",
        );
      }
    }

    const original = globalThis.BroadcastChannel;
    globalThis.BroadcastChannel = MockBroadcastChannel as typeof BroadcastChannel;

    try {
      const sync = createBroadcastLibrarySync("test-channel");
      let transientNotifications = 0;
      let persistentNotifications = 0;

      const unsubscribeTransient = sync.subscribe(() => {
        transientNotifications += 1;
      });
      sync.subscribe(() => {
        persistentNotifications += 1;
      });

      sync.notifyChange();
      expect(transientNotifications).toBe(1);
      expect(persistentNotifications).toBe(1);

      unsubscribeTransient();
      expect(() => sync.notifyChange()).not.toThrow();
      expect(transientNotifications).toBe(1);
      expect(persistentNotifications).toBe(2);
    } finally {
      globalThis.BroadcastChannel = original;
    }
  });

  it("lets the start page observe a library written elsewhere", async () => {
    const sync = createMemoryLibrarySync();
    setLibrarySyncForTests(sync);
    const store = createInMemoryLibraryStore();

    const initial = await resolveStartPageLibrary(store);
    expect(initial.source).toBe("starter");

    const refreshed = new Promise<Awaited<ReturnType<typeof resolveStartPageLibrary>>>(
      (resolve) => {
        sync.subscribe(() => {
          void resolveStartPageLibrary(store).then(resolve);
        });
      },
    );

    await loadOrSeedLibrary(store);
    const next = await refreshed;

    expect(next.source).toBe("library");
  });
});
