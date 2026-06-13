import { rebalanceKeys } from "@/fractional-order/fractional-order";
import type { FocusRadio } from "./types";

const STARTER_YOUTUBE_STATIONS = [
  {
    id: "synthwave-radio",
    label: "synthwave radio",
    url: "https://www.youtube.com/watch?v=4xDzrJKXOOY",
    favorite: true,
  },
  {
    id: "lofi-hip-hop-radio",
    label: "lofi hip hop radio",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    favorite: true,
  },
  {
    id: "art-of-minimal-techno",
    label: "Art of Minimal Techno",
    url: "https://www.youtube.com/watch?v=UYOb37KRFqk",
    favorite: true,
  },
  {
    id: "deep-focus-music",
    label: "Deep Focus Music",
    url: "https://www.youtube.com/watch?v=LhMyAYil3N8",
    favorite: true,
  },
] as const;

export function createStarterFocusRadio(): FocusRadio {
  const orderKeys = rebalanceKeys(STARTER_YOUTUBE_STATIONS.length);

  return {
    stations: STARTER_YOUTUBE_STATIONS.map((station, index) => ({
      id: station.id,
      label: station.label,
      url: station.url,
      kind: "youtube" as const,
      orderKey: orderKeys[index]!,
      favorite: station.favorite,
    })),
    playback: {
      stationId: null,
      volume: 0.85,
      muted: false,
      playing: false,
    },
  };
}
