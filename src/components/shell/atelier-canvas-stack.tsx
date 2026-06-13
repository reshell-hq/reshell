"use client";

import type { Workspace } from "@/library/types";
import type { CanvasZoneLayout } from "@/canvas-widgets/zone-layout";
import { CANVAS_ZONES } from "@/canvas-widgets/zone-layout";
import type { CanvasWidgetId } from "@/canvas-widgets/types";
import { CanvasFocusTasksWidget } from "./canvas-focus-tasks-widget";
import { CanvasNowPlayingWidget } from "./canvas-now-playing-widget";
import { CanvasPomodoroWidget } from "./canvas-pomodoro-widget";
import {
  CanvasClockWidget,
  CanvasQuoteWidget,
  CanvasWelcomeWidget,
} from "./canvas-widget-parts";

type AtelierCanvasStackProps = {
  workspace: Workspace;
  displayName?: string;
  layout: CanvasZoneLayout;
};

function isWidgetInLayout(layout: CanvasZoneLayout, widgetId: CanvasWidgetId): boolean {
  return CANVAS_ZONES.some((zone) => layout[zone].includes(widgetId));
}

export function AtelierCanvasStack({ workspace, displayName, layout }: AtelierCanvasStackProps) {
  const showQuote = isWidgetInLayout(layout, "quote");
  const showWelcome = isWidgetInLayout(layout, "welcome");
  const showNowPlaying = isWidgetInLayout(layout, "nowPlaying");
  const showTasks = isWidgetInLayout(layout, "focusTasks");
  const showClock = isWidgetInLayout(layout, "clock");
  const showPomodoro = isWidgetInLayout(layout, "pomodoro");

  return (
    <div className="canvas-widget-stage canvas-widget-stage--atelier" data-layout-preset="atelier">
      <div className="canvas-atelier-column canvas-atelier-left">
        {showQuote ? <CanvasQuoteWidget /> : null}
        {showWelcome ? <CanvasWelcomeWidget displayName={displayName} /> : null}
        {showNowPlaying ? <CanvasNowPlayingWidget workspace={workspace} /> : null}
      </div>

      <div className="canvas-atelier-column canvas-atelier-right">
        {showTasks ? <CanvasFocusTasksWidget workspace={workspace} /> : null}
        <div className="canvas-atelier-anchor">
          {showPomodoro ? (
            <CanvasPomodoroWidget workspace={workspace} />
          ) : showClock ? (
            <CanvasClockWidget variant="rail" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
