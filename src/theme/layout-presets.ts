import type { CanvasWidgetId } from "@/canvas-widgets/types";
import type { CanvasWidgetStyle, Workspace } from "@/library/types";
import { resolveTheme } from "./theme-defaults";

export const LAYOUT_PRESET_IDS = ["default", "editorial", "meridian", "atelier"] as const;

export type LayoutPresetId = (typeof LAYOUT_PRESET_IDS)[number];

export type LayoutPresentation = "zone-grid" | "corner-stage" | "meridian-stage" | "atelier-stage";

type WidgetLayout = Pick<CanvasWidgetStyle, "zone" | "order">;

export type LayoutPreset = {
  id: LayoutPresetId;
  name: string;
  description: string;
  presentation: LayoutPresentation;
  widgets: Record<CanvasWidgetId, WidgetLayout>;
};

const DEFAULT_WIDGET_LAYOUT: Record<CanvasWidgetId, WidgetLayout> = {
  clock: { zone: "upper-center", order: 0 },
  welcome: { zone: "center", order: 0 },
  quote: { zone: "center", order: 1 },
  nowPlaying: { zone: "bottom-center", order: 0 },
  focusTasks: { zone: "lower-right", order: 0 },
  pomodoro: { zone: "center", order: 0 },
};

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: "default",
    name: "Default",
    description: "Balanced zone grid",
    presentation: "zone-grid",
    widgets: DEFAULT_WIDGET_LAYOUT,
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Four-corner magazine stage",
    presentation: "corner-stage",
    widgets: {
      quote: { zone: "lower-left", order: 0 },
      nowPlaying: { zone: "lower-left", order: 1 },
      focusTasks: { zone: "lower-right", order: 0 },
      welcome: { zone: "bottom-center", order: 0 },
      clock: { zone: "bottom-center", order: 1 },
      pomodoro: { zone: "center", order: 0 },
    },
  },
  {
    id: "meridian",
    name: "Meridian",
    description: "Horizontal bands with a center hero clock",
    presentation: "meridian-stage",
    widgets: {
      quote: { zone: "lower-left", order: 0 },
      welcome: { zone: "lower-right", order: 0 },
      focusTasks: { zone: "lower-left", order: 1 },
      nowPlaying: { zone: "lower-right", order: 1 },
      clock: { zone: "center", order: 0 },
      pomodoro: { zone: "center", order: 0 },
    },
  },
  {
    id: "atelier",
    name: "Atelier",
    description: "Dual-column rails with a anchored clock",
    presentation: "atelier-stage",
    widgets: {
      quote: { zone: "lower-left", order: 0 },
      welcome: { zone: "lower-left", order: 1 },
      nowPlaying: { zone: "lower-left", order: 2 },
      focusTasks: { zone: "lower-right", order: 0 },
      clock: { zone: "lower-right", order: 1 },
      pomodoro: { zone: "center", order: 0 },
    },
  },
];

const presetById = new Map(LAYOUT_PRESETS.map((preset) => [preset.id, preset]));

export function isLayoutPresetId(id: string): id is LayoutPresetId {
  return (LAYOUT_PRESET_IDS as readonly string[]).includes(id);
}

export function getLayoutPreset(id: LayoutPresetId): LayoutPreset | undefined {
  return presetById.get(id);
}

export function getLayoutPresentation(id: LayoutPresetId): LayoutPresentation {
  return getLayoutPreset(id)?.presentation ?? "zone-grid";
}

export function applyLayoutPreset(workspace: Workspace, presetId: LayoutPresetId): Workspace {
  const preset = getLayoutPreset(presetId);
  if (!preset) {
    throw new Error(`Unknown layout preset "${presetId}"`);
  }

  const resolved = resolveTheme(workspace.theme);
  const widgets = { ...resolved.widgets };

  for (const widgetId of Object.keys(preset.widgets) as CanvasWidgetId[]) {
    widgets[widgetId] = {
      ...widgets[widgetId],
      ...preset.widgets[widgetId],
    };
  }

  return {
    ...workspace,
    theme: {
      ...workspace.theme,
      widgets,
      appliedLayoutPresetId: presetId,
    },
  };
}
