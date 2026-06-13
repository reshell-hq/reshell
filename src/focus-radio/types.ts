import type { FractionalOrderKey } from "@/fractional-order/fractional-order";

export type FocusRadioStationKind = "stream" | "youtube";

export type FocusRadioStation = {
  id: string;
  label: string;
  url: string;
  kind: FocusRadioStationKind;
  imageUrl?: string;
  description?: string;
  favorite?: boolean;
  orderKey: FractionalOrderKey;
};

export type FocusRadioPlayback = {
  stationId: string | null;
  volume: number;
  muted: boolean;
  playing: boolean;
};

export type FocusRadio = {
  stations: FocusRadioStation[];
  playback: FocusRadioPlayback;
};

export type FocusRadioStationInput = {
  label: string;
  url: string;
  kind: FocusRadioStationKind;
  imageUrl?: string;
  description?: string;
  favorite?: boolean;
};

export type FocusRadioStationPatch = {
  label?: string;
  url?: string;
  kind?: FocusRadioStationKind;
  imageUrl?: string | null;
  description?: string | null;
  favorite?: boolean;
};

export type FocusRadioPlaybackPatch = {
  stationId?: string | null;
  volume?: number;
  muted?: boolean;
  playing?: boolean;
};
