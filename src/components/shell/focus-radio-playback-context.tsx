"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  resolveFocusRadioNowPlaying,
  resolveFocusRadioOutputVolume,
  resolveFocusRadioStreamPlaybackUrl,
  shouldPlayFocusRadioStream,
  shouldPlayFocusRadioYoutube,
} from "@/focus-radio/playback";
import type { ExternalMediaGlance } from "@/focus-radio/media-session";
import {
  dispatchExternalMediaKey,
  externalMediaGlancesEqual,
  resolveExternalMediaGlance,
  shouldAutoPauseFocusRadioForExternalGlance,
  shouldResumeFocusRadioAfterExternalGlance,
  syncFocusRadioMediaSession,
} from "@/focus-radio/media-session";
import { parseYoutubeVideoId } from "@/focus-radio/youtube";
import {
  FOCUS_RADIO_STREAM_RETRY_MS,
  resolveFocusRadioStreamFailureAction,
} from "@/focus-radio/stream-fallback";
import { updateFocusRadioPlayback } from "@/focus-radio/stations";
import { useMutateLibrary } from "@/hooks/use-library";
import {
  registerChimePlaybackDucker,
  unregisterChimePlaybackDucker,
} from "@/internal-tools/chime-audio";
import type { Library } from "@/library/types";
import { FocusRadioYoutubePlayer } from "./focus-radio-youtube-player";
import type { YoutubePlayerInstance } from "@/focus-radio/youtube-player-sync";

type FocusRadioPlaybackContextValue = {
  playbackError: string | null;
  retryPlayback: () => void;
  externalGlance: ExternalMediaGlance | null;
  dispatchExternalMediaKey: typeof dispatchExternalMediaKey;
  getStreamAnalyser: () => AnalyserNode | null;
  streamVisualizerActive: boolean;
  setCanvasYoutubePlayerMounted: (mounted: boolean) => void;
  reportPlaybackFailure: () => void;
  registerYoutubePlayer: (player: YoutubePlayerInstance | null) => void;
};

const FocusRadioPlaybackContext = createContext<FocusRadioPlaybackContextValue | null>(null);

export function useFocusRadioPlayback() {
  const context = useContext(FocusRadioPlaybackContext);
  if (!context) {
    throw new Error("useFocusRadioPlayback must be used within FocusRadioPlaybackProvider");
  }

  return context;
}

type FocusRadioPlaybackProviderProps = {
  library: Library;
  children: ReactNode;
};

export function FocusRadioPlaybackProvider({ library, children }: FocusRadioPlaybackProviderProps) {
  const mutateLibrary = useMutateLibrary();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedUrlRef = useRef<string | null>(null);
  const retriedCurrentRef = useRef(false);
  const playbackFailedRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const libraryRef = useRef(library);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const elementSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const wasPlayingBeforeExternalRef = useRef(false);
  const youtubePlayerRef = useRef<YoutubePlayerInstance | null>(null);
  const [canvasYoutubePlayerMounted, setCanvasYoutubePlayerMounted] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [externalGlance, setExternalGlance] = useState<ExternalMediaGlance | null>(null);
  const externalGlanceRef = useRef<ExternalMediaGlance | null>(null);
  const nowPlayingRef = useRef<ReturnType<typeof resolveFocusRadioNowPlaying>>(null);

  libraryRef.current = library;

  useEffect(() => {
    registerChimePlaybackDucker(() => {
      const currentLibrary = libraryRef.current;
      const currentPlayback = currentLibrary.focusRadio.playback;
      const normalVolume = resolveFocusRadioOutputVolume(currentPlayback);
      const duckedVolume = normalVolume * 0.12;

      const audio = audioRef.current;
      if (audio && shouldPlayFocusRadioStream(currentLibrary)) {
        audio.volume = duckedVolume;
      }

      const youtubePlayer = youtubePlayerRef.current;
      if (youtubePlayer && shouldPlayFocusRadioYoutube(currentLibrary)) {
        youtubePlayer.setVolume(Math.round(duckedVolume * 100));
      }

      return () => {
        const restoredVolume = resolveFocusRadioOutputVolume(
          libraryRef.current.focusRadio.playback,
        );
        if (audio) {
          audio.volume = restoredVolume;
        }
        if (youtubePlayer) {
          youtubePlayer.setVolume(Math.round(restoredVolume * 100));
        }
      };
    });

    return () => unregisterChimePlaybackDucker();
  }, []);

  const playback = library.focusRadio.playback;
  const nowPlaying = resolveFocusRadioNowPlaying(library);
  nowPlayingRef.current = nowPlaying;
  const shouldPlayStream = shouldPlayFocusRadioStream(library);
  const shouldPlayYoutube = shouldPlayFocusRadioYoutube(library);
  const streamPlaybackUrl = resolveFocusRadioStreamPlaybackUrl(library);
  const youtubeVideoId =
    nowPlaying?.kind === "youtube" ? parseYoutubeVideoId(nowPlaying.url) : null;
  const activeStationId = playback.stationId;

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const attemptPlayRef = useRef<() => void>(() => {});
  const handleStreamFailureRef = useRef<() => void>(() => {});

  const teardownStreamAnalyser = useCallback(() => {
    elementSourceRef.current?.disconnect();
    elementSourceRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;

    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context && context.state !== "closed") {
      void context.close();
    }
  }, []);

  const ensureStreamAnalyser = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (analyserRef.current) {
      void audioContextRef.current?.resume();
      return;
    }

    try {
      const context = new AudioContext();
      audioContextRef.current = context;

      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.12;
      analyser.minDecibels = -85;
      analyser.maxDecibels = -10;

      const source = context.createMediaElementSource(audio);
      elementSourceRef.current = source;
      source.connect(analyser);
      analyser.connect(context.destination);
      analyserRef.current = analyser;
      void context.resume();
    } catch {
      teardownStreamAnalyser();
    }
  }, [teardownStreamAnalyser]);

  const markPlaybackFailed = useCallback(() => {
    playbackFailedRef.current = true;
    setPlaybackError("Unable to play this station. Try again or choose another.");

    const audio = audioRef.current;
    if (audio) {
      loadedUrlRef.current = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    mutateLibrary.mutate((current) => {
      if (!current.focusRadio.playback.playing) {
        return current;
      }

      return updateFocusRadioPlayback(current, { playing: false });
    });
  }, [mutateLibrary]);

  attemptPlayRef.current = () => {
    if (playbackFailedRef.current) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    void audio
      .play()
      .then(() => {
        ensureStreamAnalyser();
        void audioContextRef.current?.resume();
      })
      .catch(() => {
        handleStreamFailureRef.current();
      });
  };

  const handleStreamFailure = useCallback(() => {
    if (playbackFailedRef.current) {
      return;
    }

    const currentLibrary = libraryRef.current;
    const stationId = currentLibrary.focusRadio.playback.stationId;
    if (!stationId) {
      return;
    }

    const action = resolveFocusRadioStreamFailureAction(retriedCurrentRef.current);

    if (action.type === "retry") {
      retriedCurrentRef.current = true;
      setPlaybackError(null);
      clearRetryTimer();
      retryTimerRef.current = setTimeout(() => {
        if (playbackFailedRef.current) {
          return;
        }

        const currentNowPlaying = resolveFocusRadioNowPlaying(libraryRef.current);

        if (currentNowPlaying?.kind === "stream") {
          const audio = audioRef.current;
          if (!audio) {
            return;
          }

          audio.load();
          attemptPlayRef.current();
          return;
        }

        if (currentNowPlaying?.kind === "youtube") {
          youtubePlayerRef.current?.playVideo();
        }
      }, FOCUS_RADIO_STREAM_RETRY_MS);
      return;
    }

    clearRetryTimer();
    markPlaybackFailed();
  }, [clearRetryTimer, markPlaybackFailed]);

  handleStreamFailureRef.current = handleStreamFailure;

  const retryPlayback = useCallback(() => {
    retriedCurrentRef.current = false;
    playbackFailedRef.current = false;
    setPlaybackError(null);
    mutateLibrary.mutate((current) => updateFocusRadioPlayback(current, { playing: true }));
  }, [mutateLibrary]);

  useEffect(() => {
    retriedCurrentRef.current = false;
    playbackFailedRef.current = false;
    setPlaybackError(null);
    clearRetryTimer();
  }, [activeStationId, clearRetryTimer, streamPlaybackUrl]);

  useEffect(() => {
    return () => {
      teardownStreamAnalyser();
    };
  }, [teardownStreamAnalyser]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const onError = () => {
      handleStreamFailure();
    };

    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("error", onError);
      clearRetryTimer();
    };
  }, [clearRetryTimer, handleStreamFailure]);

  useEffect(() => {
    syncFocusRadioMediaSession(nowPlaying, playback.playing);

    if (!("mediaSession" in navigator)) {
      return;
    }

    function handlePlay() {
      mutateLibrary.mutate((current) => updateFocusRadioPlayback(current, { playing: true }));
    }

    function handlePause() {
      mutateLibrary.mutate((current) => updateFocusRadioPlayback(current, { playing: false }));
    }

    navigator.mediaSession.setActionHandler("play", handlePlay);
    navigator.mediaSession.setActionHandler("pause", handlePause);

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
    };
  }, [mutateLibrary, nowPlaying, playback.playing]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return;
    }

    function refreshExternalGlance() {
      const glance = resolveExternalMediaGlance(
        navigator.mediaSession.metadata,
        nowPlayingRef.current,
      );

      if (!externalMediaGlancesEqual(externalGlanceRef.current, glance)) {
        externalGlanceRef.current = glance;
        setExternalGlance(glance);
      }

      const currentLibrary = libraryRef.current;
      const focusRadioPlaying = currentLibrary.focusRadio.playback.playing;

      if (shouldAutoPauseFocusRadioForExternalGlance(focusRadioPlaying, glance)) {
        wasPlayingBeforeExternalRef.current = true;
        mutateLibrary.mutate((current) => {
          if (!current.focusRadio.playback.playing) {
            return current;
          }

          return updateFocusRadioPlayback(current, { playing: false });
        });
        return;
      }

      if (shouldResumeFocusRadioAfterExternalGlance(wasPlayingBeforeExternalRef.current, glance)) {
        wasPlayingBeforeExternalRef.current = false;
        mutateLibrary.mutate((current) => {
          if (current.focusRadio.playback.playing) {
            return current;
          }

          return updateFocusRadioPlayback(current, { playing: true });
        });
      }
    }

    const timer = window.setInterval(refreshExternalGlance, 1500);
    return () => window.clearInterval(timer);
  }, [mutateLibrary]);

  const getStreamAnalyser = useCallback(() => analyserRef.current, []);

  const registerYoutubePlayer = useCallback((player: YoutubePlayerInstance | null) => {
    youtubePlayerRef.current = player;
  }, []);

  const reportPlaybackFailureRef = useRef(handleStreamFailure);
  reportPlaybackFailureRef.current = handleStreamFailure;

  const reportPlaybackFailure = useCallback(() => {
    reportPlaybackFailureRef.current();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = resolveFocusRadioOutputVolume(playback);

    if (!streamPlaybackUrl) {
      loadedUrlRef.current = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    if (loadedUrlRef.current !== streamPlaybackUrl) {
      loadedUrlRef.current = streamPlaybackUrl;
      audio.src = streamPlaybackUrl;
      audio.load();
    }

    if (shouldPlayStream && !playbackFailedRef.current) {
      attemptPlayRef.current();
      return;
    }

    audio.pause();
  }, [playback.muted, playback.volume, shouldPlayStream, streamPlaybackUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamPlaybackUrl) {
      return;
    }

    let retryTimer: ReturnType<typeof setInterval> | null = null;

    const handlePlaying = () => {
      ensureStreamAnalyser();
      if (analyserRef.current || retryTimer) {
        return;
      }

      let attempts = 0;
      retryTimer = setInterval(() => {
        attempts += 1;
        ensureStreamAnalyser();
        if ((analyserRef.current || attempts >= 12) && retryTimer) {
          clearInterval(retryTimer);
          retryTimer = null;
        }
      }, 250);
    };

    audio.addEventListener("playing", handlePlaying);
    return () => {
      audio.removeEventListener("playing", handlePlaying);
      if (retryTimer) {
        clearInterval(retryTimer);
      }
    };
  }, [ensureStreamAnalyser, streamPlaybackUrl]);

  return (
    <FocusRadioPlaybackContext
      value={{
        playbackError,
        retryPlayback,
        externalGlance,
        dispatchExternalMediaKey,
        getStreamAnalyser,
        streamVisualizerActive: shouldPlayStream,
        setCanvasYoutubePlayerMounted,
        reportPlaybackFailure,
        registerYoutubePlayer,
      }}
    >
      <audio ref={audioRef} className="shell-focus-radio-audio" aria-hidden />
      {youtubeVideoId && !canvasYoutubePlayerMounted ? (
        <FocusRadioYoutubePlayer
          videoId={youtubeVideoId}
          shouldPlay={shouldPlayYoutube}
          playback={playback}
          presentation="hidden"
          onError={handleStreamFailure}
          onPlayerReady={registerYoutubePlayer}
        />
      ) : null}
      {children}
    </FocusRadioPlaybackContext>
  );
}
