import type { CanvasZone, Workspace } from "@/library/types";
import { resolveTheme } from "@/theme/theme-defaults";
import { listEnabledCanvasWidgets } from "./config";
import type { CanvasWidgetId } from "./types";

export const CANVAS_ZONES: CanvasZone[] = [
  "upper-center",
  "center",
  "lower-left",
  "lower-right",
  "bottom-center",
];

export type CanvasZoneLayout = Record<CanvasZone, CanvasWidgetId[]>;

function emptyZoneLayout(): CanvasZoneLayout {
  return {
    center: [],
    "upper-center": [],
    "lower-left": [],
    "lower-right": [],
    "bottom-center": [],
  };
}

function shouldRenderWidget(workspace: Workspace, widgetId: CanvasWidgetId): boolean {
  const timerActive = workspace.internalTools.pomodoro.running;

  if (widgetId === "clock" && timerActive) {
    return false;
  }

  if (widgetId === "pomodoro" && !timerActive) {
    return false;
  }

  return true;
}

export function buildCanvasZoneLayout(workspace: Workspace): CanvasZoneLayout {
  const layout = emptyZoneLayout();
  const theme = resolveTheme(workspace.theme);
  const enabled = listEnabledCanvasWidgets(workspace).filter((widgetId) =>
    shouldRenderWidget(workspace, widgetId),
  );

  for (const widgetId of enabled) {
    const style = theme.widgets[widgetId]!;
    layout[style.zone].push(widgetId);
  }

  for (const zone of CANVAS_ZONES) {
    layout[zone].sort(
      (left, right) => theme.widgets[left]!.order - theme.widgets[right]!.order,
    );
  }

  return layout;
}
