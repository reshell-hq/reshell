import type { OverrideState } from "./types";

/**
 * The persistence seam (ADR-0009): the ONLY module that touches localStorage.
 * Components and hooks go through here, so a paid tier can swap this for a
 * backend store without touching feature code. SSR-safe and malformed-JSON-safe.
 *
 * Also exposes a minimal subscribe/snapshot surface for `useSyncExternalStore`,
 * which keeps reads hydration-safe (server snapshot is empty, matching SSR) and
 * writes discrete (one per user action — never on the animation path, ADR-0006).
 */

const STORAGE_KEY = "reshell.override.v1";

// Stable empty reference for SSR + initial hydration (must be the same object
// across calls or useSyncExternalStore loops).
const SERVER_SNAPSHOT: OverrideState = { workspaces: {} };

let clientCache: OverrideState | null = null;
const listeners = new Set<() => void>();

function emptyState(): OverrideState {
  return { workspaces: {} };
}

export function readOverride(): OverrideState {
  if (typeof window === "undefined") {
    return emptyState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyState();
    }
    const parsed: unknown = JSON.parse(raw);
    // ponytail: shallow shape guard, not full validation. Ceiling — a
    // hand-corrupted-but-JSON value could carry junk fields that pass through.
    // Upgrade path: a zod OverrideState schema + versioned migration if the
    // persisted shape ever changes (the `v1` key suffix reserves room).
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as { workspaces?: unknown }).workspaces !== "object" ||
      (parsed as { workspaces?: unknown }).workspaces === null
    ) {
      return emptyState();
    }
    return parsed as OverrideState;
  } catch {
    return emptyState();
  }
}

export function writeOverride(state: OverrideState): void {
  clientCache = state;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota / private-mode write failures — overrides are best-effort.
    }
  }
  listeners.forEach((listener) => listener());
}

/** Subscribe to override changes (for useSyncExternalStore). */
export function subscribeOverride(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Client snapshot — cached so the reference is stable between writes. */
export function getOverrideSnapshot(): OverrideState {
  if (clientCache === null) {
    clientCache = readOverride();
  }
  return clientCache;
}

/** Server/hydration snapshot — a stable empty state matching SSR output. */
export function getOverrideServerSnapshot(): OverrideState {
  return SERVER_SNAPSHOT;
}
