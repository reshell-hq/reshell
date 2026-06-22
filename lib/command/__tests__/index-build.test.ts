import { describe, expect, it } from "vitest";
import { buildCommandIndex } from "../index-build";
import type { ReshellConfig, WorkspaceConfig } from "@/lib/config";

const work: WorkspaceConfig = {
  id: "work",
  name: "Work",
  scene: "default",
  widgets: {},
  bookmarks: {
    left: [
      {
        name: "Dev",
        links: [
          { url: "https://github.com", title: "GitHub" },
          { url: "https://news.ycombinator.com" },
        ],
      },
    ],
  },
};

const home: WorkspaceConfig = {
  id: "home",
  name: "Home",
  scene: "editorial",
  widgets: {},
};

const config: ReshellConfig = {
  defaultWorkspaceId: "work",
  workspaces: [work, home],
};

function build() {
  return buildCommandIndex({
    config,
    activeWorkspace: work,
    activeWorkspaceId: "work",
  });
}

describe("buildCommandIndex", () => {
  it("emits a switch entry for every workspace", () => {
    const switches = build().filter((e) => e.kind === "switch");
    expect(switches.map((e) => e.run)).toEqual([
      { type: "switch", workspaceId: "work" },
      { type: "switch", workspaceId: "home" },
    ]);
  });

  it("emits an open entry per bookmark of the active workspace", () => {
    const opens = build().filter((e) => e.kind === "open");
    expect(opens.map((e) => e.run)).toEqual([
      { type: "open", url: "https://github.com" },
      { type: "open", url: "https://news.ycombinator.com" },
    ]);
  });

  it("labels bookmarks via the shared display-title rules", () => {
    const opens = build().filter((e) => e.kind === "open");
    // Explicit title, then hostname fallback (sans `www.`).
    expect(opens[0].label).toBe("Open GitHub");
    expect(opens[1].label).toBe("Open news.ycombinator.com");
  });

  it("includes a scene verb for every built-in scene", () => {
    const scenes = build().filter((e) => e.kind === "scene");
    expect(scenes.map((e) => e.run)).toEqual([
      { type: "scene", scene: "default" },
      { type: "scene", scene: "editorial" },
      { type: "scene", scene: "meridian" },
      { type: "scene", scene: "atelier" },
      { type: "scene", scene: "nocturne" },
      { type: "scene", scene: "terminal" },
      { type: "scene", scene: "aurora" },
    ]);
  });

  it("includes the reset verb bound to the active workspace", () => {
    const reset = build().find((e) => e.kind === "reset");
    expect(reset?.run).toEqual({ type: "reset", workspaceId: "work" });
  });

  it("declares the not-yet-implemented tool verbs as stubs", () => {
    const kinds = new Set(build().map((e) => e.kind));
    expect(kinds.has("timer")).toBe(true);
    expect(kinds.has("task")).toBe(true);
    expect(kinds.has("music")).toBe(true);
  });

  it("tags nav vs verb mode so the bar can filter by parsed mode", () => {
    const index = build();
    expect(index.every((e) => e.mode === "nav" || e.mode === "verb")).toBe(true);
    const navKinds = new Set(
      index.filter((e) => e.mode === "nav").map((e) => e.kind),
    );
    expect(navKinds).toEqual(new Set(["switch", "open"]));
  });

  it("emits a focus verb for each open task and skips completed ones", () => {
    const index = buildCommandIndex({
      config,
      activeWorkspace: work,
      activeWorkspaceId: "work",
      tasks: [
        { id: "t1", title: "Ship", today: true, completed: false, order: 0 },
        { id: "t2", title: "Done", today: true, completed: true, order: 1 },
      ],
    });
    const focus = index.filter(
      (e) => e.kind === "task" && e.run.type === "task" && e.run.action === "focus",
    );
    expect(focus.map((e) => e.run)).toEqual([
      { type: "task", action: "focus", taskId: "t1" },
    ]);
    expect(focus[0].label).toBe("Focus on Ship");
  });

  it("yields no bookmark entries when the active workspace has none", () => {
    const opens = buildCommandIndex({
      config,
      activeWorkspace: home,
      activeWorkspaceId: "home",
    }).filter((e) => e.kind === "open");
    expect(opens).toEqual([]);
  });
});
