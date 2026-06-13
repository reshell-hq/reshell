"use client";

import { usePomodoroTimerNow } from "@/hooks/use-pomodoro-timer-now";
import type { Workspace } from "@/library/types";
import {
  displayPomodoroSeconds,
  formatPomodoroTimerLabel,
  formatTimerSeconds,
  resolveFocusSplit,
} from "@/internal-tools/pomodoro";
import { getActiveFocusTask } from "@/internal-tools/tasks";

type CanvasPomodoroWidgetProps = {
  workspace: Workspace;
};

export function isCanvasTimerActive(workspace: Workspace): boolean {
  return workspace.internalTools.pomodoro.running;
}

export function CanvasPomodoroWidget({ workspace }: CanvasPomodoroWidgetProps) {
  const pomodoro = workspace.internalTools.pomodoro;
  const split = resolveFocusSplit(pomodoro.splitId, workspace.internalTools);
  const now = usePomodoroTimerNow(pomodoro);
  const seconds = displayPomodoroSeconds(pomodoro, split, now);
  const activeTask = getActiveFocusTask(workspace.internalTools);

  if (!pomodoro.running) {
    return null;
  }

  return (
    <div className="canvas-widget canvas-widget-clock canvas-widget-timer">
      <p className="canvas-widget-clock-time" aria-live="polite">
        {formatTimerSeconds(seconds)}
      </p>
      <p className="canvas-widget-clock-date">{formatPomodoroTimerLabel(pomodoro)}</p>
      {activeTask ? <p className="canvas-widget-timer-task">{activeTask.title}</p> : null}
    </div>
  );
}
