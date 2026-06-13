"use client";

import { useEffect, useState } from "react";
import {
  useApplyLibraryPatch,
  useApplyThemePreset,
  useCreateWorkspace,
  useDeleteWorkspace,
  useMutateLibrary,
  useRenameWorkspace,
  useUpdateWorkspaceTheme,
} from "@/hooks/use-library";
import { THEME_PRESETS } from "@/theme/theme-presets";
import {
  THEME_PRESET_CARD_CLASS,
  THEME_PRESET_GRID_CLASS,
} from "@/theme/theme-preset-picker-layout";
import { updateWorkspaceIcsFeedUrl } from "@/calendar/workspace-ics";
import type { Library, ThemePalette } from "@/library/types";
import { resetShellThemeToPreset } from "@/theme/theme-preset-reset";
import { ShellConfigShellSurface } from "./shell-config-shell-surface";
import { ShellConfigThemeWidgets } from "./shell-config-theme-widgets";

type ShellConfigWorkspacesProps = {
  library: Library;
};

const PALETTE_FIELDS: { key: keyof ThemePalette; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
  { key: "accent", label: "Accent" },
];

export function ShellConfigWorkspaces({ library }: ShellConfigWorkspacesProps) {
  const applyLibraryPatch = useApplyLibraryPatch();
  const createWorkspace = useCreateWorkspace();
  const renameWorkspace = useRenameWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const updateWorkspaceTheme = useUpdateWorkspaceTheme();
  const applyThemePreset = useApplyThemePreset();
  const mutateLibrary = useMutateLibrary();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(library.activeWorkspaceId);
  const [workspaceName, setWorkspaceName] = useState("");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [backgroundUrlDraft, setBackgroundUrlDraft] = useState("");
  const [icsFeedUrlDraft, setIcsFeedUrlDraft] = useState("");

  const selectedWorkspace =
    library.workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ??
    library.workspaces[0];
  const isActive = selectedWorkspace?.id === library.activeWorkspaceId;
  const canDelete = library.workspaces.length > 1;

  useEffect(() => {
    if (!library.workspaces.some((workspace) => workspace.id === selectedWorkspaceId)) {
      setSelectedWorkspaceId(library.activeWorkspaceId);
    }
  }, [library.activeWorkspaceId, library.workspaces, selectedWorkspaceId]);

  useEffect(() => {
    setWorkspaceName(selectedWorkspace?.name ?? "");
  }, [selectedWorkspace?.id, selectedWorkspace?.name]);

  useEffect(() => {
    setBackgroundUrlDraft(selectedWorkspace?.theme.backgroundUrl ?? "");
  }, [selectedWorkspace?.id, selectedWorkspace?.theme.backgroundUrl]);

  useEffect(() => {
    setIcsFeedUrlDraft(selectedWorkspace?.icsFeedUrl ?? "");
  }, [selectedWorkspace?.id, selectedWorkspace?.icsFeedUrl]);

  useEffect(() => {
    if (!selectedWorkspace) {
      return;
    }

    const workspaceId = selectedWorkspace.id;
    const current = selectedWorkspace.theme.backgroundUrl ?? "";

    const timer = window.setTimeout(() => {
      const trimmed = backgroundUrlDraft.trim();
      if (trimmed === current) {
        return;
      }

      updateWorkspaceTheme.mutate({
        workspaceId,
        patch: { backgroundUrl: trimmed || null },
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [
    backgroundUrlDraft,
    selectedWorkspace?.id,
    selectedWorkspace?.theme.backgroundUrl,
    updateWorkspaceTheme,
  ]);

  useEffect(() => {
    if (!selectedWorkspace) {
      return;
    }

    const workspaceId = selectedWorkspace.id;
    const current = selectedWorkspace.icsFeedUrl ?? "";

    const timer = window.setTimeout(() => {
      const trimmed = icsFeedUrlDraft.trim();
      if (trimmed === current.trim()) {
        return;
      }

      mutateLibrary.mutate((library) =>
        updateWorkspaceIcsFeedUrl(library, workspaceId, trimmed || null),
      );
    }, 400);

    return () => window.clearTimeout(timer);
  }, [icsFeedUrlDraft, mutateLibrary, selectedWorkspace?.id, selectedWorkspace?.icsFeedUrl]);

  function handleCreateWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newWorkspaceName.trim();
    if (!name) {
      return;
    }

    createWorkspace.mutate(name, {
      onSuccess: (updated) => {
        const created = updated.workspaces.find((workspace) => workspace.name === name);
        if (created) {
          setSelectedWorkspaceId(created.id);
        }
        setNewWorkspaceName("");
      },
    });
  }

  function handleRenameWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWorkspace) {
      return;
    }
    const name = workspaceName.trim();
    if (!name) {
      return;
    }

    renameWorkspace.mutate({ workspaceId: selectedWorkspace.id, name });
  }

  function handleDeleteWorkspace() {
    if (!selectedWorkspace || !canDelete) {
      return;
    }
    const confirmed = window.confirm(`Delete workspace "${selectedWorkspace.name}"?`);
    if (!confirmed) {
      return;
    }

    deleteWorkspace.mutate(selectedWorkspace.id);
  }

  function patchTheme(patch: Parameters<typeof updateWorkspaceTheme.mutate>[0]["patch"]) {
    if (!selectedWorkspace) {
      return;
    }

    updateWorkspaceTheme.mutate({ workspaceId: selectedWorkspace.id, patch });
  }

  function handlePaletteChange(key: keyof ThemePalette, value: string) {
    patchTheme({ palette: { [key]: value } });
  }

  if (!selectedWorkspace) {
    return null;
  }

  return (
    <div className="shell-config-dialog-section shell-config-dialog-section-fill">
      <div className="shell-config-split">
        <div className="shell-config-split-pane">
          <p className="shell-config-form-label">Workspaces</p>
          <ul className="shell-config-catalog">
            {library.workspaces.map((workspace) => (
              <li
                key={workspace.id}
                className={`shell-config-catalog-item${
                  selectedWorkspace.id === workspace.id ? " active" : ""
                }`}
              >
                <button
                  type="button"
                  className="shell-config-workspace-select"
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                >
                  <span className="shell-config-catalog-title">{workspace.name}</span>
                  {workspace.id === library.activeWorkspaceId ? (
                    <span className="shell-config-workspace-badge">Active</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>

          <form className="shell-config-form" onSubmit={handleCreateWorkspace}>
            <p className="shell-config-form-label">New workspace</p>
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(event) => setNewWorkspaceName(event.target.value)}
              placeholder="Workspace name"
              className="shell-config-input"
            />
            <button
              type="submit"
              className="shell-config-submit"
              disabled={!newWorkspaceName.trim()}
            >
              Create workspace
            </button>
          </form>
        </div>

        <div className="shell-config-split-pane shell-config-form-pane">
          <form className="shell-config-form" onSubmit={handleRenameWorkspace}>
            <p className="shell-config-form-label">Workspace details</p>
            <input
              type="text"
              required
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Workspace name"
              className="shell-config-input"
            />
            <div className="shell-config-form-actions shell-config-form-actions-start">
              <button type="submit" className="shell-config-submit">
                Save name
              </button>
              {!isActive ? (
                <button
                  type="button"
                  className="shell-config-action"
                  onClick={() =>
                    applyLibraryPatch.mutate({ activeWorkspaceId: selectedWorkspace.id })
                  }
                >
                  Switch to this workspace
                </button>
              ) : null}
              <button
                type="button"
                className="shell-config-action shell-config-action-danger"
                disabled={!canDelete}
                onClick={handleDeleteWorkspace}
              >
                Delete
              </button>
            </div>
          </form>

          <div className="shell-config-form">
            <p className="shell-config-form-label">
              Theme {isActive ? "(live on shell)" : "(saved for this workspace)"}
            </p>

            <div className={THEME_PRESET_GRID_CLASS}>
              {THEME_PRESETS.map((preset) => {
                const isSelected =
                  (selectedWorkspace.theme.appliedThemePresetId ??
                    selectedWorkspace.theme.appliedPresetId) === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`${THEME_PRESET_CARD_CLASS}${isSelected ? " active" : ""}`}
                    aria-pressed={isSelected}
                    onClick={() =>
                      applyThemePreset.mutate({
                        workspaceId: selectedWorkspace.id,
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

            <div className="shell-config-theme-grid">
              {PALETTE_FIELDS.map((field) => (
                <label key={field.key} className="shell-config-color-field">
                  <span className="shell-config-form-label">{field.label}</span>
                  <div className="shell-config-color-input">
                    <input
                      type="color"
                      value={selectedWorkspace.theme.palette[field.key]}
                      onChange={(event) => handlePaletteChange(field.key, event.target.value)}
                      aria-label={`${field.label} color`}
                    />
                    <input
                      type="text"
                      value={selectedWorkspace.theme.palette[field.key]}
                      onChange={(event) => handlePaletteChange(field.key, event.target.value)}
                      className="shell-config-input"
                    />
                  </div>
                </label>
              ))}
            </div>

            <ShellConfigShellSurface theme={selectedWorkspace.theme} onPatch={patchTheme} />

            <label className="shell-config-color-field">
              <span className="shell-config-form-label">Background image URL</span>
              <input
                type="url"
                value={backgroundUrlDraft}
                onChange={(event) => setBackgroundUrlDraft(event.target.value)}
                placeholder="https://…"
                className="shell-config-input"
              />
            </label>

            <label className="shell-config-color-field">
              <span className="shell-config-form-label">
                Border radius{" "}
                <span className="tabular-nums">{selectedWorkspace.theme.borderRadius}px</span>
              </span>
              <input
                type="range"
                min={0}
                max={40}
                step={1}
                value={selectedWorkspace.theme.borderRadius}
                onChange={(event) => patchTheme({ borderRadius: Number(event.target.value) })}
                className="shell-config-range"
              />
            </label>

            {selectedWorkspace.theme.appliedPresetId ? (
              <div className="shell-config-form-actions shell-config-form-actions-start">
                <button
                  type="button"
                  className="shell-config-action"
                  onClick={() => {
                    const resetPatch = resetShellThemeToPreset(selectedWorkspace);
                    if (resetPatch) {
                      patchTheme(resetPatch);
                    }
                  }}
                >
                  Reset shell to preset
                </button>
              </div>
            ) : null}
          </div>

          <ShellConfigThemeWidgets workspace={selectedWorkspace} onPatch={patchTheme} />

          <div className="shell-config-form">
            <p className="shell-config-form-label">Calendar</p>
            <label className="shell-config-color-field">
              <span className="shell-config-form-label">ICS feed URL</span>
              <input
                type="url"
                value={icsFeedUrlDraft}
                onChange={(event) => setIcsFeedUrlDraft(event.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
                className="shell-config-input"
              />
              <span className="shell-config-menu-item-hint">
                Google Calendar: Settings → your calendar → Integrate calendar → Secret address in
                iCal format.
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
