import type { OverrideState } from "./types";

/**
 * The persistence seam (ADR-0009): the ONLY module that touches localStorage.
 * Components and hooks go through here, so a paid tier can swap this for a
 * backend store without touching feature code. SSR-safe and malformed-JSON-safe.
 */

const STORAGE_KEY = "reshell.override.v1";

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
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / private-mode write failures — overrides are best-effort.
  }
}
