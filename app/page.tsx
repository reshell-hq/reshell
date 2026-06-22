"use client";

import { Shell } from "@/components/shell";
import { CommandCenterSlot, WorkspaceEdges } from "@/components/personal";
import { ReshellProvider, useReshellState } from "@/hooks/use-reshell-state";
import reshellConfig from "@/reshell.config";

/**
 * Composition root only (ADR-0009): wires the config into the provider and
 * mounts the shell. All real state reads go through useReshellState.
 */
export default function Home() {
  return (
    <ReshellProvider config={reshellConfig}>
      <HomeStation />
    </ReshellProvider>
  );
}

function HomeStation() {
  const { config, activeWorkspace } = useReshellState();

  return (
    <Shell
      theme={{
        shellColor: "var(--muted)",
        canvasColor: "var(--background)",
      }}
    >
      <CommandCenterSlot />
      <WorkspaceEdges />
      <Shell.Content>
        <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          {config.displayName ? (
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Welcome back, {config.displayName}
            </p>
          ) : null}
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            {activeWorkspace.name}
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Your reshell station is booting from{" "}
            <code className="font-mono">reshell.config.ts</code>. Workspaces,
            bookmarks, and tools arrive in the next plans.
          </p>
        </main>
      </Shell.Content>
    </Shell>
  );
}
