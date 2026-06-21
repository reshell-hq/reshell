import type { InternalToolId } from "./types";

/**
 * The built-in right-rim handle for each internal tool (CONTEXT: "Edge handle" —
 * "Tool handles use built-in icons in v1"). On the narrow right rim these render
 * as a ghost glyph (no card) to avoid canvas overflow.
 */
export function resolveInternalToolHandle(toolId: InternalToolId): {
  label: string;
  glyph: string;
} {
  switch (toolId) {
    case "pomodoro":
      return { label: "Pomodoro", glyph: "\u23F2" };
    case "tasks":
      return { label: "Focus tasks", glyph: "\u2713" };
  }
}

/** The `Shell.Slot` id for an internal tool's right-rim slot. */
export function internalToolSlotId(toolId: InternalToolId): string {
  return `internal-tool-${toolId}`;
}
