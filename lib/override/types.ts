import type { CanvasWidgetId, SceneName } from "@/lib/config";
import type { MusicPlayback } from "@/lib/music";
import type { FocusTask } from "@/lib/tasks";
import type { TimerState } from "@/lib/timer";

/**
 * The mutable runtime layer, merged over the read-only config (ADR-0007).
 * Keep `WorkspaceOverride` additive — later plans (013 music) extend it with
 * tool state; don't reshape existing fields.
 */
export type WorkspaceOverride = {
  /** Command-center scene switch. */
  scene?: SceneName;
  /** Command-center per-widget visibility toggles. */
  widgets?: Partial<Record<CanvasWidgetId, boolean>>;
  /** Timer tool state (plan 011); absent until the timer is first touched. */
  timer?: TimerState;
  /** Tasks tool state (plan 012); runtime-only, defaults to an empty list. */
  tasks?: FocusTask[];
};

export type OverrideState = {
  activeWorkspaceId?: string;
  /** Per-workspace overrides, keyed by workspace id. */
  workspaces: Record<string, WorkspaceOverride>;
  /**
   * Music playback (plan 013). The ONE **global** override slice — NOT keyed by
   * workspace, so playback survives workspace switches. Absent until the music
   * tool is first touched; defaults derive from `config.music.stations`.
   */
  music?: MusicPlayback;
};
