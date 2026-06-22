import { describe, expect, it } from "vitest";
import type { ReshellConfig, WorkspaceConfig } from "@/lib/config";
import type { OverrideState } from "@/lib/override";
import {
  effectiveWorkspace,
  resetWorkspaceOverride,
  resolveActiveWorkspaceId,
} from "../effective";

const workspace: WorkspaceConfig = {
  id: "work",
  name: "Work",
  scene: "default",
  widgets: { clock: true, quote: false },
};

const config: ReshellConfig = {
  defaultWorkspaceId: "work",
  workspaces: [workspace, { id: "home", name: "Home", scene: "editorial", widgets: {} }],
};

describe("effectiveWorkspace", () => {
  it("returns the config workspace unchanged when there is no override", () => {
    expect(effectiveWorkspace(workspace)).toEqual(workspace);
  });

  it("lets the override scene win over config", () => {
    expect(effectiveWorkspace(workspace, { scene: "meridian" }).scene).toBe(
      "meridian",
    );
  });

  it("falls back to the config scene when the override omits it", () => {
    expect(effectiveWorkspace(workspace, { widgets: { quote: true } }).scene).toBe(
      "default",
    );
  });

  it("merges widget toggles per-key, override winning", () => {
    const merged = effectiveWorkspace(workspace, { widgets: { quote: true } });
    expect(merged.widgets).toEqual({ clock: true, quote: true });
  });

  it("does not mutate the input config workspace", () => {
    effectiveWorkspace(workspace, { scene: "atelier", widgets: { clock: false } });
    expect(workspace.scene).toBe("default");
    expect(workspace.widgets.clock).toBe(true);
  });
});

describe("resolveActiveWorkspaceId", () => {
  it("uses the override's active id when it exists in config", () => {
    const override: OverrideState = { activeWorkspaceId: "home", workspaces: {} };
    expect(resolveActiveWorkspaceId(config, override)).toBe("home");
  });

  it("falls back to the default when no active id is set", () => {
    expect(resolveActiveWorkspaceId(config, { workspaces: {} })).toBe("work");
  });

  it("ignores an orphaned active id and falls back to the default", () => {
    const override: OverrideState = { activeWorkspaceId: "ghost", workspaces: {} };
    expect(resolveActiveWorkspaceId(config, override)).toBe("work");
  });
});

describe("resetWorkspaceOverride", () => {
  it("removes the workspace's override entry", () => {
    const state: OverrideState = {
      workspaces: { work: { scene: "atelier" }, home: { scene: "meridian" } },
    };
    const next = resetWorkspaceOverride(state, "work");
    expect(next.workspaces).toEqual({ home: { scene: "meridian" } });
    expect(state.workspaces.work).toBeDefined();
  });

  it("returns the same state when there is nothing to reset", () => {
    const state: OverrideState = { workspaces: {} };
    expect(resetWorkspaceOverride(state, "work")).toBe(state);
  });
});
