import type { Library } from "@/library/types";
import { createDefaultFocusRadio } from "./config";
import { createStarterFocusRadio } from "./starter-stations";

export function ensureLibraryFocusRadio(library: Library): Library {
  if (!("focusRadio" in library) || !library.focusRadio) {
    return {
      ...library,
      focusRadio: createStarterFocusRadio(),
    };
  }

  if (library.focusRadio.stations.length === 0) {
    return {
      ...library,
      focusRadio: {
        ...createStarterFocusRadio(),
        playback: library.focusRadio.playback,
      },
    };
  }

  return library;
}
