"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createIndexedDbLibraryStore } from "@/lib/library/indexed-db-store";
import { loadOrSeedLibrary } from "@/lib/library/load";
import type { Library, LibraryStore } from "@/lib/library/types";

export type LibraryStatus = "loading" | "ready" | "error";

type LibraryContextValue = {
  status: LibraryStatus;
  library: Library | null;
  error: Error | null;
  /** Persist a new library and update context. */
  save: (next: Library) => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

type LibraryProviderProps = {
  /**
   * Persistence to use (ADR 0017 — dependency injection, no global factory).
   * Defaults to the IndexedDB store; demo mode / tests pass an in-memory store;
   * Standard can pass a cloud-backed one. Expected to be stable across renders.
   */
  store?: LibraryStore;
  children: ReactNode;
};

export function LibraryProvider({ store, children }: LibraryProviderProps) {
  const [resolvedStore] = useState<LibraryStore>(
    () => store ?? createIndexedDbLibraryStore(),
  );
  const [status, setStatus] = useState<LibraryStatus>("loading");
  const [library, setLibrary] = useState<Library | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    loadOrSeedLibrary(resolvedStore)
      .then((loaded) => {
        if (!cancelled) {
          setLibrary(loaded);
          setStatus("ready");
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause : new Error(String(cause)));
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedStore]);

  const save = useCallback(
    async (next: Library) => {
      await resolvedStore.write(next);
      setLibrary(next);
    },
    [resolvedStore],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({ status, library, error, save }),
    [status, library, error, save],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
}
