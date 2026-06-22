import { describe, expect, it } from "vitest";
import { nextWorkspaceId } from "../cycle";
import type { ReshellConfig, WorkspaceConfig } from "@/lib/config";

function workspace(id: string): WorkspaceConfig {
  return { id, name: id, scene: "default", widgets: {} };
}

function config(...ids: string[]): ReshellConfig {
  return { defaultWorkspaceId: ids[0], workspaces: ids.map(workspace) };
}

describe("nextWorkspaceId", () => {
  const three = config("work", "personal", "play");

  it("moves forward in config order", () => {
    expect(nextWorkspaceId(three, "work", "next")).toBe("personal");
    expect(nextWorkspaceId(three, "personal", "next")).toBe("play");
  });

  it("moves backward in config order", () => {
    expect(nextWorkspaceId(three, "play", "prev")).toBe("personal");
    expect(nextWorkspaceId(three, "personal", "prev")).toBe("work");
  });

  it("wraps forward past the last workspace", () => {
    expect(nextWorkspaceId(three, "play", "next")).toBe("work");
  });

  it("wraps backward past the first workspace", () => {
    expect(nextWorkspaceId(three, "work", "prev")).toBe("play");
  });

  it("returns the only workspace when there is a single one", () => {
    const single = config("solo");
    expect(nextWorkspaceId(single, "solo", "next")).toBe("solo");
    expect(nextWorkspaceId(single, "solo", "prev")).toBe("solo");
  });

  it("falls back to the first workspace for an unknown current id", () => {
    expect(nextWorkspaceId(three, "ghost", "next")).toBe("work");
    expect(nextWorkspaceId(three, "ghost", "prev")).toBe("work");
  });
});
