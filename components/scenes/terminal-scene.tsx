import type { CSSProperties } from "react";
import type { Scene, SceneProps } from "@/lib/scene";
import styles from "./terminal-scene.module.css";

/**
 * A literal phosphor command centre: a framed terminal window with a title bar,
 * faint scanlines, and a blinking cursor. The whole canvas is monospace so every
 * widget reads as program output; amber is the accent against CRT green. Fixes
 * its own palette (mode-independent); green-on-near-black clears 4.5:1 easily.
 */
const shellTheme: Scene["shellTheme"] = {
  shellColor: "oklch(0.135 0.012 155)",
  canvasColor: "oklch(0.15 0.012 155)",
  borderColor: "oklch(0.52 0.12 152)",
  panelColor: "oklch(0.18 0.015 155)",
};

const palette: CSSProperties = {
  color: "oklch(0.86 0.16 152)",
  fontFamily: "var(--font-mono)",
  ["--scene-accent" as string]: "oklch(0.83 0.15 78)",
};

function TerminalCanvas({ widgets }: SceneProps) {
  return (
    <div
      style={palette}
      className={`${styles.canvas} flex min-h-full w-full items-start justify-center px-6 py-12`}
    >
      <div className={`${styles.window} w-full max-w-3xl`}>
        <div className={styles.bar}>
          <i className={styles.dot} data-tone="r" />
          <i className={styles.dot} data-tone="y" />
          <i className={styles.dot} data-tone="g" />
          <span className={styles.barTitle}>~/reshell — focus session</span>
        </div>

        <div className={`${styles.body} flex flex-col gap-6 text-left`}>
          <div className="flex flex-col gap-2 empty:hidden">
            {widgets.welcome}
            {widgets.clock}
          </div>

          {widgets.quote}

          <div className="flex flex-wrap items-start gap-x-10 gap-y-5 empty:hidden">
            {widgets.nowPlaying}
            {widgets.pomodoro}
            {widgets.focusTasks}
          </div>

          <p className={styles.cmd}>
            <span className={styles.prompt}>you@reshell ~ $</span>
            <span aria-hidden className={styles.cursor} />
          </p>
        </div>
      </div>
    </div>
  );
}

export const terminalScene: Scene = {
  name: "terminal",
  shellTheme,
  Canvas: TerminalCanvas,
};
