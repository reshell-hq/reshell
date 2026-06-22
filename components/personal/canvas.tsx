"use client";

import type { ReactNode } from "react";
import { getScene } from "@/components/scenes";
import {
  ClockWidget,
  FocusTasksWidget,
  NowPlayingWidget,
  PomodoroWidget,
  QuoteWidget,
  WelcomeWidget,
} from "@/components/widgets";
import { useReshellState } from "@/hooks/use-reshell-state";
import { useTimer } from "@/hooks/use-timer";
import { CANVAS_WIDGET_IDS, type CanvasWidgetId } from "@/lib/config";
import { visibleWidgets } from "@/lib/scene";

// The fixed built-in widget set (CONTEXT: "Canvas widget"). Keyed by id so the
// type system flags a missing entry if a `CanvasWidgetId` is ever added.
const WIDGETS: Record<CanvasWidgetId, () => ReactNode> = {
  clock: ClockWidget,
  welcome: WelcomeWidget,
  quote: QuoteWidget,
  nowPlaying: NowPlayingWidget,
  pomodoro: PomodoroWidget,
  focusTasks: FocusTasksWidget,
};

/**
 * The canvas host (CONTEXT: "Canvas"): resolves the effective scene + enabled
 * widgets for the active workspace (config ∪ override, already merged by the
 * provider), filters them through `visibleWidgets`, builds the widget node map,
 * and hands it to the scene to arrange. App-decoupled (ADR-0009): everything
 * comes through `useReshellState`/tool hooks.
 *
 * The scene's `shellTheme` is applied to `<Shell theme>` in the composition
 * root (it must wrap the whole frame, above `Shell.Content`); both resolve the
 * same scene from `activeWorkspace.scene`, so they never diverge.
 */
export function Canvas() {
  const { activeWorkspace } = useReshellState();
  const timer = useTimer();

  const enabled = CANVAS_WIDGET_IDS.filter((id) => activeWorkspace.widgets[id]);
  const visible = visibleWidgets(enabled, { timerRunning: timer.state.running });

  // Build a node for every id (null when not visible) so a scene can index
  // `widgets[id]` directly and a missing widget simply renders nothing.
  const nodes = {} as Record<CanvasWidgetId, ReactNode>;
  for (const id of CANVAS_WIDGET_IDS) {
    const Widget = WIDGETS[id];
    nodes[id] = visible.includes(id) ? <Widget /> : null;
  }

  const SceneCanvas = getScene(activeWorkspace.scene).Canvas;
  return <SceneCanvas enabledWidgets={visible} widgets={nodes} />;
}
