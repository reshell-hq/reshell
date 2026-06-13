import type { CanvasWidgetId } from "@/canvas-widgets/types";
import type { Library, Theme, ThemePatch } from "@/library/types";
import { resolveTheme } from "./theme-defaults";
import { applyLayoutPreset, type LayoutPresetId } from "./layout-presets";
import { applyThemePreset, type ThemePresetId } from "./theme-presets";

function applyThemePatch(theme: Theme, patch: ThemePatch): Theme {
  const base = resolveTheme(theme);
  let next: Theme = {
    ...base,
    palette: {
      ...base.palette,
      ...(patch.palette ?? {}),
    },
    ...(patch.borderRadius !== undefined ? { borderRadius: patch.borderRadius } : {}),
  };

  if (patch.shellBorderColor === null) {
    const { shellBorderColor: _removed, ...withoutBorder } = next;
    next = withoutBorder;
  } else if (patch.shellBorderColor !== undefined) {
    next = { ...next, shellBorderColor: patch.shellBorderColor };
  }

  if (patch.widgets) {
    const widgets = { ...base.widgets };
    for (const [id, partial] of Object.entries(patch.widgets)) {
      const widgetId = id as CanvasWidgetId;
      widgets[widgetId] = { ...widgets[widgetId], ...partial };
    }
    next = { ...next, widgets };
  }

  if (patch.appliedPresetId === null) {
    const { appliedPresetId: _removed, ...withoutPreset } = next;
    next = withoutPreset;
  } else if (patch.appliedPresetId !== undefined) {
    next = { ...next, appliedPresetId: patch.appliedPresetId };
  }

  if (patch.appliedThemePresetId === null) {
    const { appliedThemePresetId: _removed, ...withoutThemePreset } = next;
    next = withoutThemePreset;
  } else if (patch.appliedThemePresetId !== undefined) {
    next = { ...next, appliedThemePresetId: patch.appliedThemePresetId };
  }

  if (patch.appliedLayoutPresetId === null) {
    const { appliedLayoutPresetId: _removed, ...withoutLayoutPreset } = next;
    next = withoutLayoutPreset;
  } else if (patch.appliedLayoutPresetId !== undefined) {
    next = { ...next, appliedLayoutPresetId: patch.appliedLayoutPresetId };
  }

  if (patch.backgroundUrl === null) {
    const { backgroundUrl: _removed, ...withoutBackground } = next;
    return withoutBackground;
  }

  if (patch.backgroundUrl !== undefined) {
    const trimmed = patch.backgroundUrl.trim();
    next = trimmed
      ? { ...next, backgroundUrl: trimmed }
      : { ...next, backgroundUrl: undefined };
  }

  return next;
}

export function applyLayoutPresetToWorkspace(
  library: Library,
  workspaceId: string,
  presetId: LayoutPresetId,
): Library {
  if (!library.workspaces.some((workspace) => workspace.id === workspaceId)) {
    throw new Error(`Workspace "${workspaceId}" not found`);
  }

  return {
    ...library,
    workspaces: library.workspaces.map((workspace) =>
      workspace.id === workspaceId ? applyLayoutPreset(workspace, presetId) : workspace,
    ),
  };
}

export function applyThemePresetToWorkspace(
  library: Library,
  workspaceId: string,
  presetId: ThemePresetId,
): Library {
  if (!library.workspaces.some((workspace) => workspace.id === workspaceId)) {
    throw new Error(`Workspace "${workspaceId}" not found`);
  }

  return {
    ...library,
    workspaces: library.workspaces.map((workspace) =>
      workspace.id === workspaceId ? applyThemePreset(workspace, presetId) : workspace,
    ),
  };
}

export function updateWorkspaceTheme(
  library: Library,
  workspaceId: string,
  patch: ThemePatch,
): Library {
  if (!library.workspaces.some((workspace) => workspace.id === workspaceId)) {
    throw new Error(`Workspace "${workspaceId}" not found`);
  }

  return {
    ...library,
    workspaces: library.workspaces.map((workspace) =>
      workspace.id === workspaceId
        ? { ...workspace, theme: applyThemePatch(workspace.theme, patch) }
        : workspace,
    ),
  };
}
