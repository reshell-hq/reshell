import type { MusicStation } from "@/lib/config";
import type { MusicPlayback } from "./types";

/** Default volume for a fresh playback state (0–100). */
export const DEFAULT_VOLUME = 70;

/**
 * The playback state for an untouched override: the first configured station,
 * volume 70, not muted, not playing. Pure (ADR-0009) so the provider and
 * `useMusic` share one default.
 */
export function defaultMusicPlayback(stations: MusicStation[]): MusicPlayback {
  return {
    stationId: stations[0]?.id ?? "",
    volume: DEFAULT_VOLUME,
    muted: false,
    playing: false,
  };
}

/**
 * The effective playback: the persisted override if present, else the default.
 * A `stationId` orphaned by a config edit falls back to the first station
 * rather than resolving to nothing (mirrors the workspace orphan handling).
 */
export function effectiveMusicPlayback(
  override: MusicPlayback | undefined,
  stations: MusicStation[],
): MusicPlayback {
  if (!override) {
    return defaultMusicPlayback(stations);
  }
  const known = stations.some((station) => station.id === override.stationId);
  if (known) {
    return override;
  }
  return { ...override, stationId: stations[0]?.id ?? "", playing: false };
}
