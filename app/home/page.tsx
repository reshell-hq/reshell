"use client";

import { Shell } from "@/components/shell";
import { LeftEdgeGroups } from "@/components/edge-group/left-edge-groups";
import {
  LibraryProvider,
  useLibrary,
} from "@/components/library/library-provider";
import {
  canvasBackgroundStyle,
  themeToShellInput,
} from "@/lib/theme/shell-theme";

/**
 * Home station (`/home`) — the full shell pinned tab (CONTEXT: "Home station").
 * Reads the library from the injected store (issue 03), themes the shell by the
 * active workspace (issue 02), and surfaces each left-rim edge group as a
 * composed `Shell.Slot`: hover/pin a handle to open its edge flyout; links open
 * in new tabs. The command bar, control center, and internal tools land in
 * later slices.
 */
function HomeShell() {
  const { status, library, error } = useLibrary();

  if (status === "loading") {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">Loading library…</p>
      </main>
    );
  }

  if (status === "error" || !library) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-destructive">
          Could not load the library{error ? `: ${error.message}` : ""}.
        </p>
      </main>
    );
  }

  const active = library.workspaces.find(
    (workspace) => workspace.id === library.activeWorkspaceId,
  );

  if (!active) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-destructive">No active workspace.</p>
      </main>
    );
  }

  return (
    <Shell theme={themeToShellInput(active.theme)}>
      <LeftEdgeGroups library={library} />

      <Shell.Content>
        <main
          className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center"
          style={{
            ...canvasBackgroundStyle(active.theme),
            color: active.theme.palette.text,
          }}
        >
          <h1 className="text-3xl font-semibold tracking-tight">
            {library.displayName
              ? `Welcome back, ${library.displayName}`
              : "Home station"}
          </h1>
          <p className="max-w-md opacity-70">
            {active.name} workspace. Hover a handle on the left rim to open an
            edge group; links open in a new tab.
          </p>
        </main>
      </Shell.Content>
    </Shell>
  );
}

export default function HomePage() {
  return (
    <LibraryProvider>
      <HomeShell />
    </LibraryProvider>
  );
}
