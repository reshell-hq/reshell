"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMusic } from "@/hooks/use-music";
import { loadYoutubeIframeApi, type YoutubePlayer as YtPlayer } from "@/lib/music";

/**
 * The hidden, audio-only YouTube player (CONTEXT: "Tool"). It renders no
 * controls — playback is driven one-way by `useMusic` state through an effect
 * (state → player), never the reverse. App-decoupled (ADR-0009): it only reads
 * the hook and the pure `lib/music` loader.
 *
 * MOUNTING: mount this ONCE near the shell root, above any per-workspace
 * subtree, so it never remounts on a workspace switch — that is what keeps
 * music playing across switches (plan 013 STOP condition).
 *
 * ponytail: no Web Audio analyser, no Media Session, no destroy/teardown — the
 * single permanent mount lives for the app's lifetime. Ceiling — it assumes one
 * player instance; upgrade path is a teardown if it ever becomes conditional.
 */
export function YoutubePlayer() {
  const { source, isPlaying, playback } = useMusic();

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const readyRef = useRef(false);
  const lastSourceKeyRef = useRef<string | null>(null);

  // Latest desired state, read inside async callbacks (onReady) without
  // re-subscribing. Seeded at mount and refreshed by the sync effect below
  // (updating a ref during render is disallowed).
  const desiredRef = useRef({
    source,
    isPlaying,
    volume: playback.volume,
    muted: playback.muted,
  });

  const applyDesired = useCallback(() => {
    const player = playerRef.current;
    if (!player || !readyRef.current) {
      return;
    }
    const { source: src, isPlaying: playing, volume, muted } = desiredRef.current;

    player.setVolume(volume);
    if (muted) {
      player.mute();
    } else {
      player.unMute();
    }

    const key = src ? `${src.kind}:${src.id}` : null;
    if (key !== lastSourceKeyRef.current) {
      lastSourceKeyRef.current = key;
      if (!src) {
        player.pauseVideo();
        return;
      }
      // load* autoplays (the user's play/select click is the gesture YouTube
      // requires); cue* arms without playing.
      if (src.kind === "video") {
        if (playing) {
          player.loadVideoById(src.id);
        } else {
          player.cueVideoById(src.id);
        }
      } else {
        const options = { list: src.id, listType: "playlist" as const };
        if (playing) {
          player.loadPlaylist(options);
        } else {
          player.cuePlaylist(options);
        }
      }
      return;
    }

    // Same source — reconcile transport only.
    if (!src) {
      player.pauseVideo();
    } else if (playing) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, []);

  // Create the player once. The cancelled flag guards the async race that React
  // StrictMode's double-invoke would otherwise turn into two players.
  useEffect(() => {
    let cancelled = false;
    loadYoutubeIframeApi().then((YT) => {
      if (cancelled || playerRef.current || !containerRef.current) {
        return;
      }
      playerRef.current = new YT.Player(containerRef.current, {
        width: "0",
        height: "0",
        playerVars: {
          controls: 0,
          autoplay: 0,
          disablekb: 1,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            readyRef.current = true;
            applyDesired();
          },
        },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [applyDesired]);

  // One-way state → player sync on every relevant change.
  useEffect(() => {
    desiredRef.current = { source, isPlaying, volume: playback.volume, muted: playback.muted };
    applyDesired();
  }, [applyDesired, source, isPlaying, playback.volume, playback.muted]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 h-0 w-0 overflow-hidden opacity-0"
    >
      {/* YT replaces this element with its iframe; the wrapper keeps it offscreen. */}
      <div ref={containerRef} />
    </div>
  );
}
