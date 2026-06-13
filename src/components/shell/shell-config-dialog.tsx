"use client";

import { useEffect } from "react";
import type { Library } from "@/library/types";
import { useConfigStore, type ConfigSection } from "@/store/config-store";
import { ShellConfigCanvasWidgets } from "./shell-config-canvas-widgets";
import { ShellConfigCatalog } from "./shell-config-catalog";
import { ShellConfigFocusRadio } from "./shell-config-focus-radio";
import { ShellConfigLibrary } from "./shell-config-library";
import { ShellConfigPlacements } from "./shell-config-placements";
import { ShellConfigShortcuts } from "./shell-config-shortcuts";
import { ShellConfigWorkspaces } from "./shell-config-workspaces";

type ShellConfigDialogProps = {
  library: Library;
  workspaceName: string;
};

const SECTIONS: { id: ConfigSection; label: string; description: string }[] = [
  { id: "links", label: "Links", description: "Add and edit catalog links" },
  { id: "edges", label: "Edges", description: "Edge groups and placements" },
  { id: "canvas", label: "Canvas", description: "Ambient canvas widgets" },
  { id: "workspaces", label: "Workspaces", description: "Workspaces and themes" },
  { id: "focusRadio", label: "Focus radio", description: "BYO media stations" },
  { id: "shortcuts", label: "Shortcuts", description: "Keyboard bindings" },
  { id: "library", label: "Library", description: "Reset and maintenance" },
];

function sectionContent(section: ConfigSection, library: Library) {
  switch (section) {
    case "links":
      return <ShellConfigCatalog library={library} />;
    case "edges":
      return <ShellConfigPlacements library={library} />;
    case "canvas":
      return <ShellConfigCanvasWidgets library={library} />;
    case "workspaces":
      return <ShellConfigWorkspaces library={library} />;
    case "focusRadio":
      return <ShellConfigFocusRadio library={library} />;
    case "shortcuts":
      return <ShellConfigShortcuts library={library} />;
    case "library":
      return <ShellConfigLibrary library={library} />;
  }
}

export function ShellConfigDialog({ library, workspaceName }: ShellConfigDialogProps) {
  const { open, section, openSection, close } = useConfigStore();
  const active = SECTIONS.find((entry) => entry.id === section) ?? SECTIONS[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Close settings"
        className="shell-overlay-scrim"
        onClick={close}
      />

      <div role="dialog" aria-modal="true" aria-label="Settings" className="shell-config-dialog">
        <header className="shell-config-dialog-header">
          <div>
            <p className="shell-config-dialog-eyebrow">{workspaceName}</p>
            <h2 className="shell-config-dialog-title">{active.label}</h2>
            <p className="shell-config-dialog-description">{active.description}</p>
          </div>
          <button type="button" className="shell-config-dialog-close" onClick={close}>
            Close
          </button>
        </header>

        <nav className="shell-config-dialog-nav" aria-label="Settings sections">
          {SECTIONS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`shell-config-dialog-nav-item${section === entry.id ? " active" : ""}`}
              onClick={() => openSection(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </nav>

        <div className="shell-config-dialog-body shell-config-dialog-body-scroll">
          {sectionContent(section, library)}
        </div>
      </div>
    </div>
  );
}
