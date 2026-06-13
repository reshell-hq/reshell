import { describe, expect, it } from "vitest";
import { createStarterLibrary } from "@/library/starter-template";
import { deserializeSnapshot, serializeSnapshot } from "@/snapshot/snapshot";
import { createDefaultFocusRadio } from "./config";
import {
  resolveFocusRadioNowPlaying,
  resolveFocusRadioOutputVolume,
  resolveFocusRadioStreamPlaybackUrl,
  shouldPlayFocusRadioStream,
  shouldPlayFocusRadioYoutube,
} from "./playback";
import {
  resolveExternalMediaGlance,
  shouldAutoPauseFocusRadioForExternalGlance,
  shouldResumeFocusRadioAfterExternalGlance,
} from "./media-session";
import { parseYoutubeVideoId } from "./youtube";
import { buildFocusRadioStationPickerRows } from "./station-picker";
import { resolveFocusRadioStreamFailureAction } from "./stream-fallback";
import { isFocusRadioStationCatalogEmpty } from "./station-picker";
import {
  addFocusRadioStation,
  listFocusRadioStations,
  moveFocusRadioStation,
  removeFocusRadioStation,
  updateFocusRadioPlayback,
  updateFocusRadioStation,
} from "./stations";

function libraryWithoutFocusRadioStations() {
  return {
    ...createStarterLibrary(),
    focusRadio: createDefaultFocusRadio(),
  };
}

describe("createDefaultFocusRadio", () => {
  it("starts with no stations and paused playback preferences", () => {
    expect(createDefaultFocusRadio()).toEqual({
      stations: [],
      playback: {
        stationId: null,
        volume: 1,
        muted: false,
        playing: false,
      },
    });
  });
});

describe("starter library focus radio", () => {
  it("ships with youtube focus stations in the public starter template", () => {
    const stations = createStarterLibrary().focusRadio.stations;
    expect(stations).toHaveLength(4);
    expect(stations.every((station) => station.kind === "youtube")).toBe(true);
    expect(stations.map((station) => station.label)).toEqual([
      "synthwave radio",
      "lofi hip hop radio",
      "Art of Minimal Techno",
      "Deep Focus Music",
    ]);
  });
});

describe("addFocusRadioStation", () => {
  it("adds a trimmed station to the global library list", async () => {
    let library = libraryWithoutFocusRadioStations();

    library = addFocusRadioStation(library, {
      label: "  Lofi  ",
      url: "  https://stream.example.com/lofi.mp3  ",
      kind: "stream",
      description: " Focus beats ",
      favorite: true,
    });

    expect(listFocusRadioStations(library)).toMatchObject([
      {
        label: "Lofi",
        url: "https://stream.example.com/lofi.mp3",
        kind: "stream",
        description: "Focus beats",
        favorite: true,
      },
    ]);
  });
});

describe("updateFocusRadioStation", () => {
  it("updates station fields without changing order", async () => {
    let library = addFocusRadioStation(
      libraryWithoutFocusRadioStations(),
      {
        label: "Lofi",
        url: "https://stream.example.com/lofi.mp3",
        kind: "stream",
      },
      "station-1",
    );

    library = updateFocusRadioStation(library, "station-1", {
      label: "Night Lofi",
      kind: "youtube",
      url: "https://youtube.com/live/example",
      imageUrl: "https://img.example.com/logo.png",
    });

    expect(listFocusRadioStations(library)).toMatchObject([
      {
        id: "station-1",
        label: "Night Lofi",
        kind: "youtube",
        url: "https://youtube.com/live/example",
        imageUrl: "https://img.example.com/logo.png",
      },
    ]);
  });
});

describe("removeFocusRadioStation", () => {
  it("drops the station and clears playback when it was active", async () => {
    let library = addFocusRadioStation(
      libraryWithoutFocusRadioStations(),
      {
        label: "Lofi",
        url: "https://stream.example.com/lofi.mp3",
        kind: "stream",
      },
      "station-1",
    );
    library = updateFocusRadioPlayback(library, {
      stationId: "station-1",
      playing: true,
    });

    library = removeFocusRadioStation(library, "station-1");

    expect(library.focusRadio.stations).toEqual([]);
    expect(library.focusRadio.playback).toMatchObject({
      stationId: null,
      playing: false,
    });
  });
});

describe("moveFocusRadioStation", () => {
  it("reorders stations by slot index", async () => {
    let library = libraryWithoutFocusRadioStations();
    library = addFocusRadioStation(
      library,
      {
        label: "First",
        url: "https://stream.example.com/1.mp3",
        kind: "stream",
      },
      "first",
    );
    library = addFocusRadioStation(
      library,
      {
        label: "Second",
        url: "https://stream.example.com/2.mp3",
        kind: "stream",
      },
      "second",
    );

    library = moveFocusRadioStation(library, "second", 0);

    expect(listFocusRadioStations(library).map((station) => station.id)).toEqual([
      "second",
      "first",
    ]);
  });
});

describe("updateFocusRadioPlayback", () => {
  it("persists global volume, mute, and playing state", async () => {
    let library = addFocusRadioStation(
      libraryWithoutFocusRadioStations(),
      {
        label: "Lofi",
        url: "https://stream.example.com/lofi.mp3",
        kind: "stream",
      },
      "station-1",
    );

    library = updateFocusRadioPlayback(library, {
      stationId: "station-1",
      volume: 1.5,
      muted: true,
      playing: true,
    });

    expect(library.focusRadio.playback).toEqual({
      stationId: "station-1",
      volume: 1,
      muted: true,
      playing: true,
    });
  });
});

describe("resolveFocusRadioOutputVolume", () => {
  it("returns zero when muted and otherwise clamps volume", () => {
    expect(resolveFocusRadioOutputVolume({ volume: 0.8, muted: true })).toBe(0);
    expect(resolveFocusRadioOutputVolume({ volume: 1.5, muted: false })).toBe(1);
    expect(resolveFocusRadioOutputVolume({ volume: -0.2, muted: false })).toBe(0);
  });
});

describe("resolveFocusRadioNowPlaying", () => {
  it("returns the active station when playback has a station id", async () => {
    let library = addFocusRadioStation(
      libraryWithoutFocusRadioStations(),
      {
        label: "Lofi Girl",
        url: "https://stream.example.com/lofi.mp3",
        kind: "stream",
        imageUrl: "https://img.example.com/lofi.png",
      },
      "lofi",
    );
    library = updateFocusRadioPlayback(library, {
      stationId: "lofi",
      playing: true,
    });

    expect(resolveFocusRadioNowPlaying(library)).toEqual({
      id: "lofi",
      label: "Lofi Girl",
      kind: "stream",
      url: "https://stream.example.com/lofi.mp3",
      imageUrl: "https://img.example.com/lofi.png",
    });
  });

  it("returns null when no station is selected", () => {
    expect(resolveFocusRadioNowPlaying(createStarterLibrary())).toBeNull();
  });
});

describe("resolveExternalMediaGlance", () => {
  it("returns external metadata when it does not match focus radio", () => {
    expect(
      resolveExternalMediaGlance(
        { title: "Spotify Session", artwork: [{ src: "https://img.example.com/cover.png" }] },
        {
          id: "lofi",
          label: "Lofi Girl",
          kind: "stream",
          url: "https://stream.example.com/lofi.mp3",
        },
      ),
    ).toEqual({
      title: "Spotify Session",
      artworkUrl: "https://img.example.com/cover.png",
    });
  });

  it("ignores metadata that matches the active focus radio station", () => {
    expect(
      resolveExternalMediaGlance(
        { title: "Lofi Girl" },
        {
          id: "lofi",
          label: "Lofi Girl",
          kind: "stream",
          url: "https://stream.example.com/lofi.mp3",
        },
      ),
    ).toBeNull();
  });
});

describe("focus radio external media session rules", () => {
  it("auto-pauses focus radio when external media is active", () => {
    expect(shouldAutoPauseFocusRadioForExternalGlance(true, { title: "Other tab" })).toBe(true);
    expect(shouldAutoPauseFocusRadioForExternalGlance(false, { title: "Other tab" })).toBe(false);
  });

  it("resumes focus radio after external media stops if it was playing before", () => {
    expect(shouldResumeFocusRadioAfterExternalGlance(true, null)).toBe(true);
    expect(shouldResumeFocusRadioAfterExternalGlance(false, null)).toBe(false);
    expect(shouldResumeFocusRadioAfterExternalGlance(true, { title: "Still playing" })).toBe(false);
  });
});

describe("parseYoutubeVideoId", () => {
  it("resolves youtube thumbnail artwork from the video id", async () => {
    let library = libraryWithoutFocusRadioStations();
    library = addFocusRadioStation(
      library,
      {
        label: "Lofi",
        url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        kind: "youtube",
      },
      "lofi",
    );
    library = updateFocusRadioPlayback(library, { stationId: "lofi" });

    const nowPlaying = resolveFocusRadioNowPlaying(library);
    expect(nowPlaying?.imageUrl).toBe("https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg");
  });

  it("extracts ids from common youtube urls", () => {
    expect(parseYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYoutubeVideoId("https://youtube.com/live/abc123XYZ_0")).toBe("abc123XYZ_0");
    expect(parseYoutubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYoutubeVideoId("https://music.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYoutubeVideoId("not-a-url")).toBeNull();
  });
});

describe("focus radio background playback", () => {
  it("derives playback intent from library state only", async () => {
    let library = addFocusRadioStation(
      libraryWithoutFocusRadioStations(),
      {
        label: "Lofi",
        url: "https://stream.example.com/lofi.mp3",
        kind: "stream",
      },
      "lofi",
    );
    library = updateFocusRadioPlayback(library, { stationId: "lofi", playing: true });

    expect(shouldPlayFocusRadioStream(library)).toBe(true);
    expect(shouldPlayFocusRadioYoutube(library)).toBe(false);
  });
});

describe("shouldPlayFocusRadioYoutube", () => {
  it("is true only when the active youtube station is playing", async () => {
    let library = addFocusRadioStation(
      libraryWithoutFocusRadioStations(),
      {
        label: "Live",
        url: "https://youtube.com/live/example",
        kind: "youtube",
      },
      "live",
    );
    library = updateFocusRadioPlayback(library, { stationId: "live", playing: true });

    expect(shouldPlayFocusRadioYoutube(library)).toBe(true);

    library = updateFocusRadioPlayback(library, { playing: false });
    expect(shouldPlayFocusRadioYoutube(library)).toBe(false);
  });
});

describe("resolveFocusRadioStreamPlaybackUrl", () => {
  it("returns the stream proxy url for stream stations", async () => {
    let library = addFocusRadioStation(
      libraryWithoutFocusRadioStations(),
      {
        label: "Lofi",
        url: "https://stream.example.com/lofi.mp3",
        kind: "stream",
      },
      "lofi",
    );
    library = updateFocusRadioPlayback(library, { stationId: "lofi", playing: true });

    expect(resolveFocusRadioStreamPlaybackUrl(library)).toBe(
      "/api/focus-radio/stream?url=https%3A%2F%2Fstream.example.com%2Flofi.mp3",
    );
  });

  it("returns null for youtube stations", async () => {
    let library = addFocusRadioStation(
      libraryWithoutFocusRadioStations(),
      {
        label: "Live",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        kind: "youtube",
      },
      "live",
    );
    library = updateFocusRadioPlayback(library, { stationId: "live", playing: true });

    expect(resolveFocusRadioStreamPlaybackUrl(library)).toBeNull();
  });
});

describe("resolveFocusRadioStreamFailureAction", () => {
  it("retries the current station once before failing", () => {
    expect(resolveFocusRadioStreamFailureAction(false)).toEqual({ type: "retry" });
    expect(resolveFocusRadioStreamFailureAction(true)).toEqual({ type: "failed" });
  });
});

describe("isFocusRadioStationCatalogEmpty", () => {
  it("is false for the public starter library and true when no stations exist", async () => {
    expect(isFocusRadioStationCatalogEmpty(createStarterLibrary())).toBe(false);
    expect(isFocusRadioStationCatalogEmpty(libraryWithoutFocusRadioStations())).toBe(true);
  });
});

describe("buildFocusRadioStationPickerRows", () => {
  it("lists stations with the active one marked and favorites pinned first", async () => {
    let library = libraryWithoutFocusRadioStations();
    library = addFocusRadioStation(
      library,
      { label: "Techno", url: "https://stream.example.com/techno.mp3", kind: "stream" },
      "techno",
    );
    library = addFocusRadioStation(
      library,
      {
        label: "Lofi Girl",
        url: "https://stream.example.com/lofi.mp3",
        kind: "stream",
        favorite: true,
      },
      "lofi",
    );
    library = addFocusRadioStation(
      library,
      { label: "Night Drive", url: "https://stream.example.com/night.mp3", kind: "stream" },
      "night",
    );
    library = updateFocusRadioPlayback(library, { stationId: "night" });

    expect(buildFocusRadioStationPickerRows(library)).toEqual([
      {
        id: "lofi",
        label: "Lofi Girl",
        kind: "stream",
        active: false,
        favorite: true,
      },
      {
        id: "techno",
        label: "Techno",
        kind: "stream",
        active: false,
        favorite: false,
      },
      {
        id: "night",
        label: "Night Drive",
        kind: "stream",
        active: true,
        favorite: false,
      },
    ]);
  });

  it("filters stations by label", async () => {
    let library = libraryWithoutFocusRadioStations();
    library = addFocusRadioStation(
      library,
      { label: "Lofi Girl", url: "https://stream.example.com/lofi.mp3", kind: "stream" },
      "lofi",
    );
    library = addFocusRadioStation(
      library,
      { label: "Techno FM", url: "https://stream.example.com/techno.mp3", kind: "stream" },
      "techno",
    );

    expect(buildFocusRadioStationPickerRows(library, "lofi").map((row) => row.id)).toEqual([
      "lofi",
    ]);
  });
});

describe("focus radio snapshot", () => {
  it("round-trips stations and playback preferences", async () => {
    let library = addFocusRadioStation(
      libraryWithoutFocusRadioStations(),
      {
        label: "Lofi",
        url: "https://stream.example.com/lofi.mp3",
        kind: "stream",
      },
      "station-1",
    );
    library = updateFocusRadioPlayback(library, {
      stationId: "station-1",
      volume: 0.6,
      muted: false,
      playing: true,
    });

    const restored = deserializeSnapshot(serializeSnapshot(library));

    expect(restored.focusRadio).toEqual(library.focusRadio);
  });
});
