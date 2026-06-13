"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useStartPageLibrary } from "@/hooks/use-start-page-library";
import { applyTheme } from "@/theme/theme";
import { getStartPageShellContent } from "@/start/start-page-shell";
import { LoadingGate } from "@/components/branding/loading-gate";
import { StartPageCommandBar } from "./start-page-command-bar";

export function StartPageShell() {
  const content = getStartPageShellContent();
  const { phase, resolved } = useStartPageLibrary();

  const activeWorkspace = resolved?.library.workspaces.find(
    (workspace) => workspace.id === resolved.library.activeWorkspaceId,
  );

  useEffect(() => {
    if (!activeWorkspace) {
      return;
    }
    applyTheme(document.documentElement, activeWorkspace.theme);
  }, [activeWorkspace]);

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-[color:var(--qs-color-background)] bg-cover bg-center px-6"
      style={{
        backgroundImage: "var(--qs-background-image)",
      }}
    >
      {phase === "loading" ? <LoadingGate label={content.loadingLabel} /> : null}

      {resolved?.source === "starter" && phase === "ready" ? (
        <p className="max-w-md text-center text-xs opacity-70">
          {content.loadConfigPrompt}{" "}
          <Link href={content.homeStationHref} className="underline">
            {content.homeStationLinkLabel}
          </Link>
        </p>
      ) : null}

      <StartPageCommandBar
        library={resolved?.library ?? null}
        placeholder={content.commandBarPlaceholder}
      />

      <footer className="absolute bottom-6 text-xs opacity-50">
        <Link href={content.homeStationHref}>{content.homeStationLinkLabel}</Link>
      </footer>
    </main>
  );
}
