"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FocusRadioPlayback } from "@/focus-radio/types";
import {
  syncFocusRadioYoutubePlayer,
  type YoutubePlayerInstance,
} from "@/focus-radio/youtube-player-sync";

type YoutubePlayerConstructor = new (
  elementId: string,
  options: {
    height: string;
    width: string;
    videoId?: string;
    playerVars?: { autoplay?: 0 | 1; controls?: 0 | 1 };
    events?: {
      onError?: () => void;
      onReady?: (event: { target: YoutubePlayerInstance }) => void;
    };
  },
) => YoutubePlayerInstance;

type YoutubeApi = {
  Player: YoutubePlayerConstructor;
};

declare global {
  interface Window {
    YT?: YoutubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YoutubeApi> | null = null;

function loadYoutubeApi(): Promise<YoutubeApi> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        if (window.YT?.Player) {
          resolve(window.YT);
        }
      };

      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.append(script);
    });
  }

  return youtubeApiPromise;
}

const HIDDEN_PLAYER_WIDTH = 640;
const HIDDEN_PLAYER_HEIGHT = 360;

function resolvePlayerDimensions(
  presentation: FocusRadioYoutubePlayerProps["presentation"],
  container: HTMLDivElement | null,
): { width: string; height: string } {
  if (presentation === "inline" && container) {
    const width = Math.max(240, container.clientWidth || 0);
    const height = Math.max(135, container.clientHeight || Math.round(width * (9 / 16)));
    return { width: String(width), height: String(height) };
  }

  return { width: String(HIDDEN_PLAYER_WIDTH), height: String(HIDDEN_PLAYER_HEIGHT) };
}

export type FocusRadioYoutubePlayerProps = {
  videoId: string | null;
  shouldPlay: boolean;
  playback: FocusRadioPlayback;
  presentation?: "hidden" | "inline";
  onError: () => void;
  onPlayerReady?: (player: YoutubePlayerInstance) => void;
};

export function FocusRadioYoutubePlayer({
  videoId,
  shouldPlay,
  playback,
  presentation = "hidden",
  onError,
  onPlayerReady,
}: FocusRadioYoutubePlayerProps) {
  const elementId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YoutubePlayerInstance | null>(null);
  const loadedVideoIdRef = useRef<string | null>(null);
  const onErrorRef = useRef(onError);
  const onPlayerReadyRef = useRef(onPlayerReady);
  const playbackRef = useRef(playback);
  const shouldPlayRef = useRef(shouldPlay);
  const videoIdRef = useRef(videoId);
  const presentationRef = useRef(presentation);
  const [playerReady, setPlayerReady] = useState(false);

  onErrorRef.current = onError;
  onPlayerReadyRef.current = onPlayerReady;
  playbackRef.current = playback;
  shouldPlayRef.current = shouldPlay;
  videoIdRef.current = videoId;
  presentationRef.current = presentation;

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const createPlayer = (api: YoutubeApi) => {
      if (cancelled) {
        return;
      }

      const dimensions = resolvePlayerDimensions(presentationRef.current, containerRef.current);
      playerRef.current = new api.Player(elementId, {
        height: dimensions.height,
        width: dimensions.width,
        playerVars: { autoplay: 0, controls: 0 },
        events: {
          onError: () => {
            onErrorRef.current();
          },
          onReady: (event) => {
            setPlayerReady(true);
            onPlayerReadyRef.current?.(event.target);
            syncFocusRadioYoutubePlayer(event.target, {
              videoId: videoIdRef.current,
              shouldPlay: shouldPlayRef.current,
              playback: playbackRef.current,
              loadedVideoIdRef,
            });
          },
        },
      });
    };

    const initPlayer = (api: YoutubeApi) => {
      const container = containerRef.current;
      if (
        presentationRef.current === "inline" &&
        container &&
        (container.clientWidth === 0 || container.clientHeight === 0)
      ) {
        resizeObserver = new ResizeObserver(() => {
          const currentContainer = containerRef.current;
          if (!currentContainer || currentContainer.clientWidth === 0) {
            return;
          }

          resizeObserver?.disconnect();
          resizeObserver = null;
          createPlayer(api);
        });
        resizeObserver.observe(container);
        return;
      }

      createPlayer(api);
    };

    void loadYoutubeApi().then((api) => {
      initPlayer(api);
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      setPlayerReady(false);
      playerRef.current?.destroy();
      playerRef.current = null;
      loadedVideoIdRef.current = null;
    };
  }, [elementId, presentation]);

  useEffect(() => {
    if (!playerReady) {
      return;
    }

    const player = playerRef.current;
    if (!player) {
      return;
    }

    syncFocusRadioYoutubePlayer(player, {
      videoId,
      shouldPlay,
      playback,
      loadedVideoIdRef,
    });
  }, [playback, playerReady, shouldPlay, videoId]);

  useEffect(() => {
    const container = containerRef.current;
    const player = playerRef.current;
    if (!container || !player || presentation !== "inline") {
      return;
    }

    const resizePlayer = () => {
      const width = Math.max(240, container.clientWidth);
      const height = Math.max(135, container.clientHeight || Math.round(width * (9 / 16)));
      player.setSize(width, height);
    };

    resizePlayer();

    const observer = new ResizeObserver(resizePlayer);
    observer.observe(container);
    return () => observer.disconnect();
  }, [playerReady, presentation]);

  return (
    <div
      ref={containerRef}
      className={
        presentation === "inline"
          ? "canvas-now-playing-video-host"
          : "shell-focus-radio-youtube shell-focus-radio-youtube--hidden"
      }
      aria-hidden={presentation === "hidden" ? true : undefined}
    >
      <div id={elementId} />
    </div>
  );
}
