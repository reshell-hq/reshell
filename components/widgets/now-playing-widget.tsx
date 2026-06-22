"use client";

import { useMusic } from "@/hooks/use-music";

/**
 * Ambient now-playing readout (CONTEXT: "Canvas widget"). Read-only mirror of
 * the global music tool (plan 013): the station icon, its label, and a pulsing
 * accent dot. Renders nothing unless something is actually playing, so an
 * untouched station never shows dead.
 */
export function NowPlayingWidget() {
  const { station, isPlaying } = useMusic();

  if (!isPlaying || !station) {
    return null;
  }

  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden className="text-base leading-none">
        {station.icon ?? "♪"}
      </span>
      <span
        aria-hidden
        className="size-1.5 animate-pulse rounded-full"
        style={{ background: "var(--scene-accent, var(--primary))" }}
      />
      <span className="flex flex-col leading-tight">
        <span className="text-[0.6875rem] font-semibold tracking-wide uppercase opacity-60">
          Now playing
        </span>
        <span className="text-sm font-medium">{station.label}</span>
      </span>
    </div>
  );
}
