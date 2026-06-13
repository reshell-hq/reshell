"use client";

import { useState } from "react";
import { useImportLibrarySnapshot, useResetLibrary } from "@/hooks/use-library";
import type { Library } from "@/library/types";
import { serializeSnapshot } from "@/snapshot/snapshot";
import { SNAPSHOT_DOWNLOAD_FILENAME, SNAPSHOT_URL_PLACEHOLDER } from "@/branding/branding";
import { ShellConfigStartPage } from "./shell-config-start-page";

type ShellConfigLibraryProps = {
  library: Library;
};

export function ShellConfigLibrary({ library }: ShellConfigLibraryProps) {
  const resetLibrary = useResetLibrary();
  const importSnapshot = useImportLibrarySnapshot();
  const [importUrl, setImportUrl] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  function handleExport() {
    const yaml = serializeSnapshot(library);
    const blob = new Blob([yaml], { type: "text/yaml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = SNAPSHOT_DOWNLOAD_FILENAME;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  function handleImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = importUrl.trim();
    if (!url) {
      return;
    }

    const confirmed = window.confirm(
      "Importing a snapshot fully replaces your current library in this browser. Continue?",
    );
    if (!confirmed) {
      return;
    }

    setImportError(null);
    importSnapshot.mutate(url, {
      onSuccess: () => {
        setImportUrl("");
      },
      onError: (error) => {
        setImportError(error instanceof Error ? error.message : "Import failed");
      },
    });
  }

  function handleReset() {
    const confirmed = window.confirm(
      "Reset the library to the starter template? This wipes your local library and cannot be undone without a snapshot backup.",
    );
    if (!confirmed) {
      return;
    }

    resetLibrary.mutate();
  }

  return (
    <div className="shell-config-dialog-section">
      <ShellConfigStartPage />

      <section className="shell-config-section">
        <p className="shell-config-form-label">Library snapshot</p>
        <p className="shell-config-dialog-copy">
          Export your full library as versioned YAML for git-backed backups. Importing from a URL
          fully replaces the current library on success.
        </p>
        <div className="shell-config-form-actions shell-config-form-actions-start">
          <button type="button" className="shell-config-submit" onClick={handleExport}>
            Download snapshot
          </button>
        </div>

        <form className="shell-config-form" onSubmit={handleImport}>
          <input
            type="url"
            value={importUrl}
            onChange={(event) => setImportUrl(event.target.value)}
            placeholder={SNAPSHOT_URL_PLACEHOLDER}
            className="shell-config-input"
          />
          <button
            type="submit"
            className="shell-config-submit"
            disabled={!importUrl.trim() || importSnapshot.isPending}
          >
            Import from URL
          </button>
          {importError ? (
            <p className="shell-config-error" role="alert">
              {importError}
            </p>
          ) : null}
        </form>
      </section>

      <section className="shell-config-section">
        <p className="shell-config-form-label">Starter template</p>
        <p className="shell-config-dialog-copy">
          Restore the opinionated starter template. Your current library is replaced with fresh Work
          and Personal workspaces, sample links, and default placements.
        </p>
        <button type="button" className="shell-config-reset" onClick={handleReset}>
          Reset to starter template
        </button>
      </section>
    </div>
  );
}
