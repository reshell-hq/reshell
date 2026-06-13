"use client";

import { useConfigStore } from "@/store/config-store";
import { getShellLayout } from "@/shell-frame/layout";
import { SETTINGS_BUTTON_CLASS } from "./settings-button-layout";

export function ShellSettingsButton() {
  const openSettings = useConfigStore((state) => state.openSettings);
  const layout = getShellLayout();

  return (
    <button
      type="button"
      className={`shell-icon-btn shell-icon-btn-ghost ${SETTINGS_BUTTON_CLASS}`}
      style={{
        left: layout.w - layout.frameRight * 0.5,
        top: layout.frameTop + layout.sidePadding * 0.35,
      }}
      aria-label="Settings"
      onClick={() => openSettings()}
    >
      <span className="shell-icon-glyph" aria-hidden>
        ⚙
      </span>
    </button>
  );
}
