import { describe, expect, it } from "vitest";
import { validateConfig } from "../validate";
import type { ReshellConfig } from "../types";

const validConfig = {
  displayName: "Test",
  defaultWorkspaceId: "work",
  workspaces: [
    { id: "work", name: "Work", scene: "default", widgets: { clock: true } },
    { id: "home", name: "Home", scene: "editorial", widgets: {} },
  ],
} satisfies ReshellConfig;

describe("validateConfig", () => {
  it("parses a valid config and returns the typed value", () => {
    const config = validateConfig(validConfig);
    expect(config.defaultWorkspaceId).toBe("work");
    expect(config.workspaces).toHaveLength(2);
    expect(config.workspaces[0].widgets.clock).toBe(true);
  });

  it("throws a readable error when defaultWorkspaceId matches no workspace", () => {
    expect(() =>
      validateConfig({ ...validConfig, defaultWorkspaceId: "missing" }),
    ).toThrow(/defaultWorkspaceId/);
  });

  it("throws when workspace ids are not unique", () => {
    expect(() =>
      validateConfig({
        defaultWorkspaceId: "work",
        workspaces: [
          { id: "work", name: "Work", scene: "default", widgets: {} },
          { id: "work", name: "Duplicate", scene: "default", widgets: {} },
        ],
      }),
    ).toThrow(/Duplicate workspace id/);
  });

  it("rejects an unknown scene name with the offending path", () => {
    expect(() =>
      validateConfig({
        defaultWorkspaceId: "work",
        workspaces: [
          { id: "work", name: "Work", scene: "nope", widgets: {} },
        ],
      }),
    ).toThrow(/scene/);
  });

  it("rejects a config with no workspaces", () => {
    expect(() =>
      validateConfig({ defaultWorkspaceId: "work", workspaces: [] }),
    ).toThrow();
  });

  it("rejects non-object input", () => {
    expect(() => validateConfig(null)).toThrow(/Invalid reshell config/);
  });
});
