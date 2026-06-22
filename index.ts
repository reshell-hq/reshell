/**
 * reshell — public API (the submodule contract).
 *
 * This barrel is what the reshell-workspace imports to build the paid tiers
 * (standard, pro, team). Everything re-exported here is supported; anything
 * reachable only by a deep path (`@/lib/.../internal`) is internal and may
 * change without notice. Renaming or removing an export here is a BREAKING
 * change for the consuming workspace, not a free refactor (ADR-0009).
 *
 * Note: the slot components, scenes, widgets, hooks, and `<Icon>` are React
 * client modules; `lib/config` types and validators are server-safe. Nothing
 * here imports from `app/` or pulls in a global stylesheet, so a consumer can
 * compose these without dragging in the composition root.
 */

// --- Provider + hooks -------------------------------------------------------
export {
  ReshellProvider,
  useReshellState,
  useTimer,
  useTasks,
  useMusic,
  useClock,
  type ReshellState,
  type UseTimer,
  type UseTasks,
  type UseMusic,
  type ClockOptions,
} from "@/hooks";

// --- Shell primitive --------------------------------------------------------
export { Shell } from "@/components/shell";
export type {
  ShellEdge,
  ShellTheme,
  ShellThemeInput,
  ShellHandleComponent,
  ShellHandleRenderProps,
} from "@/lib/shell";

// --- Slot components (the per-edge fixtures) --------------------------------
export {
  BookmarkGroupSlot,
  Canvas,
  CommandBarSlot,
  CommandCenterSlot,
  MusicSlot,
  TasksSlot,
  TimerSlot,
  WorkspaceEdges,
  YoutubePlayer,
} from "@/components/personal";

// --- Scenes + registry ------------------------------------------------------
export {
  defaultScene,
  editorialScene,
  meridianScene,
  atelierScene,
  scenes,
  getScene,
} from "@/components/scenes";
export type { Scene, SceneProps } from "@/lib/scene";

// --- Canvas widgets ---------------------------------------------------------
export {
  ClockWidget,
  WelcomeWidget,
  QuoteWidget,
  NowPlayingWidget,
  PomodoroWidget,
  FocusTasksWidget,
} from "@/components/widgets";

// --- Icons ------------------------------------------------------------------
export { Icon } from "@/components/icon";
export { ICON_NAMES, isIconName, resolveIcon, type IconName } from "@/lib/icons";

// --- Config: types, schema, validation --------------------------------------
export {
  validateConfig,
  reshellConfigSchema,
  CANVAS_WIDGET_IDS,
  SCENE_NAMES,
  type ReshellConfig,
  type WorkspaceConfig,
  type BookmarkGroup,
  type Bookmark,
  type MusicStation,
  type CanvasWidgetId,
  type SceneName,
  type FocusSplit,
  type ShortcutAction,
} from "@/lib/config";
