import type { FocusRadio } from "./types";

export function createDefaultFocusRadio(): FocusRadio {
  return {
    stations: [],
    playback: {
      stationId: null,
      volume: 1,
      muted: false,
      playing: false,
    },
  };
}
