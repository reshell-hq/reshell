import type { CSSProperties, ReactNode } from "react";

/**
 * Props a custom handle component receives. The shell owns all interaction
 * wiring (hover intent, pin/toggle, focus, positioning); an override is
 * "headless" — it renders visuals only and must spread the handlers, `style`,
 * and aria props onto its interactive element so behaviour stays intact.
 */
export type ShellHandleRenderProps = {
  slotId: string;
  label: string;
  active: boolean;
  style: CSSProperties;
  children: ReactNode;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onClick: () => void;
};

export type ShellHandleComponent = (
  props: ShellHandleRenderProps,
) => ReactNode;

/**
 * Resolved appearance of the shell. Colour tokens follow a four-surface model
 * (see docs/adr/0005): `shellColor` fills the frame region (the gutter, outside
 * the rim), `canvasColor` fills the interior where content lives, the border is
 * the rim stroke, and `panelColor` backs revealed slot content.
 */
export type ShellTheme = {
  /** Fill of the frame region (the gutter, outside the rim). */
  shellColor: string;
  /** Fill of the interior where `Shell.Content` renders. */
  canvasColor: string;
  /** Rim stroke colour. */
  borderColor: string;
  /** Rim stroke width in CSS px (non-scaling). */
  borderWidth: number;
  /** Background of a revealed slot's content within its notch. */
  panelColor: string;
  /** Gutter (CSS px) for an edge that has at least one handle. */
  gutterPx: number;
  /** Gutter (CSS px) for a minimised edge (no handles). */
  minimisedGutterPx: number;
  /** Headless component that renders every handle's visuals. */
  Handle: ShellHandleComponent;
};

export type ShellThemeInput = Partial<ShellTheme>;

/**
 * Non-component theme defaults. Colours default to `transparent` /
 * `currentColor`-style CSS variables so an unthemed shell looks exactly as
 * before and stays automatically light/dark-aware; any token the consumer sets
 * is taken literally. The `Handle` default is supplied in the component layer
 * (this module stays free of React components).
 */
export const DEFAULT_THEME_STYLE = {
  shellColor: "transparent",
  canvasColor: "transparent",
  borderColor: "var(--foreground)",
  borderWidth: 1.5,
  panelColor: "transparent",
  gutterPx: 40,
  minimisedGutterPx: 10,
} satisfies Omit<ShellTheme, "Handle">;

/**
 * Theme colour/size tokens as CSS custom properties, set on the shell root so
 * they cascade to portaled overlay content and are available to consumer slot
 * markup. Layout numbers used by geometry math are still read from the theme
 * object directly.
 */
export function themeCssVars(theme: ShellTheme): CSSProperties {
  return {
    "--shell-color": theme.shellColor,
    "--shell-canvas-color": theme.canvasColor,
    "--shell-border-color": theme.borderColor,
    "--shell-border-width": `${theme.borderWidth}px`,
    "--shell-panel-color": theme.panelColor,
  } as CSSProperties;
}
