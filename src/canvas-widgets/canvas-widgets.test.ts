import { describe, expect, it } from "vitest";
import { createTestTheme } from "@/theme/theme-defaults";
import { formatClockDisplay } from "./clock";
import {
  CANVAS_WIDGET_IDS,
  createDefaultCanvasWidgets,
  listEnabledCanvasWidgets,
  setCanvasWidgetEnabled,
} from "./config";
import { pickQuote } from "./quote";
import { formatWelcomeMessage } from "./welcome";
import { loadOrSeedLibrary } from "@/library/library";
import { createInMemoryLibraryStore } from "@/library/store";
import { deserializeSnapshot, serializeSnapshot } from "@/snapshot/snapshot";
import { ensureWorkspaceCanvasWidgets } from "./defaults";

describe("formatClockDisplay", () => {
  it("formats the current time and weekday date for the canvas clock widget", () => {
    const now = new Date("2026-06-09T14:30:00.000Z");

    expect(formatClockDisplay(now, "en-US", "UTC")).toEqual({
      time: "2:30 PM",
      date: "Tuesday, June 9",
    });
  });

  it("uses the runtime local timezone when none is provided", () => {
    const now = new Date("2026-06-09T14:30:00.000Z");

    expect(formatClockDisplay(now)).toEqual({
      time: new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(now),
      date: new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(now),
    });
  });
});

describe("formatWelcomeMessage", () => {
  it("greets with the display name using time of day", () => {
    expect(formatWelcomeMessage(new Date("2026-06-09T09:00:00.000Z"), "Jack", "UTC")).toBe(
      "Good morning, Jack",
    );
    expect(formatWelcomeMessage(new Date("2026-06-09T15:00:00.000Z"), "Jack", "UTC")).toBe(
      "Good afternoon, Jack",
    );
  });
});

describe("pickQuote", () => {
  it("returns a bundled quote deterministically from a seed", () => {
    const first = pickQuote(0);
    const again = pickQuote(0);
    const next = pickQuote(1);

    expect(first.text).toBeTruthy();
    expect(again).toEqual(first);
    expect(next.text).not.toBe(first.text);
  });
});

describe("createDefaultCanvasWidgets", () => {
  it("enables all v1 canvas widgets for a new workspace", () => {
    expect(createDefaultCanvasWidgets()).toEqual({
      clock: true,
      welcome: true,
      quote: true,
      nowPlaying: true,
      pomodoro: true,
      focusTasks: true,
    });
  });
});

describe("CANVAS_WIDGET_IDS", () => {
  it("includes the pomodoro canvas widget in canonical order", () => {
    expect(CANVAS_WIDGET_IDS).toContain("pomodoro");
  });

  it("includes the focus tasks canvas widget in canonical order", () => {
    expect(CANVAS_WIDGET_IDS).toContain("focusTasks");
  });
});

describe("listEnabledCanvasWidgets", () => {
  it("returns only enabled widgets in canonical order", () => {
    const workspace = ensureWorkspaceCanvasWidgets({
      id: "ws-1",
      name: "Work",
      theme: createTestTheme({
        palette: { background: "#000", surface: "#111", text: "#fff", accent: "#f00" },
        borderRadius: 12,
      }),
      placements: { edges: { left: [], top: [], bottom: [] } },
      internalTools: {
        pomodoro: {
          splitId: "classic",
          phase: "work",
          running: false,
          endsAt: null,
          chimeEnabled: false,
          activeTaskId: null,
          completedWorkSessions: 0,
        },
        tasks: [],
        customFocusSplit: null,
      },
      canvasWidgets: {
        clock: true,
        welcome: false,
        quote: true,
        nowPlaying: false,
        pomodoro: false,
        focusTasks: false,
      },
    });

    expect(listEnabledCanvasWidgets(workspace)).toEqual(["clock", "quote"]);
    expect(CANVAS_WIDGET_IDS).toEqual([
      "clock",
      "welcome",
      "quote",
      "nowPlaying",
      "pomodoro",
      "focusTasks",
    ]);
  });
});

describe("focusTasks canvas widget snapshot", () => {
  it("round-trips the per-workspace toggle through export and import", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspaceId = library.activeWorkspaceId;
    const enabled = setCanvasWidgetEnabled(library, workspaceId, "focusTasks", true);

    const restored = deserializeSnapshot(serializeSnapshot(enabled));
    const workspace = restored.workspaces.find((entry) => entry.id === workspaceId)!;

    expect(workspace.canvasWidgets.focusTasks).toBe(true);
  });
});

describe("setCanvasWidgetEnabled", () => {
  it("toggles a widget for one workspace without affecting others", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspaceId = library.activeWorkspaceId;
    const otherId = library.workspaces.find((workspace) => workspace.id !== workspaceId)!.id;

    const updated = setCanvasWidgetEnabled(library, workspaceId, "clock", false);

    const active = updated.workspaces.find((workspace) => workspace.id === workspaceId)!;
    const other = updated.workspaces.find((workspace) => workspace.id === otherId)!;

    expect(active.canvasWidgets.clock).toBe(false);
    expect(other.canvasWidgets.clock).toBe(true);
  });
});

describe("ensureWorkspaceCanvasWidgets", () => {
  it("backfills canvas widget toggles for libraries saved before issue 32", async () => {
    const store = createInMemoryLibraryStore();
    const seeded = await loadOrSeedLibrary(store);
    const legacy = {
      ...seeded,
      workspaces: seeded.workspaces.map(
        ({ canvasWidgets: _canvasWidgets, ...workspace }) => workspace,
      ),
    };
    await store.write(legacy as typeof seeded);

    const loaded = await loadOrSeedLibrary(store);
    const workspace = loaded.workspaces.find((entry) => entry.id === loaded.activeWorkspaceId)!;

    expect(workspace.canvasWidgets).toEqual(createDefaultCanvasWidgets());
  });
});
