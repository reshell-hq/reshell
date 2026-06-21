/**
 * Domain Theme — the colour identity of a workspace (CONTEXT: "Theme"). Stored
 * inline on the workspace record in the library; each workspace owns its own.
 * All colours are defined here; a background image is decorative only — Reshell
 * never samples or auto-extracts colours from it.
 *
 * This is the shell-relevant subset. Per-widget text colours (`widgets`) and
 * applied-preset ids attach in later slices (canvas widgets: issue 09; presets:
 * issue 08) — keeping this minimal until those surfaces exist.
 */
export type ThemePalette = {
  /** Canvas background colour. */
  background: string;
  /** Shell (frame) fill and panel surface — always opaque (no glass/blur). */
  surface: string;
  /** Primary text colour. */
  text: string;
  /** Accent colour. */
  accent: string;
};

export type Theme = {
  palette: ThemePalette;
  /**
   * Optional shell border (CONTEXT: "Shell border"). When set, the shell draws
   * a rim/notch border at this colour; when omitted, no border is drawn.
   */
  shellBorderColor?: string;
  /** Decorative canvas background image URL — referenced, never embedded. */
  backgroundUrl?: string;
  /** Corner radius (px) for themed surfaces. */
  borderRadius: number;
};
