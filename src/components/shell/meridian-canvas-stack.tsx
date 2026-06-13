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

type MeridianCanvasStackProps = {
  workspace: Workspace;
  displayName?: string;
  layout: CanvasZoneLayout;
};

function isWidgetInLayout(layout: CanvasZoneLayout, widgetId: CanvasWidgetId): boolean {
  return CANVAS_ZONES.some((zone) => layout[zone].includes(widgetId));
}

export function MeridianCanvasStack({ workspace, displayName, layout }: MeridianCanvasStackProps) {
  const showQuote = isWidgetInLayout(layout, "quote");
  const showWelcome = isWidgetInLayout(layout, "welcome");
  const showTasks = isWidgetInLayout(layout, "focusTasks");
  const showNowPlaying = isWidgetInLayout(layout, "nowPlaying");
  const showClock = isWidgetInLayout(layout, "clock");
  const showPomodoro = isWidgetInLayout(layout, "pomodoro");

  return (
    <div className="canvas-widget-stage canvas-widget-stage--meridian" data-layout-preset="meridian">
      <div className="canvas-meridian-band canvas-meridian-top">
        <div className="canvas-meridian-slot canvas-meridian-start">
          {showQuote ? <CanvasQuoteWidget /> : null}
        </div>
        <div className="canvas-meridian-slot canvas-meridian-end">
          {showWelcome ? <CanvasWelcomeWidget displayName={displayName} /> : null}
        </div>
      </div>

      <div className="canvas-meridian-band canvas-meridian-center">
        {showPomodoro ? (
          <CanvasPomodoroWidget workspace={workspace} />
        ) : showClock ? (
          <CanvasClockWidget variant="hero" />
        ) : null}
      </div>

      <div className="canvas-meridian-band canvas-meridian-bottom">
        <div className="canvas-meridian-slot canvas-meridian-start">
          {showTasks ? <CanvasFocusTasksWidget workspace={workspace} /> : null}
        </div>
        <div className="canvas-meridian-slot canvas-meridian-end">
          {showNowPlaying ? <CanvasNowPlayingWidget workspace={workspace} /> : null}
        </div>
      </div>
    </div>
  );
}
