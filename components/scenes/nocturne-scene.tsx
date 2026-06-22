import type { CSSProperties, ReactNode } from "react";
import type { Scene, SceneProps } from "@/lib/scene";
import styles from "./nocturne-scene.module.css";

/**
 * A midnight control room: graphite drift lit by two violet/cyan glows, a left-
 * aligned hero clock, and the ambient widgets as frosted bento cards. Distinct
 * from the centred scenes — this one reads as a dashboard. Fixes its own deep
 * palette (mode-independent); violet is the accent. Light text on graphite
 * holds contrast well above 4.5:1.
 */
const shellTheme: Scene["shellTheme"] = {
  shellColor: "oklch(0.14 0.015 285)",
  canvasColor: "oklch(0.175 0.018 285)",
  borderColor: "oklch(0.5 0.12 288)",
  panelColor: "oklch(0.22 0.022 285)",
};

const palette: CSSProperties = {
  color: "oklch(0.97 0.005 285)",
  ["--scene-accent" as string]: "oklch(0.72 0.19 288)",
};

/** A frosted bento card; collapses out of the grid when its widget is empty. */
function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={`${styles.card} ${className ?? ""}`}>{children}</div>;
}

function NocturneCanvas({ widgets }: SceneProps) {
  return (
    <div
      style={palette}
      className={`${styles.canvas} flex min-h-full w-full flex-col justify-center gap-8 px-8 py-12 md:px-14`}
    >
      <div aria-hidden className={styles.glow} />

      <header className="flex flex-col gap-2 empty:hidden">
        {widgets.welcome}
        {widgets.clock}
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="sm:col-span-2">{widgets.quote}</Card>
        <Card>{widgets.nowPlaying}</Card>
        <Card>{widgets.pomodoro}</Card>
        <Card>{widgets.focusTasks}</Card>
      </div>
    </div>
  );
}

export const nocturneScene: Scene = {
  name: "nocturne",
  shellTheme,
  Canvas: NocturneCanvas,
};
