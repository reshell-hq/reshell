"use client";

import { LibraryProvider, useLibrary } from "@/components/library/library-provider";

/**
 * Home station (`/home`) — the full shell pinned tab. The library now loads
 * from IndexedDB (seeding the starter template on first run) via the injected
 * store. The shell chrome (edge groups, command bar, control center, internal
 * tools) is built up across the rewrite slices, starting at issue 04; this
 * readout proves the persistence path end-to-end.
 */
function HomeReadout() {
  const { status, library, error } = useLibrary();

  if (status === "loading") {
    return <p className="text-muted-foreground">Loading library…</p>;
  }

  if (status === "error" || !library) {
    return (
      <p className="text-destructive">
        Could not load the library{error ? `: ${error.message}` : ""}.
      </p>
    );
  }

  const active = library.workspaces.find(
    (workspace) => workspace.id === library.activeWorkspaceId,
  );
  const groupCount = active?.placements.edges.left.length ?? 0;

  return (
    <div className="space-y-2">
      <p className="text-lg font-medium">
        Active workspace: {active?.name ?? "—"}
      </p>
      <p className="text-muted-foreground">
        {library.workspaces.length} workspaces · {library.catalog.length}{" "}
        catalog links · {groupCount} left-edge groups
      </p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Home station</h1>
      <LibraryProvider>
        <HomeReadout />
      </LibraryProvider>
    </main>
  );
}
