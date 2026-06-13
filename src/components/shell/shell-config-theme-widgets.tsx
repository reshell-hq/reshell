"use client";

import { CANVAS_WIDGET_IDS } from "@/canvas-widgets/config";
import { CANVAS_ZONES } from "@/canvas-widgets/zone-layout";
import type { CanvasWidgetId } from "@/canvas-widgets/types";
import type { CanvasWidgetStyle, ThemePatch, Workspace } from "@/library/types";
import { resolveTheme } from "@/theme/theme-defaults";
import { resetWidgetThemeToPreset } from "@/theme/theme-preset-reset";

const WIDGET_LABELS: Record<CanvasWidgetId, string> = {
  clock: "Clock",
  welcome: "Welcome",
  quote: "Quote",
  nowPlaying: "Now playing",
  pomodoro: "Pomodoro",
  focusTasks: "Focus tasks",
};

type ShellConfigThemeWidgetsProps = {
  workspace: Workspace;
  onPatch: (patch: ThemePatch) => void;
};

function patchWidget(
  widgetId: CanvasWidgetId,
  partial: Partial<CanvasWidgetStyle>,
): ThemePatch {
  return { widgets: { [widgetId]: partial } };
}

export function ShellConfigThemeWidgets({ workspace, onPatch }: ShellConfigThemeWidgetsProps) {
  const resolved = resolveTheme(workspace.theme);
  const canReset = Boolean(workspace.theme.appliedPresetId);

  return (
    <div className="shell-config-form">
      <p className="shell-config-form-label">Canvas widgets</p>
      <div className="shell-config-theme-widget-list">
        {CANVAS_WIDGET_IDS.map((widgetId) => {
          const style = resolved.widgets[widgetId]!;
          return (
            <details key={widgetId} className="shell-config-theme-widget">
              <summary className="shell-config-theme-widget-summary">{WIDGET_LABELS[widgetId]}</summary>
              <div className="shell-config-theme-widget-body">
                <label className="shell-config-color-field">
                  <span className="shell-config-form-label">Zone</span>
                  <select
                    className="shell-config-input"
                    value={style.zone}
                    onChange={(event) =>
                      onPatch(patchWidget(widgetId, { zone: event.target.value as CanvasWidgetStyle["zone"] }))
                    }
                  >
                    {CANVAS_ZONES.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="shell-config-color-field">
                  <span className="shell-config-form-label">Order in zone</span>
                  <input
                    type="number"
                    min={0}
                    className="shell-config-input"
                    value={style.order}
                    onChange={(event) =>
                      onPatch(patchWidget(widgetId, { order: Number(event.target.value) }))
                    }
                  />
                </label>

                {(["text", "textMuted"] as const).map((field) => (
                  <label key={field} className="shell-config-color-field">
                    <span className="shell-config-form-label">
                      {field === "text" ? "Text" : "Muted text"}
                    </span>
                    <div className="shell-config-color-input">
                      <input
                        type="color"
                        value={style[field]}
                        onChange={(event) =>
                          onPatch(patchWidget(widgetId, { [field]: event.target.value }))
                        }
                        aria-label={`${WIDGET_LABELS[widgetId]} ${field}`}
                      />
                      <input
                        type="text"
                        value={style[field]}
                        onChange={(event) =>
                          onPatch(patchWidget(widgetId, { [field]: event.target.value }))
                        }
                        className="shell-config-input"
                      />
                    </div>
                  </label>
                ))}

                <label className="shell-config-color-field">
                  <span className="shell-config-form-label">Text shadow</span>
                  <input
                    type="text"
                    value={style.textShadow}
                    onChange={(event) =>
                      onPatch(patchWidget(widgetId, { textShadow: event.target.value }))
                    }
                    className="shell-config-input"
                    placeholder="0 1px 3px rgba(0,0,0,0.5)"
                  />
                </label>

                {canReset ? (
                  <button
                    type="button"
                    className="shell-config-action"
                    onClick={() => {
                      const patch = resetWidgetThemeToPreset(workspace, widgetId);
                      if (patch) {
                        onPatch(patch);
                      }
                    }}
                  >
                    Reset to preset
                  </button>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
