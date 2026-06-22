import type { ReactNode } from "react";
import type { CanvasWidgetId, SceneName } from "@/lib/config";
import type { ShellTheme } from "@/lib/shell/theme";

/**
 * The Scene contract (ADR-0008). A scene is a self-contained component that
 * owns *both* its look (a `ShellTheme` palette) and the arrangement of the
 * enabled canvas widgets. Type-only React import — this module stays free of
 * runtime React/DOM so it can live in the portable core (ADR-0009).
 */

/**
 * What a scene's `Canvas` receives. The host (`<Canvas/>`) decides which
 * widgets are visible and pre-builds their nodes; the scene only places them.
 *
 * - `enabledWidgets` — the final ordered ids the scene should lay out
 *   (config-enabled, then filtered by `visibleWidgets`).
 * - `widgets` — a node for every `CanvasWidgetId`; ids not in `enabledWidgets`
 *   map to `null`, so a scene can index `widgets[id]` directly and rely on a
 *   missing widget rendering nothing.
 */
export type SceneProps = {
  enabledWidgets: CanvasWidgetId[];
  widgets: Record<CanvasWidgetId, ReactNode>;
};

/**
 * A built-in scene. `shellTheme` is partial: a scene maps only the surfaces it
 * cares about, and the shell fills the rest from its defaults. `Canvas` is a
 * plain render function (not a hook-bearing component contract) — it just
 * arranges the nodes it is handed.
 */
export type Scene = {
  name: SceneName;
  shellTheme: Partial<ShellTheme>;
  Canvas: (props: SceneProps) => ReactNode;
};
