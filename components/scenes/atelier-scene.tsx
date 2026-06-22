import type { CSSProperties } from "react";
import { CANVAS_WIDGET_IDS } from "@/lib/config";
import type { Scene, SceneProps } from "@/lib/scene";
import styles from "./atelier-scene.module.css";

/**
 * A warm studio wall: each enabled widget is a tilted, pinned card on cream
 * paper, the clock the largest piece. Distinct from the other scenes' aligned
 * grids — this one is deliberately irregular. Warm charcoal on cream with an
 * amber accent (`--chart-4`, from DESIGN.md's ramp); contrast stays > 4.5:1.
 */
const shellTheme: Scene["shellTheme"] = {
  shellColor: "oklch(0.93 0.014 85)",
  canvasColor: "oklch(0.972 0.013 85)",
  borderColor: "oklch(0.55 0.03 70)",
  panelColor: "oklch(0.985 0.01 85)",
};

const palette: CSSProperties = {
  color: "oklch(0.25 0.02 60)",
  ["--scene-accent" as string]: "var(--chart-4)",
  ["--atelier-card" as string]: "oklch(0.987 0.009 85)",
};

function AtelierCanvas({ enabledWidgets, widgets }: SceneProps) {
  // Render the wall in the canonical widget order (stable, not the toggle
  // order) so the collage doesn't reshuffle as widgets are switched on/off.
  const ordered = CANVAS_WIDGET_IDS.filter((id) => enabledWidgets.includes(id));

  return (
    <div
      style={palette}
      className={`${styles.canvas} flex min-h-full w-full items-center justify-center px-8 py-12`}
    >
      <div
        className={`${styles.collage} flex max-w-3xl flex-wrap items-center justify-center gap-6`}
      >
        {ordered.map((id) => (
          <div
            key={id}
            className={`${styles.card} ${id === "clock" ? styles.cardLarge : ""}`}
          >
            {widgets[id]}
          </div>
        ))}
      </div>
    </div>
  );
}

export const atelierScene: Scene = {
  name: "atelier",
  shellTheme,
  Canvas: AtelierCanvas,
};
