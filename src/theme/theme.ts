import type { CanvasWidgetId } from "@/canvas-widgets/types";
import type { Theme, ThemePalette } from "@/library/types";
import { editorialTypographyCssVars } from "./editorial-typography";
import { resolveTheme } from "./theme-defaults";

function parseHexChannel(hex: string, offset: number): number {
  return Number.parseInt(hex.trim().replace("#", "").slice(offset, offset + 2), 16);
}

function lerpHexChannel(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t);
}

function lerpHexColor(from: string, to: string, t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const channels = [0, 2, 4].map((offset) =>
    lerpHexChannel(parseHexChannel(from, offset), parseHexChannel(to, offset), clamped),
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function lerpPalette(from: ThemePalette, to: ThemePalette, t: number): ThemePalette {
  return {
    background: lerpHexColor(from.background, to.background, t),
    surface: lerpHexColor(from.surface, to.surface, t),
    text: lerpHexColor(from.text, to.text, t),
    accent: lerpHexColor(from.accent, to.accent, t),
  };
}

function widgetCssVarName(widgetId: CanvasWidgetId, suffix: "text" | "text-muted" | "text-shadow") {
  return `--canvas-widget-${widgetId}-${suffix}`;
}

export function themeToCssVars(theme: Theme): Record<string, string> {
  const resolved = resolveTheme(theme);
  const vars: Record<string, string> = {
    "--qs-color-background": resolved.palette.background,
    "--qs-color-surface": resolved.palette.surface,
    "--qs-color-text": resolved.palette.text,
    "--qs-color-accent": resolved.palette.accent,
    "--qs-shell-border-color": resolved.shellBorderColor ?? resolved.palette.text,
    "--qs-shell-fill-strength": "1",
    "--qs-background-image": resolved.backgroundUrl ? `url(${resolved.backgroundUrl})` : "none",
    "--qs-border-radius": `${resolved.borderRadius}px`,
  };

  for (const widgetId of Object.keys(resolved.widgets) as CanvasWidgetId[]) {
    const style = resolved.widgets[widgetId]!;
    vars[widgetCssVarName(widgetId, "text")] = style.text;
    vars[widgetCssVarName(widgetId, "text-muted")] = style.textMuted;
    vars[widgetCssVarName(widgetId, "text-shadow")] = style.textShadow;
  }

  Object.assign(vars, editorialTypographyCssVars(theme));

  return vars;
}

export function applyTheme(element: HTMLElement, theme: Theme): void {
  const vars = themeToCssVars(theme);
  for (const [key, value] of Object.entries(vars)) {
    element.style.setProperty(key, value);
  }
}
