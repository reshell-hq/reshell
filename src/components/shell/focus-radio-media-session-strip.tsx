"use client";

import type { ExternalMediaGlance } from "@/focus-radio/media-session";

type FocusRadioMediaSessionStripProps = {
  glance: ExternalMediaGlance;
  onPrevious: () => void;
  onPlayPause: () => void;
  onNext: () => void;
};

export function FocusRadioMediaSessionStrip({
  glance,
  onPrevious,
  onPlayPause,
  onNext,
}: FocusRadioMediaSessionStripProps) {
  return (
    <div className="shell-dashboard-media-session-strip">
      {glance.artworkUrl ? (
        <img src={glance.artworkUrl} alt="" className="shell-dashboard-media-session-artwork" />
      ) : (
        <span
          className="shell-dashboard-media-session-artwork shell-dashboard-media-artwork-fallback"
          aria-hidden
        >
          {glance.title.slice(0, 1)}
        </span>
      )}
      <p className="shell-dashboard-media-session-title">{glance.title}</p>
      <div className="shell-dashboard-media-session-transport">
        <button
          type="button"
          className="shell-dashboard-media-session-btn"
          onClick={onPrevious}
          aria-label="Previous track"
        >
          Prev
        </button>
        <button
          type="button"
          className="shell-dashboard-media-session-btn"
          onClick={onPlayPause}
          aria-label="Play or pause"
        >
          Play
        </button>
        <button
          type="button"
          className="shell-dashboard-media-session-btn"
          onClick={onNext}
          aria-label="Next track"
        >
          Next
        </button>
      </div>
    </div>
  );
}
