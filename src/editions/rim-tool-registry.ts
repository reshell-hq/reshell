import { createRegistry } from "./registry";

/**
 * An extra right-rim internal tool contributed by a paid edition (e.g. the Pro
 * agent tool). Empty in the OSS build. `id` becomes the tool's zone id via
 * `internalToolZoneId`; the private compose supplies the flyout rendering.
 */
export type ExtraRimTool = {
  id: string;
  label: string;
  /** Handle glyph (emoji or short text) shown on the right rim. */
  glyph: string;
  /** Default flyout menu size, mirroring the builtin tools. */
  menuSize: { width: number; height: number };
};

export const rimToolRegistry = createRegistry<ExtraRimTool>();
