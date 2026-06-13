import type { FocusRadioPlayback } from "@/focus-radio/types";
import { resolveFocusRadioOutputVolume } from "@/focus-radio/playback";

export type YoutubePlayerInstance = {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  setSize: (width: number, height: number) => void;
  destroy: () => void;
};

export function syncFocusRadioYoutubePlayer(
  player: YoutubePlayerInstance,
  options: {
    videoId: string | null;
    shouldPlay: boolean;
    playback: FocusRadioPlayback;
    loadedVideoIdRef: { current: string | null };
  },
): void {
  const outputVolume = resolveFocusRadioOutputVolume(options.playback);
  player.setVolume(Math.round(outputVolume * 100));
  if (options.playback.muted || outputVolume === 0) {
    player.mute();
  } else {
    player.unMute();
  }

  if (!options.videoId) {
    options.loadedVideoIdRef.current = null;
    player.pauseVideo();
    return;
  }

  if (options.loadedVideoIdRef.current !== options.videoId) {
    options.loadedVideoIdRef.current = options.videoId;
    player.loadVideoById(options.videoId);
  }

  if (options.shouldPlay) {
    player.playVideo();
    return;
  }

  player.pauseVideo();
}
