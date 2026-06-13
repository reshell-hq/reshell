"use client";

import type { Theme, ThemePatch } from "@/library/types";

type ShellConfigShellSurfaceProps = {
  theme: Theme;
  onPatch: (patch: ThemePatch) => void;
};

export function ShellConfigShellSurface({ theme, onPatch }: ShellConfigShellSurfaceProps) {
  const borderColor = theme.shellBorderColor ?? theme.palette.text;

  return (
    <label className="shell-config-color-field">
      <span className="shell-config-form-label">Shell border</span>
      <div className="shell-config-color-input">
        <input
          type="color"
          value={borderColor}
          onChange={(event) => onPatch({ shellBorderColor: event.target.value })}
          aria-label="Shell border color"
        />
        <input
          type="text"
          value={borderColor}
          onChange={(event) => onPatch({ shellBorderColor: event.target.value })}
          className="shell-config-input"
        />
      </div>
    </label>
  );
}
