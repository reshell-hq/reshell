import type { CSSProperties } from "react";
import type { Scene, SceneProps } from "@/lib/scene";
import styles from "./default-scene.module.css";

/**
 * The calm, centred baseline scene. It rides the app's adaptive oklch tokens
 * (DESIGN.md) so it flips cleanly between light and dark, and arranges the
 * widgets as one symmetric vertical column: greeting kicker, hero clock, quote,
 * then a row of ambient tool readouts. Indigo (`--primary`) is the only accent.
 */
const shellTheme: Scene["shellTheme"] = {
  shellColor: "var(--muted)",
  canvasColor: "var(--background)",
  borderColor: "var(--border)",
  panelColor: "var(--popover)",
};

// Scene-local text palette (NOT global tokens): widgets inherit this `color`
// and read `--scene-accent` for emphasis, so the canvas colour and its text are
// co-designed here and can never fight the global --foreground (the STOP-cond
// mapping; see plan 014).
const palette: CSSProperties = {
  color: "var(--foreground)",
  ["--scene-accent" as string]: "var(--primary)",
};

function DefaultCanvas({ widgets }: SceneProps) {
  return (
    <div
      style={palette}
      className={`${styles.canvas} flex min-h-full w-full flex-col items-center justify-center gap-8 px-8 py-12 text-center`}
    >
      {widgets.welcome}
      {widgets.clock}
      {widgets.quote}
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 empty:hidden">
        {widgets.nowPlaying}
        {widgets.pomodoro}
        {widgets.focusTasks}
      </div>
    </div>
  );
}

export const defaultScene: Scene = {
  name: "default",
  shellTheme,
  Canvas: DefaultCanvas,
};
