import type { CanvasWidgetId, SceneName } from "@/lib/config";
import type { TimerState } from "@/lib/timer";

/**
 * The mutable runtime layer, merged over the read-only config (ADR-0007).
 * Keep `WorkspaceOverride` additive — later plans (012 tasks, 013 music) extend
 * it with tool state; don't reshape existing fields.
 */
export type WorkspaceOverride = {
  /** Command-center scene switch. */
  scene?: SceneName;
  /** Command-center per-widget visibility toggles. */
  widgets?: Partial<Record<CanvasWidgetId, boolean>>;
  /** Timer tool state (plan 011); absent until the timer is first touched. */
  timer?: TimerState;
};

export type OverrideState = {
  activeWorkspaceId?: string;
  /** Per-workspace overrides, keyed by workspace id. */
  workspaces: Record<string, WorkspaceOverride>;
};
