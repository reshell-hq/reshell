# Plan 013: Music tool (YouTube)

> **Executor instructions**: Follow step by step, run every verification command, honor STOP conditions, update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 38ba3a9..HEAD -- lib/override/ hooks/use-reshell-state.tsx` — plan 007 must be DONE.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MEDIUM
- **Depends on**: plans/007
- **Category**: feature
- **Planned at**: commit `38ba3a9`, 2026-06-21

## Why this matters

The music tool is the YouTube-only half of yeti's focus radio (the Icecast/stream player is explicitly out of scope). It is **global**: one config station list, one playback state in a global override, kept playing across workspace switches. Provides the `nowPlaying` data plan 014's widget needs.

## Current state

After 007: `config.music.stations` defines stations (YouTube urls + label/icon); `OverrideState` is per-workspace + reserves room for global state. No player. yeti's `focus-radio/youtube.ts` (url → videoId) + `focus-radio-youtube-player.tsx` (IFrame API loader, hidden audio-only) are the reference; drop everything `stream`/Icecast/proxy.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Tests | `npm test` | all pass |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope:**

- `lib/music/youtube.ts` (create) — port `parseYoutubeVideoId(url)` for all forms (`watch?v=`, `youtu.be`, `/live`, `/embed`, `/shorts`, `music.youtube.com`); add `parseYoutubePlaylistId(url)` (`list=`) so playlist stations are supported.
- `lib/music/types.ts` (create) — `MusicPlayback`: `stationId`, `volume` (0–100), `muted`, `playing`.
- Extend `OverrideState` with a global `music?: MusicPlayback` (NOT per-workspace).
- `lib/music/youtube-iframe.ts` (create) — module-level cached loader for the YouTube IFrame API (port yeti's promise cache).
- `components/personal/youtube-player.tsx` (create) — hidden, audio-only `YT.Player` (controls:0, autoplay:0), driven by an effect that reacts to `{ videoId/playlistId, playing, volume, muted }` (port yeti's one-way sync). Mounted once near the shell root so it persists across workspace switches.
- `hooks/use-music.ts` (create) — reads global playback, exposes `play/pause/next/prev/setVolume/toggleMute/selectStation`, persisting to the global override.
- `components/personal/music-slot.tsx` (create) — right-edge `Shell.Slot` (handle = note glyph / current station): station list (config), play/pause, next/prev, volume, current station.
- `app/page.tsx` — mount `<YoutubePlayer />` (root-level) + `<MusicSlot />` (right edge); fill command-center now-playing status + command-bar music verbs.
- `lib/music/__tests__/youtube.test.ts` (create) — port + extend videoId/playlist parsing tests.
- `plans/README.md` — status row only.

**Out of scope:**

- Icecast/MP3 stream stations, the `/api/focus-radio/stream` proxy, SSRF handling — all dropped (YouTube-only).
- Web Audio analyser/visualizer (the `nowPlaying` widget in 014 can be static/simple).
- Media Session / OS controls (nice-to-have; defer).

## Steps

### Step 1: URL parsing

- Port `parseYoutubeVideoId`; add playlist parsing. A station resolves to either a video id or a playlist id.

**Verify**: `youtube.test.ts` — every url form; playlist extraction; non-YouTube/invalid → null.

### Step 2: Global playback state

- Extend `OverrideState.music`. Default when absent: first config station, volume 70, not muted, not playing. The global override is independent of `activeWorkspaceId` and survives workspace switches.

### Step 3: IFrame player

- Cached API loader; hidden 1×1/offscreen player. An effect loads/cues the video or playlist and applies play/pause/volume/mute from state. Guard for the API not-yet-ready and autoplay restrictions (first user gesture).

### Step 4: Hook + slot + wiring

- `useMusic()` persists to global override; `MusicSlot` controls it. Wire now-playing status + command-bar verbs (`play`, `pause`, `next station`).

**Verify**: `npm run dev` — select a station, play (audio only, no visible video); switch workspaces — music keeps playing; volume/mute/next persist; playlist station advances tracks.

## Test plan

- Unit: `youtube.test.ts`.
- Manual: audio-only playback; persists across workspace switch + reload; playlist support; volume/mute.

## Done criteria

- [ ] YouTube url parsing (video + playlist) ported + tested.
- [ ] Global `MusicPlayback` in the override; hidden audio-only player persists across workspace switches.
- [ ] Right-edge music slot: station list + transport + volume.
- [ ] Now-playing status + command-bar music verbs wired.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` exit 0.
- [ ] `plans/README.md` row 013 → DONE.

## Commits (Conventional Commits — commit per atomic change; see README Conventions)

- `feat(music): add youtube url + playlist parsing`
- `test(music): cover url parsing`
- `feat(music): add global playback override and IFrame loader`
- `feat(music): add hidden audio-only youtube player`
- `feat(music): add useMusic, music slot, and wiring`

## Modularity & styling (ADR-0009)

- `lib/music/*` is pure/tested and barrel-exported. `useMusic`/`MusicSlot`/`YoutubePlayer` are app-decoupled; playback persists only via the (global) override interface.
- shadcn primitives for transport/volume controls; Tailwind utilities; no global CSS.

## Skill passes (see README → Skill workflow)

- **improve**: `improve review-plan plans/013-music-tool.md` before starting.
- **impeccable** (UI = the music slot only): `impeccable polish "music slot"` before the final commit — station list, transport, and volume affordances; current-station clarity. The hidden player + parsing have no impeccable pass.
- **ponytail (full)**: YouTube-only; drop everything stream/Icecast/proxy from yeti. Reuse yeti's url parser + IFrame loader rather than rewriting. No analyser/visualizer unless a later plan needs it. Pre-commit: `ponytail-review` the diff.

## STOP conditions

- The hidden player remounts/stops on workspace switch (because it's nested under per-workspace render) — STOP and hoist it to a stable root above workspace-dependent subtrees; persistence across switches is a hard requirement.

## Maintenance notes

- Music is the one **global** override slice — don't key it by workspace.
- `nowPlaying` (plan 014) reads `useMusic()` state; keep its shape stable.
