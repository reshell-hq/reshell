import type { CSSProperties } from "react";
import type { Scene, SceneProps } from "@/lib/scene";
import styles from "./editorial-scene.module.css";

/**
 * A printed-spread scene: a bold ink rim, an off-white page, and a strict
 * left-aligned masthead → pull-quote → byline column. The clock is the
 * nameplate; the quote is the centrepiece behind an accent rule. Editorial red
 * (`--chart-5`, part of DESIGN.md's sanctioned ramp) is the single accent.
 */
const shellTheme: Scene["shellTheme"] = {
  shellColor: "var(--secondary)",
  canvasColor: "var(--card)",
  borderColor: "var(--foreground)",
  borderWidth: 2.5,
  panelColor: "var(--popover)",
};

const palette: CSSProperties = {
  color: "var(--foreground)",
  ["--scene-accent" as string]: "var(--chart-5)",
};

function EditorialCanvas({ widgets }: SceneProps) {
  return (
    <div
      style={palette}
      className={`${styles.canvas} flex min-h-full w-full flex-col justify-between gap-10 px-10 py-10 text-left md:px-16`}
    >
      <header className="flex flex-col gap-3 border-b-2 border-current pb-5 empty:hidden">
        {widgets.welcome}
        {widgets.clock}
      </header>

      <div
        className={`${styles.pullquote} border-l-4 pl-6 empty:hidden`}
        style={{ borderColor: "var(--scene-accent)" }}
      >
        {widgets.quote}
      </div>

      <footer className="flex flex-wrap items-center gap-x-12 gap-y-4 border-t border-current/30 pt-5 empty:hidden">
        {widgets.nowPlaying}
        {widgets.pomodoro}
        {widgets.focusTasks}
      </footer>
    </div>
  );
}

export const editorialScene: Scene = {
  name: "editorial",
  shellTheme,
  Canvas: EditorialCanvas,
};
