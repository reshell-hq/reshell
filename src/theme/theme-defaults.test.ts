import { describe, expect, it } from "vitest";
import { createDefaultWidgetStyles, resolveTheme } from "./theme-defaults";
import type { Theme } from "@/library/types";

const palette = {
  background: "#f5f0e8",
  surface: "#fffdf9",
  text: "#2c2419",
  accent: "#c17f59",
};

describe("resolveTheme", () => {
  it("fills missing canvas widget styles from the shell palette", () => {
    const theme: Theme = {
      palette,
      borderRadius: 20,
      widgets: {
        clock: {
          zone: "upper-center",
          order: 0,
          text: "#ffffff",
          textMuted: "#dddddd",
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
        },
      },
    };

    const resolved = resolveTheme(theme);

    expect(resolved.widgets.clock).toEqual(theme.widgets.clock);
    expect(resolved.widgets.welcome).toEqual(
      createDefaultWidgetStyles(palette).welcome,
    );
  });
});
