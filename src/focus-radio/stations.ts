import { clearCanvasNowPlayingDismiss } from "@/canvas-widgets/now-playing";
import { initialKey, insertBetween, sortByKey } from "@/fractional-order/fractional-order";
import type { Library } from "@/library/types";
import type {
  FocusRadioPlaybackPatch,
  FocusRadioStation,
  FocusRadioStationInput,
  FocusRadioStationPatch,
} from "./types";

function sortedStations(stations: readonly FocusRadioStation[]): FocusRadioStation[] {
  return sortByKey([...stations], (station) => station.orderKey);
}

export function listFocusRadioStations(library: Library): FocusRadioStation[] {
  return sortedStations(library.focusRadio.stations);
}

export function addFocusRadioStation(
  library: Library,
  input: FocusRadioStationInput,
  id = crypto.randomUUID(),
): Library {
  const label = input.label.trim();
  const url = input.url.trim();
  if (!label || !url) {
    return library;
  }

  const lastStation = sortedStations(library.focusRadio.stations).at(-1);
  const orderKey = lastStation ? insertBetween(lastStation.orderKey, null) : initialKey();

  const station: FocusRadioStation = {
    id,
    label,
    url,
    kind: input.kind,
    orderKey,
    ...(input.imageUrl?.trim() ? { imageUrl: input.imageUrl.trim() } : {}),
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    ...(input.favorite ? { favorite: true } : {}),
  };

  return {
    ...library,
    focusRadio: {
      ...library.focusRadio,
      stations: [...library.focusRadio.stations, station],
    },
  };
}

export function updateFocusRadioStation(
  library: Library,
  stationId: string,
  patch: FocusRadioStationPatch,
): Library {
  const stations = library.focusRadio.stations.map((station) => {
    if (station.id !== stationId) {
      return station;
    }

    const next = { ...station };

    if (patch.label !== undefined) {
      const label = patch.label.trim();
      if (!label) {
        return station;
      }
      next.label = label;
    }

    if (patch.url !== undefined) {
      const url = patch.url.trim();
      if (!url) {
        return station;
      }
      next.url = url;
    }

    if (patch.kind !== undefined) {
      next.kind = patch.kind;
    }

    if (patch.imageUrl !== undefined) {
      const imageUrl = patch.imageUrl?.trim();
      if (imageUrl) {
        next.imageUrl = imageUrl;
      } else {
        delete next.imageUrl;
      }
    }

    if (patch.description !== undefined) {
      const description = patch.description?.trim();
      if (description) {
        next.description = description;
      } else {
        delete next.description;
      }
    }

    if (patch.favorite !== undefined) {
      if (patch.favorite) {
        next.favorite = true;
      } else {
        delete next.favorite;
      }
    }

    return next;
  });

  return {
    ...library,
    focusRadio: {
      ...library.focusRadio,
      stations,
    },
  };
}

export function removeFocusRadioStation(library: Library, stationId: string): Library {
  const stations = library.focusRadio.stations.filter((station) => station.id !== stationId);
  if (stations.length === library.focusRadio.stations.length) {
    return library;
  }

  const playback =
    library.focusRadio.playback.stationId === stationId
      ? { ...library.focusRadio.playback, stationId: null, playing: false }
      : library.focusRadio.playback;

  return {
    ...library,
    focusRadio: {
      ...library.focusRadio,
      stations,
      playback,
    },
  };
}

export function moveFocusRadioStation(
  library: Library,
  stationId: string,
  targetSlotIndex: number,
): Library {
  const sorted = sortedStations(library.focusRadio.stations);
  const fromIndex = sorted.findIndex((station) => station.id === stationId);
  if (fromIndex === -1) {
    return library;
  }

  const targetIndex = Math.max(0, Math.min(targetSlotIndex, sorted.length - 1));
  if (fromIndex === targetIndex) {
    return library;
  }

  const reordered = [...sorted];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(targetIndex, 0, moved);

  const beforeKey = targetIndex === 0 ? null : reordered[targetIndex - 1].orderKey;
  const afterKey =
    targetIndex === reordered.length - 1 ? null : reordered[targetIndex + 1].orderKey;
  const newOrderKey = insertBetween(beforeKey, afterKey);

  return {
    ...library,
    focusRadio: {
      ...library.focusRadio,
      stations: library.focusRadio.stations.map((station) =>
        station.id === stationId ? { ...station, orderKey: newOrderKey } : station,
      ),
    },
  };
}

export function updateFocusRadioPlayback(
  library: Library,
  patch: FocusRadioPlaybackPatch,
): Library {
  const current = library.focusRadio.playback;
  const playback = {
    ...current,
    ...patch,
  };

  if (patch.volume !== undefined) {
    playback.volume = Math.min(1, Math.max(0, patch.volume));
  }

  if (patch.stationId !== undefined && patch.stationId !== null) {
    const exists = library.focusRadio.stations.some((station) => station.id === patch.stationId);
    if (!exists) {
      playback.stationId = current.stationId;
    }
  }

  const playbackUnchanged =
    playback.playing === current.playing &&
    playback.stationId === current.stationId &&
    playback.volume === current.volume &&
    playback.muted === current.muted;

  if (playbackUnchanged && patch.playing !== true) {
    return library;
  }

  const nextLibrary = {
    ...library,
    focusRadio: {
      ...library.focusRadio,
      playback,
    },
  };

  if (patch.playing === true) {
    return clearCanvasNowPlayingDismiss(nextLibrary);
  }

  return nextLibrary;
}
