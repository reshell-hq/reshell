import type { Library } from "@/library/types";
import type { CanvasWidgetId, CanvasWidgetConfig } from "./types";

export type { CanvasWidgetId, CanvasWidgetConfig };

export const CANVAS_WIDGET_IDS: CanvasWidgetId[] = [
  "clock",
  "welcome",
  "quote",
  "nowPlaying",
  "pomodoro",
  "focusTasks",
];

export function createDefaultCanvasWidgets(): CanvasWidgetConfig {
  return {
    clock: true,
    welcome: true,
    quote: true,
    nowPlaying: true,
    pomodoro: true,
    focusTasks: true,
  };
}

export function listEnabledCanvasWidgets(workspace: {
  canvasWidgets: CanvasWidgetConfig;
}): CanvasWidgetId[] {
  return CANVAS_WIDGET_IDS.filter((widgetId) => workspace.canvasWidgets[widgetId]);
}

export function setCanvasWidgetEnabled(
  library: Library,
  workspaceId: string,
  widgetId: CanvasWidgetId,
  enabled: boolean,
): Library {
  return {
    ...library,
    workspaces: library.workspaces.map((workspace) =>
      workspace.id === workspaceId
        ? {
            ...workspace,
            canvasWidgets: {
              ...workspace.canvasWidgets,
              [widgetId]: enabled,
            },
          }
        : workspace,
    ),
  };
}
