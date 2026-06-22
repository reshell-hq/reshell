import type { ReshellConfig } from "@/lib/config";

export type CycleDirection = "next" | "prev";

/**
 * The neighbouring workspace id in config order, wrapping at both ends. An
 * unknown (or missing) current id resolves to the first workspace, so a stale
 * override never strands the user. Pure — zero React/DOM deps (ADR-0009).
 *
 * Config guarantees at least one workspace (schema `.min(1)`), so the array is
 * never empty here.
 */
export function nextWorkspaceId(
  config: ReshellConfig,
  currentId: string,
  direction: CycleDirection,
): string {
  const ids = config.workspaces.map((w) => w.id);
  const current = ids.indexOf(currentId);
  if (current === -1) {
    return ids[0];
  }
  const step = direction === "next" ? 1 : -1;
  const next = (current + step + ids.length) % ids.length;
  return ids[next];
}
