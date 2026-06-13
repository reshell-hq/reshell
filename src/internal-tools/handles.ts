import type { InternalToolId } from "./types";

export function resolveInternalToolHandle(toolId: InternalToolId): {
  label: string;
  glyph: string;
} {
  switch (toolId) {
    case "pomodoro":
      return { label: "Pomodoro", glyph: "⏲" };
    case "tasks":
      return { label: "Tasks", glyph: "✓" };
  }
}

export function parseInternalToolZoneId(zoneId: string): InternalToolId | null {
  if (zoneId === "__tool_pomodoro__") {
    return "pomodoro";
  }
  if (zoneId === "__tool_tasks__") {
    return "tasks";
  }
  return null;
}
