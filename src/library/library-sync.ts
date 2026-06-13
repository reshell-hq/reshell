export type LibrarySyncAdapter = {
  notifyChange: () => void;
  subscribe: (onChange: () => void) => () => void;
};

export function createMemoryLibrarySync(): LibrarySyncAdapter {
  const listeners = new Set<() => void>();

  return {
    notifyChange() {
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe(onChange) {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
  };
}

export function createBroadcastLibrarySync(
  channelName = "reshell-library-change",
): LibrarySyncAdapter {
  const localListeners = new Set<() => void>();
  let channel: BroadcastChannel | null = null;

  function ensureChannel(): BroadcastChannel {
    if (!channel) {
      channel = new BroadcastChannel(channelName);
      channel.onmessage = () => {
        for (const listener of localListeners) {
          listener();
        }
      };
    }

    return channel;
  }

  return {
    notifyChange() {
      for (const listener of localListeners) {
        listener();
      }

      try {
        ensureChannel().postMessage(null);
      } catch {
        // A prior bug closed the channel on unsubscribe; recreate for other tabs.
        channel = null;
      }
    },
    subscribe(onChange) {
      ensureChannel();
      localListeners.add(onChange);
      return () => {
        localListeners.delete(onChange);
      };
    },
  };
}

let activeSync: LibrarySyncAdapter | null = null;

export function getLibrarySync(): LibrarySyncAdapter {
  if (!activeSync) {
    activeSync =
      typeof BroadcastChannel !== "undefined"
        ? createBroadcastLibrarySync()
        : createMemoryLibrarySync();
  }

  return activeSync;
}

export function setLibrarySyncForTests(adapter: LibrarySyncAdapter): void {
  activeSync = adapter;
}

export function resetLibrarySyncForTests(): void {
  activeSync = null;
}

export function notifyLibraryChanged(): void {
  try {
    getLibrarySync().notifyChange();
  } catch {
    // Persistence already succeeded; cross-tab sync is best-effort.
  }
}
