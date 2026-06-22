"use client";

import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useMusic, type UseMusic } from "@/hooks/use-music";

// The third tool slot (CONTEXT: "Tool"): a fixed RIGHT-edge fixture, sibling to
// the timer and tasks. Slot id distinct from the timer (`timer`), tasks
// (`tasks`), bookmark slots (`bm:*`), command center (`command-center`), and
// command bar (`command`). Music itself is global, but its control surface is a
// per-edge slot like the others.
const SLOT_ID = "music";

/**
 * Right-edge music tool. The wrapper owns the single `useMusic` instance and
 * feeds a stateless panel, which `Shell.Slot` renders twice (offscreen measurer
 * + portal); identical props keep both copies in sync. App-decoupled
 * (ADR-0009): every read/write goes through the hook. The audio itself plays
 * from `<YoutubePlayer />` mounted at the shell root — this slot is only the UI.
 */
export function MusicSlot() {
  const music = useMusic();

  return (
    <Shell.Edge side="right">
      <Shell.Slot
        id={SLOT_ID}
        handleLabel="Music"
        handle={<MusicHandle playing={music.isPlaying} />}
      >
        <MusicPanel music={music} />
      </Shell.Slot>
    </Shell.Edge>
  );
}

/** Gutter affordance: a music-note glyph, tinted when something is playing. */
function MusicHandle({ playing }: { playing: boolean }) {
  return <NoteGlyph className={playing ? "text-primary" : undefined} />;
}

function MusicPanel({ music }: { music: UseMusic }) {
  const {
    stations,
    station,
    isPlaying,
    playback,
    play,
    pause,
    next,
    prev,
    setVolume,
    toggleMute,
    selectStation,
  } = music;
  const hasStations = stations.length > 0;

  return (
    <section
      aria-label="Music"
      className="flex w-72 flex-col gap-4 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl"
    >
      <header className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Music
        </p>
        <span className="truncate text-sm text-foreground" title={station?.label}>
          {station?.label ?? "No stations"}
        </span>
      </header>

      {hasStations ? (
        <>
          <ul className="flex flex-col gap-1">
            {stations.map((item) => {
              const active = item.id === playback.stationId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectStation(item.id)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/60"
                    }`}
                  >
                    <span aria-hidden className="w-4 shrink-0 text-center">
                      {item.icon ?? "♪"}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && isPlaying ? (
                      <span className="text-[0.6875rem] font-medium tracking-wide text-primary uppercase">
                        Playing
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label="Previous station"
              disabled={stations.length < 2}
              onClick={prev}
            >
              <StepGlyph direction="prev" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="default"
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={isPlaying ? pause : play}
            >
              {isPlaying ? <PauseGlyph /> : <PlayGlyph />}
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label="Next station"
              disabled={stations.length < 2}
              onClick={next}
            >
              <StepGlyph direction="next" />
            </Button>
          </div>

          <div className="flex items-center gap-2 border-t border-border pt-3">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-pressed={playback.muted}
              aria-label={playback.muted ? "Unmute" : "Mute"}
              onClick={toggleMute}
            >
              <VolumeGlyph muted={playback.muted} />
            </Button>
            <Slider
              aria-label="Volume"
              value={playback.volume}
              onValueChange={(value) =>
                setVolume(typeof value === "number" ? value : value[0])
              }
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="w-8 text-right font-mono text-xs tabular-nums text-muted-foreground">
              {playback.muted ? "—" : playback.volume}
            </span>
          </div>
        </>
      ) : (
        <p className="px-1 py-1.5 text-sm text-muted-foreground">
          No stations configured. Add some to{" "}
          <code className="font-mono text-xs">config.music.stations</code>.
        </p>
      )}
    </section>
  );
}

function NoteGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 12.5V4l7-1.5V11" />
      <circle cx="4.25" cy="12.5" r="1.75" />
      <circle cx="11.25" cy="11" r="1.75" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
      <path d="M5 3.5v9l7.5-4.5z" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
      <rect x="4.5" y="3.5" width="2.5" height="9" rx="0.5" />
      <rect x="9" y="3.5" width="2.5" height="9" rx="0.5" />
    </svg>
  );
}

function StepGlyph({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 ${direction === "prev" ? "rotate-180" : ""}`}
      fill="currentColor"
    >
      <path d="M4 3.5v9l6-4.5z" />
      <rect x="10.5" y="3.5" width="1.75" height="9" rx="0.5" />
    </svg>
  );
}

function VolumeGlyph({ muted }: { muted: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6v4h2.5L9 13V3L5.5 6z" fill="currentColor" stroke="none" />
      {muted ? (
        <path d="M11 6l3 4M14 6l-3 4" />
      ) : (
        <path d="M11 5.5a3.5 3.5 0 010 5M12.5 3.5a6 6 0 010 9" />
      )}
    </svg>
  );
}
