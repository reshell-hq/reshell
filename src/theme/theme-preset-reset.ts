import type { CanvasWidgetId } from "@/canvas-widgets/types";
import type { ThemePatch, Workspace } from "@/library/types";
import { getLayoutPreset } from "./layout-presets";
import { resolveLayoutPresetId } from "./resolve-layout-preset";
import { getThemePreset, isThemePresetId } from "./theme-presets";

export function resetShellThemeToPreset(workspace: Workspace): ThemePatch | null {
  const presetId = workspace.theme.appliedThemePresetId ?? workspace.theme.appliedPresetId;
  if (!presetId || !isThemePresetId(presetId)) {
    return null;
  }

  const preset = getThemePreset(presetId);
  if (!preset) {
    return null;
  }

  return {
    palette: { ...preset.theme.palette },
    ...(preset.theme.shellBorderColor
      ? { shellBorderColor: preset.theme.shellBorderColor }
      : { shellBorderColor: null }),
    borderRadius: preset.theme.borderRadius,
    backgroundUrl: preset.theme.backgroundUrl,
  };
}

export function resetWidgetThemeToPreset(
  workspace: Workspace,
  widgetId: CanvasWidgetId,
): ThemePatch | null {
  const presetId = workspace.theme.appliedThemePresetId ?? workspace.theme.appliedPresetId;
  if (!presetId || !isThemePresetId(presetId)) {
    return null;
  }

  const preset = getThemePreset(presetId);
  const widgetStyle = preset?.theme.widgets[widgetId];
  if (!widgetStyle) {
    return null;
  }

  return {
    widgets: {
      [widgetId]: {
        text: widgetStyle.text,
        textMuted: widgetStyle.textMuted,
        textShadow: widgetStyle.textShadow,
      },
    },
  };
}

export function resetWidgetLayoutToPreset(
  workspace: Workspace,
  widgetId: CanvasWidgetId,
): ThemePatch | null {
  const preset = getLayoutPreset(resolveLayoutPresetId(workspace.theme));
  const widgetLayout = preset?.widgets[widgetId];
  if (!widgetLayout) {
    return null;
  }

  return {
    widgets: {
      [widgetId]: { ...widgetLayout },
    },
  };
}
