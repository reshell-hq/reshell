import type { ReshellConfig, WorkspaceConfig } from "@/lib/config";
import type { OverrideState, WorkspaceOverride } from "@/lib/override";

/**
 * Pure merge of the read-only config with the mutable override (ADR-0007):
 * override fields win where present, config wins otherwise. Zero React/DOM deps.
 * Orphaned overrides (no matching config workspace) are simply never read here,
 * so they are ignored rather than resurrecting dead workspaces.
 */

export function effectiveWorkspace(
  workspace: WorkspaceConfig,
  override?: WorkspaceOverride,
): WorkspaceConfig {
  if (!override) {
    return workspace;
  }
  return {
    ...workspace,
    scene: override.scene ?? workspace.scene,
    // ponytail: shallow per-widget merge. Override toggles win, others fall
    // through from config. Widgets are a flat map, so no recursive deep-merge is
    // needed; upgrade path is a deep-merge helper if a nested override field ever
    // appears.
    widgets: { ...workspace.widgets, ...override.widgets },
  };
}

/**
 * The active workspace id: the override's choice if it still exists in config,
 * else the config default (an orphaned id falls back instead of breaking).
 */
export function resolveActiveWorkspaceId(
  config: ReshellConfig,
  override: OverrideState,
): string {
  const wanted = override.activeWorkspaceId;
  if (wanted && config.workspaces.some((w) => w.id === wanted)) {
    return wanted;
  }
  return config.defaultWorkspaceId;
}

/** Clear one workspace's override so its effective state falls back to config. */
export function resetWorkspaceOverride(
  state: OverrideState,
  workspaceId: string,
): OverrideState {
  if (!(workspaceId in state.workspaces)) {
    return state;
  }
  const workspaces = { ...state.workspaces };
  delete workspaces[workspaceId];
  return { ...state, workspaces };
}
