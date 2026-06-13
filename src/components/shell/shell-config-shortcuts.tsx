"use client";

import { useApplyLibraryPatch } from "@/hooks/use-library";
import type { Library, ShortcutBindings } from "@/library/types";

type ShellConfigShortcutsProps = {
  library: Library;
};

const SHORTCUT_FIELDS: { key: keyof ShortcutBindings; label: string; hint: string }[] = [
  {
    key: "focusCommandBar",
    label: "Focus command bar",
    hint: "Example: Meta+Shift+k",
  },
  {
    key: "cycleWorkspace",
    label: "Cycle workspace",
    hint: "Example: Control+Tab",
  },
];

export function ShellConfigShortcuts({ library }: ShellConfigShortcutsProps) {
  const applyLibraryPatch = useApplyLibraryPatch();

  function handleShortcutChange(key: keyof ShortcutBindings, value: string) {
    applyLibraryPatch.mutate({
      shortcuts: { [key]: value.trim() },
    });
  }

  return (
    <div className="shell-config-dialog-section">
      <p className="shell-config-dialog-copy">
        Shortcuts only work while this Reshell tab is focused. With an empty command bar, Tab and
        Shift+Tab also cycle workspaces.
      </p>

      <div className="shell-config-form">
        {SHORTCUT_FIELDS.map((field) => (
          <label key={field.key} className="shell-config-color-field">
            <span className="shell-config-form-label">{field.label}</span>
            <input
              type="text"
              value={library.shortcuts[field.key]}
              onChange={(event) => handleShortcutChange(field.key, event.target.value)}
              placeholder={field.hint}
              className="shell-config-input"
              spellCheck={false}
            />
            <span className="shell-config-menu-item-hint">{field.hint}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
