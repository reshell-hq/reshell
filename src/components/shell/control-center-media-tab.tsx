"use client";

import { useState } from "react";
import { resolveFocusRadioNowPlaying } from "@/focus-radio/playback";
import {
  buildFocusRadioStationPickerRows,
  isFocusRadioStationCatalogEmpty,
} from "@/focus-radio/station-picker";
import { updateFocusRadioPlayback } from "@/focus-radio/stations";
import { useMutateLibrary } from "@/hooks/use-library";
import type { Library } from "@/library/types";
import { useConfigStore } from "@/store/config-store";
import { useFocusRadioPlayback } from "./focus-radio-playback-context";

type ControlCenterMediaTabProps = {
  library: Library;
};

export function ControlCenterMediaTab({ library }: ControlCenterMediaTabProps) {
  const openSection = useConfigStore((state) => state.openSection);
  const { playbackError, retryPlayback } = useFocusRadioPlayback();
  const mutateLibrary = useMutateLibrary();
  const [query, setQuery] = useState("");
  const catalogEmpty = isFocusRadioStationCatalogEmpty(library);
  const rows = buildFocusRadioStationPickerRows(library, query);
  const playback = library.focusRadio.playback;
  const nowPlaying = resolveFocusRadioNowPlaying(library);

  function patchPlayback(patch: Parameters<typeof updateFocusRadioPlayback>[1]) {
    mutateLibrary.mutate((current) => updateFocusRadioPlayback(current, patch));
  }

  function handleSelectStation(stationId: string) {
    patchPlayback({ stationId });
  }

  function handleTogglePlay() {
    if (!nowPlaying) {
      const firstStation = rows[0];
      if (!firstStation) {
        return;
      }
      patchPlayback({ stationId: firstStation.id, playing: true });
      return;
    }

    patchPlayback({ playing: !playback.playing });
  }

  function handleVolumeChange(volume: number) {
    patchPlayback({ volume, muted: false });
  }

  function handleToggleMute() {
    patchPlayback({ muted: !playback.muted });
  }

  if (catalogEmpty) {
    return (
      <div className="shell-dashboard-media-empty">
        <p className="shell-dashboard-placeholder">
          Add focus radio stations in settings to start listening.
        </p>
        <button
          type="button"
          className="shell-dashboard-setup-button"
          onClick={() => openSection("focusRadio")}
        >
          Open focus radio settings
        </button>
      </div>
    );
  }

  return (
    <div className="shell-dashboard-media">
      {nowPlaying ? (
        <div className="shell-dashboard-media-now-playing">
          {nowPlaying.imageUrl ? (
            <img
              src={nowPlaying.imageUrl}
              alt=""
              className="shell-dashboard-media-now-playing-artwork"
            />
          ) : (
            <span
              className="shell-dashboard-media-now-playing-artwork shell-dashboard-media-artwork-fallback"
              aria-hidden
            >
              {nowPlaying.label.slice(0, 1)}
            </span>
          )}
          <div className="shell-dashboard-media-now-playing-meta">
            <p className="shell-dashboard-media-now-playing-label">{nowPlaying.label}</p>
            <p className="shell-dashboard-media-now-playing-kind">{nowPlaying.kind}</p>
          </div>
        </div>
      ) : null}

      {playbackError ? (
        <div className="shell-dashboard-media-error">
          <p>{playbackError}</p>
          <button type="button" className="shell-dashboard-setup-button" onClick={retryPlayback}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="shell-dashboard-media-controls">
        <button
          type="button"
          className="shell-dashboard-media-play"
          onClick={handleTogglePlay}
          disabled={!nowPlaying && rows.length === 0}
          aria-label={playback.playing ? "Pause" : "Play"}
        >
          {playback.playing ? "Pause" : "Play"}
        </button>

        <label className="shell-dashboard-media-volume">
          <span className="shell-dashboard-media-volume-label">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={playback.volume}
            onChange={(event) => handleVolumeChange(Number(event.target.value))}
            aria-label="Volume"
          />
        </label>

        <button
          type="button"
          className="shell-dashboard-media-mute"
          onClick={handleToggleMute}
          aria-pressed={playback.muted}
          aria-label={playback.muted ? "Unmute" : "Mute"}
        >
          {playback.muted ? "Unmute" : "Mute"}
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search stations"
        aria-label="Filter stations"
        className="shell-dashboard-media-search-input"
      />

      <ul className="shell-dashboard-media-list">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              className={`shell-dashboard-media-row${row.active ? " active" : ""}`}
              onClick={() => handleSelectStation(row.id)}
              aria-current={row.active ? "true" : undefined}
            >
              {row.imageUrl ? (
                <img src={row.imageUrl} alt="" className="shell-dashboard-media-artwork" />
              ) : (
                <span
                  className="shell-dashboard-media-artwork shell-dashboard-media-artwork-fallback"
                  aria-hidden
                >
                  {row.label.slice(0, 1)}
                </span>
              )}
              <span className="shell-dashboard-media-label">{row.label}</span>
              {row.favorite ? (
                <span className="shell-dashboard-media-favorite" aria-label="Favorite">
                  ★
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
