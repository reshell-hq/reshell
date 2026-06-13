"use client";

import type { Workspace } from "@/library/types";
import {
  buildCanvasZoneLayout,
  CANVAS_ZONES,
  type CanvasZoneLayout,
} from "@/canvas-widgets/zone-layout";
import type { CanvasWidgetId } from "@/canvas-widgets/types";
import type { CanvasZone } from "@/library/types";
import { resolveLayoutPresetId } from "@/theme/resolve-layout-preset";
import { AtelierCanvasStack } from "./atelier-canvas-stack";
import { CanvasFocusTasksWidget } from "./canvas-focus-tasks-widget";
import { CanvasNowPlayingWidget } from "./canvas-now-playing-widget";
import { CanvasPomodoroWidget } from "./canvas-pomodoro-widget";
import { EditorialCanvasStack } from "./editorial-canvas-stack";
import { MeridianCanvasStack } from "./meridian-canvas-stack";
import {
  CanvasClockWidget,
  CanvasQuoteWidget,
  CanvasWelcomeWidget,
} from "./canvas-widget-parts";

type CanvasWidgetStackProps = {
  workspace: Workspace;
  displayName?: string;
};

const ZONE_CLASS: Record<CanvasZone, string> = {
  "upper-center": "canvas-zone-upper-center",
  center: "canvas-zone-center",
  "lower-left": "canvas-zone-lower-left",
  "lower-right": "canvas-zone-lower-right",
  "bottom-center": "canvas-zone-bottom-center",
};

function renderCanvasWidget(
  widgetId: CanvasWidgetId,
  workspace: Workspace,
  displayName?: string,
) {
  switch (widgetId) {
    case "clock":
      return <CanvasClockWidget key={widgetId} />;
    case "welcome":
      return <CanvasWelcomeWidget key={widgetId} displayName={displayName} />;
    case "quote":
      return <CanvasQuoteWidget key={widgetId} />;
    case "nowPlaying":
      return <CanvasNowPlayingWidget key={widgetId} workspace={workspace} />;
    case "pomodoro":
      return <CanvasPomodoroWidget key={widgetId} workspace={workspace} />;
    case "focusTasks":
      return <CanvasFocusTasksWidget key={widgetId} workspace={workspace} />;
  }
}

function hasVisibleWidgets(layout: CanvasZoneLayout): boolean {
  return CANVAS_ZONES.some((zone) => layout[zone].length > 0);
}

export function CanvasWidgetStack({ workspace, displayName }: CanvasWidgetStackProps) {
  const layout = buildCanvasZoneLayout(workspace);

  if (!hasVisibleWidgets(layout)) {
    return null;
  }

  const layoutPresetId = resolveLayoutPresetId(workspace.theme);

  switch (layoutPresetId) {
    case "editorial":
      return <EditorialCanvasStack workspace={workspace} displayName={displayName} layout={layout} />;
    case "meridian":
      return <MeridianCanvasStack workspace={workspace} displayName={displayName} layout={layout} />;
    case "atelier":
      return <AtelierCanvasStack workspace={workspace} displayName={displayName} layout={layout} />;
    default:
      break;
  }

  return (
    <div
      className="canvas-widget-stage"
      data-layout-preset={layoutPresetId}
      data-applied-theme={workspace.theme.appliedThemePresetId ?? workspace.theme.appliedPresetId}
    >
      {CANVAS_ZONES.map((zone) => {
        const widgets = layout[zone];
        if (widgets.length === 0) {
          return null;
        }

        return (
          <div key={zone} className={`canvas-zone ${ZONE_CLASS[zone]}`}>
            {widgets.map((widgetId) => renderCanvasWidget(widgetId, workspace, displayName))}
          </div>
        );
      })}
    </div>
  );
}
