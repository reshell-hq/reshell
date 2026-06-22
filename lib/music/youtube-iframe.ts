/**
 * Module-level cached loader for the YouTube IFrame Player API. The API is a
 * global singleton with one `onYouTubeIframeAPIReady` callback, so we inject the
 * script once and memoise the ready promise — every player awaits the same one.
 *
 * Minimal hand-written types (the slice we use) instead of pulling in
 * `@types/youtube` (ponytail: a tiny surface, not the whole API; upgrade path is
 * the real types package if we ever need more methods).
 */

const SCRIPT_ID = "youtube-iframe-api";
const SCRIPT_SRC = "https://www.youtube.com/iframe_api";

export type YoutubePlayerVars = {
  controls?: 0 | 1;
  autoplay?: 0 | 1;
  disablekb?: 0 | 1;
  modestbranding?: 0 | 1;
  playsinline?: 0 | 1;
  rel?: 0 | 1;
  listType?: "playlist";
  list?: string;
};

export type YoutubePlayerOptions = {
  videoId?: string;
  width?: string | number;
  height?: string | number;
  playerVars?: YoutubePlayerVars;
  events?: {
    onReady?: () => void;
  };
};

/** The slice of the IFrame player API the hidden player actually drives. */
export type YoutubePlayer = {
  loadVideoById(id: string): void;
  cueVideoById(id: string): void;
  loadPlaylist(options: { list: string; listType: "playlist" }): void;
  cuePlaylist(options: { list: string; listType: "playlist" }): void;
  playVideo(): void;
  pauseVideo(): void;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
};

type YoutubePlayerConstructor = new (
  container: HTMLElement | string,
  options: YoutubePlayerOptions,
) => YoutubePlayer;

type YoutubeApi = { Player: YoutubePlayerConstructor };

declare global {
  interface Window {
    YT?: YoutubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YoutubeApi> | null = null;

/**
 * Resolve the loaded `YT` API, injecting the script on first call. Client-only
 * (the returned promise never settles on the server, which never calls it).
 */
export function loadYoutubeIframeApi(): Promise<YoutubeApi> {
  if (apiPromise) {
    return apiPromise;
  }
  apiPromise = new Promise<YoutubeApi>((resolve) => {
    if (typeof window === "undefined") {
      return;
    }
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    // Chain any prior callback so we never clobber another consumer's hook.
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) {
        resolve(window.YT);
      }
    };
    if (!document.getElementById(SCRIPT_ID)) {
      const tag = document.createElement("script");
      tag.id = SCRIPT_ID;
      tag.src = SCRIPT_SRC;
      document.head.appendChild(tag);
    }
  });
  return apiPromise;
}
