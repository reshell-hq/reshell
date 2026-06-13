import type { Theme } from "@/library/types";
import { resolveLayoutPresetId } from "./resolve-layout-preset";

export const EDITORIAL_CLOCK_TYPOGRAPHY_VARS = {
  "--canvas-widget-clock-time-size": "clamp(4rem, 12vw, 7rem)",
  "--canvas-widget-clock-time-weight": "700",
  "--canvas-widget-clock-time-tracking": "-0.04em",
} as const;

export function editorialTypographyCssVars(theme: Theme): Record<string, string> {
  if (resolveLayoutPresetId(theme) !== "editorial") {
    return {};
  }

  return { ...EDITORIAL_CLOCK_TYPOGRAPHY_VARS };
}
