import { afterEach, describe, expect, it, vi } from "vitest";
import { parse, stringify } from "yaml";
import { initialKey, sortByKey } from "@/fractional-order/fractional-order";
import { loadOrSeedLibrary } from "@/library/library";
import type { Library } from "@/library/types";
import { createInMemoryLibraryStore } from "@/library/store";
import {
  deserializeSnapshot,
  importSnapshotFromUrl,
  libraryToMachineSnapshot,
  libraryToSnapshot,
  serializeSnapshot,
} from "./snapshot";
import { resolveTheme } from "@/theme/theme-defaults";

function bookmarkLinksForWorkspace(library: Library, workspaceName: string) {
  const workspace = library.workspaces.find((entry) => entry.name === workspaceName)!;
  const groups = sortByKey(workspace.placements.edges.left, (group) => group.orderKey);

  return groups.map((group) => ({
    name: group.name,
    icon: group.handleIcon,
    links: sortByKey(group.links, (placement) => placement.orderKey).map((placement) => {
      const link = library.catalog.find((entry) => entry.id === placement.linkId)!;
      return {
        url: link.url,
        ...(link.title !== undefined ? { title: link.title } : {}),
        ...(link.image !== undefined ? { image: link.image } : {}),
      };
    }),
  }));
}

function expectSnapshotRoundTrip(library: Library, restored: Library) {
  expect(restored.shortcuts).toEqual(library.shortcuts);
  expect(restored.focusRadio).toEqual(library.focusRadio);
  expect(restored.activeWorkspaceId).toEqual(library.activeWorkspaceId);
  expect(restored.displayName).toEqual(library.displayName);
  expect(restored.workspaces.map((workspace) => workspace.name)).toEqual(
    library.workspaces.map((workspace) => workspace.name),
  );

  for (const workspace of library.workspaces) {
    const restoredWorkspace = restored.workspaces.find((entry) => entry.id === workspace.id);
    expect(restoredWorkspace).toBeDefined();
    expect(restoredWorkspace!.theme).toEqual(workspace.theme);
    expect(restoredWorkspace!.internalTools).toEqual(workspace.internalTools);
    expect(restoredWorkspace!.canvasWidgets).toEqual(workspace.canvasWidgets);
    expect(bookmarkLinksForWorkspace(restored, workspace.name)).toEqual(
      bookmarkLinksForWorkspace(library, workspace.name),
    );
  }
}

describe("serializeSnapshot", () => {
  it("round-trips the starter library without losing data", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());

    const yaml = serializeSnapshot(library);
    const restored = deserializeSnapshot(yaml);

    expectSnapshotRoundTrip(library, restored);
  });

  it("exports human-readable v2 YAML without catalog or placement IDs", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const document = parse(serializeSnapshot(library)) as Record<string, unknown>;

    expect(document.version).toBe(2);
    expect(document).not.toHaveProperty("catalog");
    expect(Array.isArray(document.workspaces)).toBe(true);

    const workspace = (document.workspaces as Record<string, unknown>[])[0]!;
    expect(workspace).toHaveProperty("bookmarks");
    expect(workspace).not.toHaveProperty("placements");

    const bookmark = (workspace.bookmarks as Record<string, unknown>[])[0]!;
    expect(bookmark).toHaveProperty("name");
    expect(bookmark).not.toHaveProperty("order");
    expect(bookmark).not.toHaveProperty("id");

    const link = (bookmark.links as Record<string, unknown>[])[0]!;
    expect(link).toHaveProperty("url");
    expect(link).not.toHaveProperty("id");
    expect(link).not.toHaveProperty("order");
  });

  it("round-trips extended internal tools fields on a workspace", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspace = library.workspaces[0]!;

    library.workspaces[0] = {
      ...workspace,
      internalTools: {
        pomodoro: {
          ...workspace.internalTools.pomodoro,
          splitId: "custom",
          phase: "shortBreak",
          running: false,
          endsAt: null,
          chimeEnabled: true,
          activeTaskId: "task-1",
          completedWorkSessions: 2,
        },
        customFocusSplit: {
          id: "custom",
          label: "My split",
          workMinutes: 40,
          shortBreakMinutes: 8,
          longBreakMinutes: 16,
        },
        tasks: [
          {
            id: "task-1",
            title: "Ship snapshot",
            estimateMinutes: 45,
            today: true,
            completed: false,
            orderKey: initialKey(),
          },
        ],
      },
    };

    const restored = deserializeSnapshot(serializeSnapshot(library));

    expect(restored.workspaces[0]?.internalTools).toEqual(library.workspaces[0]!.internalTools);
  });

  it("round-trips focus countdown fields on the pomodoro record", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspace = library.workspaces[0]!;

    library.workspaces[0] = {
      ...workspace,
      internalTools: {
        ...workspace.internalTools,
        pomodoro: {
          ...workspace.internalTools.pomodoro,
          mode: "countdown",
          countdownMinutes: 30,
          running: true,
          endsAt: "2026-06-09T12:30:00.000Z",
          activeTaskId: "task-1",
        },
      },
    };

    const restored = deserializeSnapshot(serializeSnapshot(library));

    expect(restored.workspaces[0]?.internalTools.pomodoro).toMatchObject({
      mode: "countdown",
      countdownMinutes: 30,
      running: true,
      endsAt: "2026-06-09T12:30:00.000Z",
      activeTaskId: "task-1",
    });
  });

  it("backfills missing internal tools fields when importing older snapshots", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const snapshot = libraryToMachineSnapshot(library);

    snapshot.workspaces[0]!.internalTools = {
      pomodoro: {
        splitId: "classic",
        phase: "work",
        running: false,
        endsAt: null,
        chimeEnabled: false,
        activeTaskId: null,
      },
      tasks: [],
    };

    const restored = deserializeSnapshot(stringify(snapshot));

    expect(restored.workspaces[0]?.internalTools).toMatchObject({
      customFocusSplit: null,
      pomodoro: {
        completedWorkSessions: 0,
      },
    });
  });

  it("round-trips appliedPresetId with shell border and widget styling", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspaceId = library.activeWorkspaceId;
    const baseTheme = resolveTheme(
      library.workspaces.find((workspace) => workspace.id === workspaceId)!.theme,
    );
    const withTheme = {
      ...library,
      workspaces: library.workspaces.map((workspace) =>
        workspace.id === workspaceId
          ? {
              ...workspace,
              theme: {
                ...baseTheme,
                appliedPresetId: "editorial",
                shellBorderColor: "#000000",
                widgets: {
                  ...baseTheme.widgets,
                  clock: {
                    ...baseTheme.widgets.clock,
                    zone: "lower-left",
                    text: "#000000",
                  },
                },
              },
            }
          : workspace,
      ),
    };

    const restored = deserializeSnapshot(serializeSnapshot(withTheme));
    const workspace = restored.workspaces.find((entry) => entry.id === workspaceId);

    expect(workspace?.theme.appliedPresetId).toBe("editorial");
    expect(workspace?.theme.shellBorderColor).toBe("#000000");
    expect(workspace?.theme.widgets.clock?.text).toBe("#000000");
    expect(workspace?.theme.widgets.clock?.zone).toBe("lower-left");
    expect(restored.schemaVersion).toBe(2);
  });

  it("round-trips shell border and canvas widget styling on workspace themes", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspaceId = library.activeWorkspaceId;
    const baseTheme = resolveTheme(
      library.workspaces.find((workspace) => workspace.id === workspaceId)!.theme,
    );
    const withTheme = {
      ...library,
      workspaces: library.workspaces.map((workspace) =>
        workspace.id === workspaceId
          ? {
              ...workspace,
              theme: {
                ...baseTheme,
                shellBorderColor: "#445566",
                widgets: {
                  ...baseTheme.widgets,
                  clock: {
                    ...baseTheme.widgets.clock,
                    text: "#ffffff",
                  },
                },
              },
            }
          : workspace,
      ),
    };

    const restored = deserializeSnapshot(serializeSnapshot(withTheme));
    const workspace = restored.workspaces.find((entry) => entry.id === workspaceId);

    expect(workspace?.theme.shellBorderColor).toBe("#445566");
    expect(workspace?.theme.widgets.clock?.text).toBe("#ffffff");
  });

  it("keeps theme background images as URL references in the snapshot", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const snapshot = libraryToSnapshot(library);

    for (const workspace of snapshot.workspaces) {
      if (workspace.theme.backgroundUrl) {
        const url = workspace.theme.backgroundUrl;
        expect(url.startsWith("http") || url.startsWith("/")).toBe(true);
        expect(url.startsWith("data:")).toBe(false);
      }
    }
  });
});

describe("deserializeSnapshot", () => {
  it("rejects invalid YAML", () => {
    expect(() => deserializeSnapshot("{\n  not: [yaml")).toThrow(/not valid yaml/i);
  });

  it("imports v1 machine-format snapshots without regression", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const yaml = stringify(libraryToMachineSnapshot(library)).replace("version: 2", "version: 1");

    const restored = deserializeSnapshot(yaml);

    expect(restored).toEqual(library);
  });

  it("rejects unsupported snapshot versions", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const yaml = serializeSnapshot(library).replace("version: 2", "version: 99");

    expect(() => deserializeSnapshot(yaml)).toThrow(/unsupported snapshot version/i);
  });

  it("drops legacy pin placements when importing a snapshot", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const snapshot = libraryToMachineSnapshot(library);
    snapshot.workspaces[0]!.placements.pins = [
      { linkId: "github", position: "strip", order: "a0" },
    ];

    const restored = deserializeSnapshot(stringify(snapshot));

    expect(restored.workspaces[0]?.placements).toEqual({
      edges: restored.workspaces[0]!.placements.edges,
    });
    expect("pins" in restored.workspaces[0]!.placements).toBe(false);
  });

  it("does not write pin placements or machine placements to exported snapshots", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const document = parse(serializeSnapshot(library)) as Record<string, unknown>;

    expect(document).not.toHaveProperty("catalog");
    for (const workspace of document.workspaces as Record<string, unknown>[]) {
      expect(workspace).not.toHaveProperty("placements");
      expect(workspace).toHaveProperty("bookmarks");
    }
  });
});

describe("deserializeSnapshot v2 human format", () => {
  const minimalTheme = {
    palette: {
      background: "#101010",
      surface: "#202020",
      text: "#f5f5f5",
      accent: "#ff5500",
    },
    borderRadius: 20,
    widgets: {},
  };

  it("parses v2 YAML with inline bookmarks into a valid library", () => {
    const yaml = stringify({
      version: 2,
      workspaces: [
        {
          name: "Work",
          theme: minimalTheme,
          bookmarks: [
            {
              name: "Today",
              icon: "☀️",
              links: [
                { title: "GitHub", url: "https://github.com" },
                { url: "https://linear.app" },
              ],
            },
          ],
        },
      ],
    });

    const library = deserializeSnapshot(yaml);

    expect(library.workspaces).toHaveLength(1);
    expect(library.workspaces[0]?.name).toBe("Work");
    expect(library.catalog).toHaveLength(2);
    expect(library.catalog[0]?.url).toBe("https://github.com");
    expect(library.catalog[0]?.title).toBe("GitHub");
    expect(library.catalog[1]?.url).toBe("https://linear.app");

    const group = library.workspaces[0]?.placements.edges.left[0];
    expect(group?.name).toBe("Today");
    expect(group?.handleIcon).toBe("☀️");
    expect(group?.links).toHaveLength(2);
    expect(group?.links.map((placement) => placement.linkId)).toEqual(
      library.catalog.map((link) => link.id),
    );
  });

  it("maps YAML array order to fractional order keys", () => {
    const yaml = stringify({
      version: 2,
      workspaces: [
        {
          name: "Work",
          theme: minimalTheme,
          bookmarks: [
            {
              name: "Third",
              links: [{ url: "https://third.example" }],
            },
            {
              name: "First",
              links: [
                { url: "https://link-c.example" },
                { url: "https://link-a.example" },
                { url: "https://link-b.example" },
              ],
            },
            {
              name: "Second",
              links: [{ url: "https://second.example" }],
            },
          ],
        },
      ],
    });

    const library = deserializeSnapshot(yaml);
    const workspace = library.workspaces[0]!;
    const groups = sortByKey(workspace.placements.edges.left, (group) => group.orderKey);
    expect(groups.map((group) => group.name)).toEqual(["Third", "First", "Second"]);

    const firstGroup = groups[1]!;
    const links = sortByKey(firstGroup.links, (placement) => placement.orderKey);
    const urls = links.map(
      (placement) => library.catalog.find((link) => link.id === placement.linkId)!.url,
    );
    expect(urls).toEqual([
      "https://link-c.example",
      "https://link-a.example",
      "https://link-b.example",
    ]);
  });

  it("creates distinct catalog entries for duplicate URLs", () => {
    const yaml = stringify({
      version: 2,
      workspaces: [
        {
          name: "Work",
          theme: minimalTheme,
          bookmarks: [
            {
              name: "A",
              links: [{ url: "https://github.com" }, { url: "https://github.com" }],
            },
            {
              name: "B",
              links: [{ url: "https://github.com" }],
            },
          ],
        },
      ],
    });

    const library = deserializeSnapshot(yaml);

    expect(library.catalog).toHaveLength(3);
    expect(new Set(library.catalog.map((link) => link.id)).size).toBe(3);
    expect(library.catalog.every((link) => link.url === "https://github.com")).toBe(true);
  });

  it("defaults shortcuts, focus radio, and active workspace when omitted", () => {
    const yaml = stringify({
      version: 2,
      workspaces: [
        {
          name: "Solo",
          theme: minimalTheme,
          bookmarks: [],
        },
      ],
    });

    const library = deserializeSnapshot(yaml);

    expect(library.shortcuts).toEqual({
      focusCommandBar: "Meta+Shift+k",
      cycleWorkspace: "Control+Tab",
    });
    expect(library.focusRadio.stations).toEqual([]);
    expect(library.activeWorkspaceId).toBe(library.workspaces[0]?.id);
  });
});

describe("importSnapshotFromUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches YAML from a URL and deserializes the library", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const yaml = serializeSnapshot(library);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => yaml,
      }),
    );

    const imported = await importSnapshotFromUrl("https://example.com/reshell.yaml");

    expectSnapshotRoundTrip(library, imported);
  });

  it("surfaces fetch failures without changing the library", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    await expect(importSnapshotFromUrl("https://example.com/missing.yaml")).rejects.toThrow(
      /failed to fetch snapshot/i,
    );
  });
});
