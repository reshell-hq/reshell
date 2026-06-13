import { describe, expect, it } from "vitest";
import { initialKey } from "@/fractional-order/fractional-order";
import { createDefaultFocusRadio } from "@/focus-radio/config";
import { updateFocusRadioPlayback } from "@/focus-radio/stations";
import { LIBRARY_SCHEMA_VERSION } from "@/library/schema";
import type { Library, Workspace } from "@/library/types";
import { createTestTheme } from "@/theme/theme-defaults";
import { loadOrSeedLibrary } from "@/library/library";
import { createInMemoryLibraryStore } from "@/library/store";
import { deserializeSnapshot, serializeSnapshot } from "@/snapshot/snapshot";
import {
  clearCanvasNowPlayingDismiss,
  dismissCanvasNowPlaying,
  shouldShowCanvasNowPlayingWidget,
} from "./now-playing";

function workspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "ws-1",
    name: "Work",
    theme: createTestTheme({
      palette: { background: "#000", surface: "#111", text: "#fff", accent: "#f00" },
      borderRadius: 12,
    }),
    placements: { edges: { left: [], top: [], bottom: [] } },
    internalTools: {
      pomodoro: {
        mode: "pomodoro",
        splitId: "classic",
        phase: "work",
        running: false,
        endsAt: null,
        chimeEnabled: false,
        activeTaskId: null,
        completedWorkSessions: 0,
        countdownMinutes: null,
      },
      tasks: [],
      customFocusSplit: null,
    },
    canvasWidgets: {
      clock: true,
      welcome: true,
      quote: true,
      nowPlaying: true,
      pomodoro: false,
      focusTasks: false,
    },
    ...overrides,
  };
}

function libraryWithWorkspace(entry: Workspace): Library {
  return {
    schemaVersion: LIBRARY_SCHEMA_VERSION,
    catalog: [],
    workspaces: [entry],
    shortcuts: { focusCommandBar: "Meta+Shift+k", cycleWorkspace: "Control+Tab" },
    focusRadio: {
      stations: [
        {
          id: "lofi",
          label: "Lofi",
          url: "https://example.com/stream",
          kind: "stream",
          orderKey: initialKey(),
        },
      ],
      playback: {
        stationId: "lofi",
        volume: 0.8,
        muted: false,
        playing: true,
      },
    },
    activeWorkspaceId: entry.id,
  };
}

describe("shouldShowCanvasNowPlayingWidget", () => {
  it("shows the widget when enabled, a station is selected, and not dismissed", () => {
    const entry = workspace();
    const library = libraryWithWorkspace(entry);

    expect(shouldShowCanvasNowPlayingWidget(entry, library)).toBe(true);
  });

  it("keeps the widget visible while paused until dismissed", () => {
    const entry = workspace();
    const library = libraryWithWorkspace(entry);
    library.focusRadio.playback.playing = false;

    expect(shouldShowCanvasNowPlayingWidget(entry, library)).toBe(true);
  });

  it("hides the widget after dismiss until the next play", () => {
    const entry = workspace({ canvasNowPlayingDismissed: true });
    const library = libraryWithWorkspace(entry);

    expect(shouldShowCanvasNowPlayingWidget(entry, library)).toBe(false);
  });

  it("respects the settings master toggle", () => {
    const entry = workspace({
      canvasWidgets: {
        ...workspace().canvasWidgets,
        nowPlaying: false,
      },
    });
    const library = libraryWithWorkspace(entry);

    expect(shouldShowCanvasNowPlayingWidget(entry, library)).toBe(false);
  });
});

describe("dismissCanvasNowPlaying", () => {
  it("sets a per-workspace dismiss flag without affecting other workspaces", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspaceId = library.activeWorkspaceId;
    const otherId = library.workspaces.find((entry) => entry.id !== workspaceId)!.id;

    const updated = dismissCanvasNowPlaying(library, workspaceId);
    const active = updated.workspaces.find((entry) => entry.id === workspaceId)!;
    const other = updated.workspaces.find((entry) => entry.id === otherId)!;

    expect(active.canvasNowPlayingDismissed).toBe(true);
    expect(other.canvasNowPlayingDismissed).toBeUndefined();
  });
});

describe("clearCanvasNowPlayingDismiss", () => {
  it("clears dismiss on every workspace when playback resumes", () => {
    const work = workspace({ id: "work", canvasNowPlayingDismissed: true });
    const personal = workspace({
      id: "personal",
      name: "Personal",
      canvasNowPlayingDismissed: true,
    });
    const library: Library = {
      ...libraryWithWorkspace(work),
      workspaces: [work, personal],
      activeWorkspaceId: "work",
    };

    const cleared = clearCanvasNowPlayingDismiss(library);

    expect(cleared.workspaces.every((entry) => entry.canvasNowPlayingDismissed === false)).toBe(
      true,
    );
  });

  it("clears dismiss when playback starts via updateFocusRadioPlayback", () => {
    const entry = workspace({ canvasNowPlayingDismissed: true });
    const library = dismissCanvasNowPlaying(libraryWithWorkspace(entry), entry.id);
    const resumed = updateFocusRadioPlayback(library, { playing: true });
    const active = resumed.workspaces.find((item) => item.id === entry.id)!;

    expect(active.canvasNowPlayingDismissed).toBe(false);
  });
});

describe("canvas now playing dismiss snapshot", () => {
  it("round-trips the per-workspace dismiss flag through export and import", async () => {
    const library = await loadOrSeedLibrary(createInMemoryLibraryStore());
    const workspaceId = library.activeWorkspaceId;
    const dismissed = dismissCanvasNowPlaying(library, workspaceId);

    const restored = deserializeSnapshot(serializeSnapshot(dismissed));
    const active = restored.workspaces.find((entry) => entry.id === workspaceId)!;

    expect(active.canvasNowPlayingDismissed).toBe(true);
  });
});
