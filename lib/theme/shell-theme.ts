import type { CSSProperties } from "react";
import type { ShellThemeInput } from "@/lib/shell/theme";
import type { Theme } from "./types";

/** Rim stroke width (CSS px) used when a shell border is drawn. */
const SHELL_BORDER_WIDTH = 1.5;

function hasShellBorder(theme: Theme): boolean {
  return (
    typeof theme.shellBorderColor === "string" &&
    theme.shellBorderColor.trim().length > 0
  );
}

/**
 * Map a domain Theme onto the shell's appearance inputs. The shell fill and the
 * panel surface are both the opaque `palette.surface` (no frosted glass); the
 * canvas takes `palette.background`. The rim border is drawn only when the
 * workspace sets `shellBorderColor` — otherwise width collapses to 0.
 */
export function themeToShellInput(theme: Theme): ShellThemeInput {
  const bordered = hasShellBorder(theme);
  return {
    shellColor: theme.palette.surface,
    canvasColor: theme.palette.background,
    panelColor: theme.palette.surface,
    borderColor: bordered ? theme.shellBorderColor! : "transparent",
    borderWidth: bordered ? SHELL_BORDER_WIDTH : 0,
  };
}

/**
 * Decorative canvas background for the workspace. Returns a solid fill from the
 * palette, layering the background image on top when one is set. The image is
 * always referenced by URL — never embedded — and changing it does not adjust
 * any other colours.
 */
export function canvasBackgroundStyle(theme: Theme): CSSProperties {
  const base: CSSProperties = { backgroundColor: theme.palette.background };
  if (!theme.backgroundUrl) {
    return base;
  }
  return {
    ...base,
    backgroundImage: `url(${theme.backgroundUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
}
