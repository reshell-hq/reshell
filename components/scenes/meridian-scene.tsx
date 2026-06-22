import type { CSSProperties } from "react";
import type { Scene, SceneProps } from "@/lib/scene";
import styles from "./meridian-scene.module.css";

/**
 * A deliberately dark, contemplative scene — twilight in both light and dark
 * mode, so it fixes its own deep palette rather than riding the app tokens. The
 * clock glows at the centre of a horizon band; everything else is symmetric and
 * low-emphasis. A cool blue is the accent. Light text on the deep canvas keeps
 * contrast well above 4.5:1.
 */
const shellTheme: Scene["shellTheme"] = {
  shellColor: "oklch(0.15 0.02 275)",
  canvasColor: "oklch(0.205 0.035 275)",
  borderColor: "oklch(0.44 0.05 275)",
  panelColor: "oklch(0.24 0.035 275)",
};

const palette: CSSProperties = {
  color: "oklch(0.95 0.012 275)",
  ["--scene-accent" as string]: "oklch(0.74 0.13 235)",
};

function MeridianCanvas({ widgets }: SceneProps) {
  return (
    <div
      style={palette}
      className={`${styles.canvas} flex min-h-full w-full flex-col items-center justify-center gap-6 px-8 py-12 text-center`}
    >
      <span aria-hidden className={styles.glow} />
      <span aria-hidden className={styles.horizon} />

      <div className={`${styles.content} flex flex-col items-center gap-6`}>
        {widgets.welcome}
        <div className={styles.clockGlow}>{widgets.clock}</div>
        {widgets.quote}
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 empty:hidden">
          {widgets.nowPlaying}
          {widgets.pomodoro}
          {widgets.focusTasks}
        </div>
      </div>
    </div>
  );
}

export const meridianScene: Scene = {
  name: "meridian",
  shellTheme,
  Canvas: MeridianCanvas,
};
