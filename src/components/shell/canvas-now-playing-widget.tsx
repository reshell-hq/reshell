"use client";

import { useLayoutEffect } from "react";
import {
  dismissCanvasNowPlaying,
  shouldShowCanvasNowPlayingWidget,
} from "@/canvas-widgets/now-playing";
import { resolveFocusRadioNowPlaying } from "@/focus-radio/playback";
import { updateFocusRadioPlayback } from "@/focus-radio/stations";
import { parseYoutubeVideoId } from "@/focus-radio/youtube";
import { useLibrary, useMutateLibrary } from "@/hooks/use-library";
import type { Workspace } from "@/library/types";
import { CanvasNowPlayingVisualizer } from "./canvas-now-playing-visualizer";
import { useFocusRadioPlayback } from "./focus-radio-playback-context";
import { FocusRadioYoutubePlayer } from "./focus-radio-youtube-player";

type CanvasNowPlayingWidgetProps = {
  workspace: Workspace;
};

export function CanvasNowPlayingWidget({ workspace }: CanvasNowPlayingWidgetProps) {
  const { data: library } = useLibrary();
  const mutateLibrary = useMutateLibrary();
  const {
    getStreamAnalyser,
    setCanvasYoutubePlayerMounted,
    reportPlaybackFailure,
    registerYoutubePlayer,
  } = useFocusRadioPlayback();

  const nowPlaying = library ? resolveFocusRadioNowPlaying(library) : null;
  const showWidget =
    library !== undefined && library !== null && shouldShowCanvasNowPlayingWidget(workspace, library);
  const showYoutubeVideo = showWidget && nowPlaying?.kind === "youtube";
  const youtubeVideoId =
    showYoutubeVideo && nowPlaying ? parseYoutubeVideoId(nowPlaying.url) : null;

  useLayoutEffect(() => {
    setCanvasYoutubePlayerMounted(showYoutubeVideo);
    return () => {
      setCanvasYoutubePlayerMounted(false);
    };
  }, [setCanvasYoutubePlayerMounted, showYoutubeVideo]);

  if (!library || !showWidget || !nowPlaying) {
    return null;
  }

  const playing = library.focusRadio.playback.playing;

  function patchPlayback(patch: Parameters<typeof updateFocusRadioPlayback>[1]) {
    mutateLibrary.mutate((current) => updateFocusRadioPlayback(current, patch));
  }

  function handleTogglePlay() {
    patchPlayback({ playing: !playing });
  }

  function handleDismiss() {
    mutateLibrary.mutate((current) => dismissCanvasNowPlaying(current, workspace.id));
  }

  return (
    <div className="canvas-now-playing">
      <div className="canvas-now-playing-header">
        <div className="canvas-now-playing-meta">
          {nowPlaying.imageUrl ? (
            <img src={nowPlaying.imageUrl} alt="" className="canvas-now-playing-artwork" />
          ) : (
            <span
              className="canvas-now-playing-artwork canvas-now-playing-artwork-fallback"
              aria-hidden
            >
              {nowPlaying.label.slice(0, 1)}
            </span>
          )}
          <div className="canvas-now-playing-copy">
            <p className="canvas-now-playing-label">{nowPlaying.label}</p>
            <p className="canvas-now-playing-kind">{nowPlaying.kind}</p>
          </div>
        </div>
        <div className="canvas-now-playing-icon-actions">
          <button
            type="button"
            className="canvas-now-playing-icon-btn"
            onClick={handleTogglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg viewBox="0 0 16 16" aria-hidden>
                <rect x="3.5" y="2.5" width="3" height="11" rx="0.75" fill="currentColor" />
                <rect x="9.5" y="2.5" width="3" height="11" rx="0.75" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden>
                <path d="M4 2.8 12.5 8 4 13.2Z" fill="currentColor" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="canvas-now-playing-icon-btn"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <svg viewBox="0 0 16 16" aria-hidden>
              <path
                d="M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
      {showYoutubeVideo && youtubeVideoId ? (
        <FocusRadioYoutubePlayer
          videoId={youtubeVideoId}
          shouldPlay={playing}
          playback={library.focusRadio.playback}
          presentation="inline"
          onError={reportPlaybackFailure}
          onPlayerReady={registerYoutubePlayer}
        />
      ) : (
        <CanvasNowPlayingVisualizer active={playing} getAnalyser={getStreamAnalyser} />
      )}
    </div>
  );
}
