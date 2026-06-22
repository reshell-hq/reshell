import type { CSSProperties, ReactNode } from "react";
import type { Scene, SceneProps } from "@/lib/scene";
import styles from "./aurora-scene.module.css";

/**
 * Frosted glass floating over slow northern light: three blurred colour blobs
 * drift behind a centred hero clock and a grid of glass cards. Fixes its own
 * light palette (mode-independent); a violet accent ties the glass together.
 * Ink on the bright glass stays well above 4.5:1.
 */
const shellTheme: Scene["shellTheme"] = {
  shellColor: "oklch(0.95 0.012 280)",
  canvasColor: "oklch(0.965 0.012 250)",
  borderColor: "oklch(0.7 0.09 295)",
  panelColor: "oklch(0.99 0.005 250)",
};

const palette: CSSProperties = {
  color: "oklch(0.28 0.03 264)",
  ["--scene-accent" as string]: "oklch(0.55 0.19 295)",
};

/** A frosted glass card; collapses out of the grid when its widget is empty. */
function Glass({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={`${styles.glass} ${className ?? ""}`}>{children}</div>;
}

function AuroraCanvas({ widgets }: SceneProps) {
  return (
    <div
      style={palette}
      className={`${styles.canvas} flex min-h-full w-full flex-col items-center justify-center gap-9 px-8 py-12`}
    >
      <span aria-hidden className={`${styles.blob} ${styles.b1}`} />
      <span aria-hidden className={`${styles.blob} ${styles.b2}`} />
      <span aria-hidden className={`${styles.blob} ${styles.b3}`} />

      <header className="flex flex-col items-center gap-2 text-center empty:hidden">
        {widgets.welcome}
        {widgets.clock}
      </header>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Glass className="sm:col-span-2">{widgets.quote}</Glass>
        <Glass>{widgets.nowPlaying}</Glass>
        <Glass>{widgets.pomodoro}</Glass>
        <Glass className="sm:col-span-2">{widgets.focusTasks}</Glass>
      </div>
    </div>
  );
}

export const auroraScene: Scene = {
  name: "aurora",
  shellTheme,
  Canvas: AuroraCanvas,
};
