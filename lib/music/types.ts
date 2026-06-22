/**
 * The music tool's data model (CONTEXT: "Tool"). Pure types — zero React/DOM
 * deps — part of the portable core the paid tiers import (ADR-0009).
 *
 * Music is the one **global** override slice (not per-workspace): one station
 * list, one playback state, kept playing across workspace switches.
 */

/**
 * Global playback state, persisted in the override (ADR-0007). `volume` is
 * 0–100 (the YouTube IFrame API scale); `stationId` references a
 * `config.music.stations` entry.
 */
export type MusicPlayback = {
  stationId: string;
  /** 0–100, matching the YouTube IFrame API volume scale. */
  volume: number;
  muted: boolean;
  playing: boolean;
};
