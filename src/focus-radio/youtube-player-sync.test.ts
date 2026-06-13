import { describe, expect, it } from "vitest";
import { syncFocusRadioYoutubePlayer } from "./youtube-player-sync";
import type { FocusRadioPlayback } from "./types";

const playback: FocusRadioPlayback = {
  stationId: "live",
  volume: 0.85,
  muted: false,
  playing: true,
};

describe("syncFocusRadioYoutubePlayer", () => {
  it("loads and plays the requested video id", () => {
    const calls: string[] = [];
    const loadedVideoIdRef = { current: null as string | null };
    const player = {
      loadVideoById: (videoId: string) => {
        calls.push(`load:${videoId}`);
      },
      playVideo: () => {
        calls.push("play");
      },
      pauseVideo: () => {
        calls.push("pause");
      },
      setVolume: () => {},
      mute: () => {},
      unMute: () => {},
      setSize: () => {},
      destroy: () => {},
    };

    syncFocusRadioYoutubePlayer(player, {
      videoId: "abc123",
      shouldPlay: true,
      playback,
      loadedVideoIdRef,
    });

    expect(calls).toEqual(["load:abc123", "play"]);
  });
});
