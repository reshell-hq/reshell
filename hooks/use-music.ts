"use client";

import { useCallback, useMemo } from "react";
import { useReshellState } from "@/hooks/use-reshell-state";
import type { MusicStation } from "@/lib/config";
import {
  effectiveMusicPlayback,
  resolveStationSource,
  type MusicPlayback,
  type YoutubeSource,
} from "@/lib/music";

// Stable empty reference so a config without a music block doesn't churn.
const EMPTY_STATIONS: MusicStation[] = [];

/**
 * The music tool's React seam (CONTEXT: "Tool"). Reads the effective global
 * playback (the override slice merged over config-derived defaults) and writes
 * only through the provider's `setMusic` — never localStorage directly
 * (ADR-0009). Music is **global**: there is no `activeWorkspaceId` here, so it
 * is identical on every workspace and survives switches.
 *
 * Stable shape for plan 014's now-playing widget: keep `playback`, `station`,
 * `source`, and `isPlaying` intact.
 */
export type UseMusic = {
  /** Effective playback (override merged over config defaults). */
  playback: MusicPlayback;
  /** Configured stations (read-only). */
  stations: MusicStation[];
  /** The currently selected station, or null when none is configured. */
  station: MusicStation | null;
  /** The resolved YouTube source for the current station, or null. */
  source: YoutubeSource | null;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  /** Advance to the next configured station (wraps). */
  next: () => void;
  /** Go to the previous configured station (wraps). */
  prev: () => void;
  /** Set volume (0–100, clamped). */
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  /** Select a station by id and start playing it. */
  selectStation: (stationId: string) => void;
};

function clampVolume(volume: number): number {
  if (Number.isNaN(volume)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(volume)));
}

export function useMusic(): UseMusic {
  const { config, music, setMusic } = useReshellState();
  const stations = config.music?.stations ?? EMPTY_STATIONS;

  const playback = effectiveMusicPlayback(music, stations);

  const station = useMemo(
    () => stations.find((item) => item.id === playback.stationId) ?? null,
    [stations, playback.stationId],
  );
  const source = useMemo(
    () => (station ? resolveStationSource(station.url) : null),
    [station],
  );

  // Every action is a discrete full-slice write over the effective state.
  const write = useCallback(
    (patch: Partial<MusicPlayback>) => setMusic({ ...playback, ...patch }),
    [setMusic, playback],
  );

  const play = useCallback(() => write({ playing: true }), [write]);
  const pause = useCallback(() => write({ playing: false }), [write]);
  const toggleMute = useCallback(
    () => write({ muted: !playback.muted }),
    [write, playback.muted],
  );
  const setVolume = useCallback(
    (volume: number) => write({ volume: clampVolume(volume) }),
    [write],
  );

  const step = useCallback(
    (direction: 1 | -1) => {
      if (stations.length === 0) {
        return;
      }
      const current = stations.findIndex((item) => item.id === playback.stationId);
      const nextIndex =
        (current + direction + stations.length) % stations.length;
      write({ stationId: stations[nextIndex].id });
    },
    [stations, playback.stationId, write],
  );
  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);

  const selectStation = useCallback(
    (stationId: string) => write({ stationId, playing: true }),
    [write],
  );

  return {
    playback,
    stations,
    station,
    source,
    isPlaying: playback.playing,
    play,
    pause,
    next,
    prev,
    setVolume,
    toggleMute,
    selectStation,
  };
}
