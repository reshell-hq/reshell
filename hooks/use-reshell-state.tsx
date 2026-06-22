"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { validateConfig, type ReshellConfig, type WorkspaceConfig } from "@/lib/config";
import type { MusicPlayback } from "@/lib/music";
import {
  getOverrideServerSnapshot,
  getOverrideSnapshot,
  subscribeOverride,
  writeOverride,
  type OverrideState,
  type WorkspaceOverride,
} from "@/lib/override";
import {
  effectiveWorkspace,
  resetWorkspaceOverride,
  resolveActiveWorkspaceId,
} from "@/lib/state";

/**
 * The single seam later plans build on: read everything via useReshellState(),
 * write only to the override (never back to config). App-decoupled — config is
 * injected as a prop and persistence lives behind the override store (ADR-0009),
 * so a paid tier can supply its own config + backend store.
 */
export type ReshellState = {
  config: ReshellConfig;
  /** The active workspace with its override merged in (effective view). */
  activeWorkspace: WorkspaceConfig;
  activeWorkspaceId: string;
  setActiveWorkspace: (workspaceId: string) => void;
  patchOverride: (workspaceId: string, patch: Partial<WorkspaceOverride>) => void;
  resetWorkspace: (workspaceId: string) => void;
  /**
   * The global music override slice (plan 013), or undefined until first
   * touched. NOT keyed by workspace — `useMusic` reads this through the
   * provider and layers config-derived defaults over it.
   */
  music?: MusicPlayback;
  /** Write the global music slice (the only writer is `useMusic`). */
  setMusic: (next: MusicPlayback) => void;
};

const ReshellContext = createContext<ReshellState | null>(null);

export function ReshellProvider({
  config: rawConfig,
  children,
}: {
  /** Raw config (e.g. imported reshell.config.ts); validated here once. */
  config: unknown;
  children: ReactNode;
}) {
  const parsed = useMemo(() => {
    try {
      return { config: validateConfig(rawConfig), error: null as string | null };
    } catch (error) {
      return {
        config: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [rawConfig]);

  // Read the override via useSyncExternalStore: the server snapshot is empty
  // (matching SSR), so hydration never mismatches, and writes are discrete (one
  // per user action) — never on the shell's ref-driven animation path (ADR-0006).
  const override = useSyncExternalStore(
    subscribeOverride,
    getOverrideSnapshot,
    getOverrideServerSnapshot,
  );

  // Mutations write through the store (the sole localStorage owner), which
  // notifies subscribers and re-renders. Always derive from the latest snapshot.
  const setActiveWorkspace = useCallback((workspaceId: string) => {
    writeOverride({ ...getOverrideSnapshot(), activeWorkspaceId: workspaceId });
  }, []);

  const patchOverride = useCallback(
    (workspaceId: string, patch: Partial<WorkspaceOverride>) => {
      const prev = getOverrideSnapshot();
      const next: OverrideState = {
        ...prev,
        workspaces: {
          ...prev.workspaces,
          [workspaceId]: { ...prev.workspaces[workspaceId], ...patch },
        },
      };
      writeOverride(next);
    },
    [],
  );

  const resetWorkspace = useCallback((workspaceId: string) => {
    writeOverride(resetWorkspaceOverride(getOverrideSnapshot(), workspaceId));
  }, []);

  // Global (not per-workspace) music slice. A discrete write off the animation
  // path (ADR-0006), through the override store (the sole localStorage owner).
  const setMusic = useCallback((next: MusicPlayback) => {
    writeOverride({ ...getOverrideSnapshot(), music: next });
  }, []);

  const config = parsed.config;
  const activeWorkspaceId = config
    ? resolveActiveWorkspaceId(config, override)
    : "";
  const activeWorkspace = useMemo(() => {
    if (!config) {
      return null;
    }
    const workspace = config.workspaces.find((w) => w.id === activeWorkspaceId);
    // resolveActiveWorkspaceId only returns ids present in config.
    return workspace ? effectiveWorkspace(workspace, override.workspaces[activeWorkspaceId]) : null;
  }, [config, activeWorkspaceId, override]);

  if (parsed.error || !config || !activeWorkspace) {
    return <ConfigError message={parsed.error ?? "Config failed to load."} />;
  }

  const value: ReshellState = {
    config,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspace,
    patchOverride,
    resetWorkspace,
    music: override.music,
    setMusic,
  };

  return <ReshellContext.Provider value={value}>{children}</ReshellContext.Provider>;
}

export function useReshellState(): ReshellState {
  const state = useContext(ReshellContext);
  if (!state) {
    throw new Error("useReshellState must be used within a <ReshellProvider>.");
  }
  return state;
}

/** Full-screen, accessible error surface — a bad config explains itself. */
function ConfigError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-8 text-foreground"
    >
      <div className="w-full max-w-xl space-y-3">
        <h1 className="text-xl font-semibold tracking-tight text-destructive">
          reshell config is invalid
        </h1>
        <p className="text-sm text-muted-foreground">
          Fix <code className="font-mono">reshell.config.ts</code> and reload. The
          validator reported:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-sm whitespace-pre-wrap">
          {message}
        </pre>
      </div>
    </div>
  );
}
