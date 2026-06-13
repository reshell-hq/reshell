import type { Theme } from "@/library/types";
import { type LayoutPresetId, isLayoutPresetId } from "./layout-presets";

export function resolveLayoutPresetId(theme: Theme): LayoutPresetId {
  if (theme.appliedLayoutPresetId && isLayoutPresetId(theme.appliedLayoutPresetId)) {
    return theme.appliedLayoutPresetId;
  }

  return "default";
}
