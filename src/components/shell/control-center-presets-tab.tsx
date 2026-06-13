"use client";

import type { Library } from "@/library/types";
import { useApplyLayoutPreset, useApplyThemePreset } from "@/hooks/use-library";
import { LAYOUT_PRESETS } from "@/theme/layout-presets";
import { resolveLayoutPresetId } from "@/theme/resolve-layout-preset";
import { THEME_PRESETS } from "@/theme/theme-presets";
import {
  THEME_PRESET_CARD_CLASS,
  THEME_PRESET_GRID_CLASS,
} from "@/theme/theme-preset-picker-layout";

type ControlCenterPresetsTabProps = {
  library: Library;
};

export function ControlCenterPresetsTab({ library }: ControlCenterPresetsTabProps) {
  const workspace = library.workspaces.find((entry) => entry.id === library.activeWorkspaceId);
  const applyThemePreset = useApplyThemePreset();
  const applyLayoutPreset = useApplyLayoutPreset();

  if (!workspace) {
    return null;
  }

  const activeLayoutPresetId = resolveLayoutPresetId(workspace.theme);

  return (
    <div className="shell-dashboard-presets">
      <section className="shell-dashboard-presets-section">
        <h3 className="shell-dashboard-presets-heading">Layout</h3>
        <div className="shell-dashboard-presets-layout-grid">
          {LAYOUT_PRESETS.map((preset) => {
            const isSelected = activeLayoutPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`shell-dashboard-layout-preset${isSelected ? " active" : ""}`}
                aria-pressed={isSelected}
                onClick={() =>
                  applyLayoutPreset.mutate({
                    workspaceId: workspace.id,
                    presetId: preset.id,
                  })
                }
              >
                <span className="shell-dashboard-layout-preset-name">{preset.name}</span>
                <span className="shell-dashboard-layout-preset-copy">{preset.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="shell-dashboard-presets-section">
        <h3 className="shell-dashboard-presets-heading">Theme</h3>
        <div className={THEME_PRESET_GRID_CLASS}>
          {THEME_PRESETS.map((preset) => {
            const isSelected =
              (workspace.theme.appliedThemePresetId ?? workspace.theme.appliedPresetId) ===
              preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`${THEME_PRESET_CARD_CLASS}${isSelected ? " active" : ""}`}
                aria-pressed={isSelected}
                onClick={() =>
                  applyThemePreset.mutate({
                    workspaceId: workspace.id,
                    presetId: preset.id,
                  })
                }
              >
                <span
                  className="shell-config-preset-preview"
                  style={{
                    backgroundImage: preset.theme.backgroundUrl
                      ? `url(${preset.theme.backgroundUrl})`
                      : undefined,
                    backgroundColor: preset.theme.palette.background,
                  }}
                />
                <span className="shell-config-preset-name">{preset.name}</span>
                <span
                  className="shell-config-preset-accent"
                  style={{ backgroundColor: preset.theme.palette.accent }}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
