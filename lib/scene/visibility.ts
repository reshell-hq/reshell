import type { CanvasWidgetId } from "@/lib/config";

/** Live tool state the visibility rules depend on. */
export type WidgetVisibilityState = {
  timerRunning: boolean;
};

/**
 * Reduce the config-enabled widget ids to the ones a scene should actually lay
 * out, applying the ambient-canvas rules ported from yeti-workspace. Pure and
 * order-preserving (input order is kept), so a scene receives a stable, final
 * id list. Zero React/DOM deps (ADR-0009) — unit-tested.
 *
 * Rules:
 * - `pomodoro` is an "only while it matters" readout: shown only while a timer
 *   is running.
 * - When the pomodoro readout is visible, `clock` is hidden — the running
 *   countdown already owns the big-numerals slot, so two clocks would compete.
 */
export function visibleWidgets(
  enabled: CanvasWidgetId[],
  state: WidgetVisibilityState,
): CanvasWidgetId[] {
  const pomodoroVisible = state.timerRunning && enabled.includes("pomodoro");

  return enabled.filter((id) => {
    if (id === "pomodoro") {
      return pomodoroVisible;
    }
    if (id === "clock") {
      return !pomodoroVisible;
    }
    return true;
  });
}
