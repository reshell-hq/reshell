"use client";

import type { Workspace } from "@/library/types";
import type { CanvasZoneLayout } from "@/canvas-widgets/zone-layout";
import { CANVAS_ZONES } from "@/canvas-widgets/zone-layout";
import type { CanvasWidgetId } from "@/canvas-widgets/types";
import { editorialFont } from "@/theme/editorial-font";
import { CanvasFocusTasksWidget } from "./canvas-focus-tasks-widget";
import { CanvasNowPlayingWidget } from "./canvas-now-playing-widget";
import {
  CanvasClockDateHeroWidget,
  CanvasClockTimeWidget,
  CanvasEditorialTimerPhaseWidget,
  CanvasEditorialTimerTimeWidget,
  CanvasQuoteWidget,
  CanvasWelcomeWidget,
} from "./canvas-widget-parts";

type EditorialCanvasStackProps = {
  workspace: Workspace;
  displayName?: string;
  layout: CanvasZoneLayout;
};

function isWidgetInLayout(layout: CanvasZoneLayout, widgetId: CanvasWidgetId): boolean {
  return CANVAS_ZONES.some((zone) => layout[zone].includes(widgetId));
}

export function EditorialCanvasStack({ workspace, displayName, layout }: EditorialCanvasStackProps) {
  const showQuote = isWidgetInLayout(layout, "quote");
  const showNowPlaying = isWidgetInLayout(layout, "nowPlaying");
  const showTasks = isWidgetInLayout(layout, "focusTasks");
  const showWelcome = isWidgetInLayout(layout, "welcome");
  const showClock = isWidgetInLayout(layout, "clock");
  const showPomodoro = isWidgetInLayout(layout, "pomodoro");

  return (
    <div
      className={`canvas-widget-stage canvas-widget-stage--editorial ${editorialFont.className}`}
      data-layout-preset="editorial"
    >
      <div className="canvas-editorial-corner canvas-editorial-tl">
        {showQuote ? <CanvasQuoteWidget /> : null}
        {showNowPlaying ? <CanvasNowPlayingWidget workspace={workspace} /> : null}
      </div>

      <div className="canvas-editorial-corner canvas-editorial-tr">
        {showTasks ? <CanvasFocusTasksWidget workspace={workspace} /> : null}
      </div>

      <div className="canvas-editorial-corner canvas-editorial-bl">
        {showWelcome ? <CanvasWelcomeWidget displayName={displayName} /> : null}
        {showPomodoro ? (
          <CanvasEditorialTimerTimeWidget workspace={workspace} />
        ) : showClock ? (
          <CanvasClockTimeWidget />
        ) : null}
      </div>

      <div className="canvas-editorial-corner canvas-editorial-br">
        {showPomodoro ? (
          <CanvasEditorialTimerPhaseWidget workspace={workspace} />
        ) : showClock ? (
          <CanvasClockDateHeroWidget />
        ) : null}
      </div>
    </div>
  );
}
