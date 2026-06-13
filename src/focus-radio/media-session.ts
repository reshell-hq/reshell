import type { FocusRadioNowPlaying } from "./playback";

// MediaMetadata is browser-only; tests avoid calling syncFocusRadioMediaSession.

export type ExternalMediaGlance = {
  title: string;
  artworkUrl?: string;
};

export type MediaSessionMetadataLike = {
  title?: string | null;
  artwork?: ReadonlyArray<{ src: string }>;
};

export function externalMediaGlancesEqual(
  left: ExternalMediaGlance | null,
  right: ExternalMediaGlance | null,
): boolean {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return left.title === right.title && left.artworkUrl === right.artworkUrl;
}

export function resolveExternalMediaGlance(
  sessionMetadata: MediaSessionMetadataLike | null,
  nowPlaying: FocusRadioNowPlaying | null,
): ExternalMediaGlance | null {
  const title = sessionMetadata?.title?.trim();
  if (!title) {
    return null;
  }

  if (nowPlaying && title === nowPlaying.label) {
    return null;
  }

  return {
    title,
    artworkUrl: sessionMetadata?.artwork?.[0]?.src,
  };
}

export function shouldAutoPauseFocusRadioForExternalGlance(
  focusRadioPlaying: boolean,
  externalGlance: ExternalMediaGlance | null,
): boolean {
  return focusRadioPlaying && externalGlance !== null;
}

export function shouldResumeFocusRadioAfterExternalGlance(
  wasPlayingBeforeExternal: boolean,
  externalGlance: ExternalMediaGlance | null,
): boolean {
  return wasPlayingBeforeExternal && externalGlance === null;
}

export type ExternalMediaKey = "MediaTrackPrevious" | "MediaPlayPause" | "MediaTrackNext";

export function dispatchExternalMediaKey(key: ExternalMediaKey): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: key,
      key,
      bubbles: true,
    }),
  );
}

export function syncFocusRadioMediaSession(
  nowPlaying: FocusRadioNowPlaying | null,
  playing: boolean,
): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
    return;
  }

  if (!nowPlaying || !playing) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
    return;
  }

  navigator.mediaSession.metadata = new MediaMetadata({
    title: nowPlaying.label,
    artwork: nowPlaying.imageUrl ? [{ src: nowPlaying.imageUrl }] : [],
  });
  navigator.mediaSession.playbackState = "playing";
}
