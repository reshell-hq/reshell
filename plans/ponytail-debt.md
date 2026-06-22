# Ponytail debt ledger

Every deliberate shortcut marked with a `ponytail:` comment in the codebase,
harvested by plan 017. Each is a *conscious* simplification (laziest thing that
works) with a named ceiling and an upgrade path — not a bug. Review an entry
when its ceiling is actually hit; until then, leaving it alone is correct.

Generated at commit `a50a252`. Re-run `rg -n "ponytail:" --glob '!plans/**'` to
refresh after changes.

| # | Location | Shortcut | Ceiling | Upgrade path |
|---|----------|----------|---------|--------------|
| 1 | `lib/override/store.ts:36` | Shallow shape guard on persisted override (checks `workspaces` is an object), not full validation. | A hand-corrupted-but-valid-JSON value could carry junk fields that pass through. | A zod `OverrideState` schema + versioned migration; the `reshell.override.v1` key suffix already reserves room. |
| 2 | `lib/state/effective.ts:21` | Shallow per-widget merge — override toggles win, other widgets fall through from config. | Only correct while `widgets` is a flat map (it is). | A deep-merge helper if a nested per-widget override field ever appears. |
| 3 | `lib/command/fuzzy.ts:8` | Minimal subsequence ranker — no tokenisation, frequency/recency weighting, or typo tolerance. | Fine for a few dozen workspaces + bookmarks; degrades for a large index. | Swap `score` for a real matcher (Fzf/Fuse) behind the same `rank(query, entries)` signature — callers never see the algorithm. |
| 4 | `lib/bookmarks/link-display.ts:26` | Favicons via Google's S2 endpoint (a zero-config default). | Sends the bookmarked host to a Google endpoint. | Swap the provider in this one function for a privacy-respecting or self-hosted favicon source. |
| 5 | `lib/music/youtube.ts:92` | Video-first station resolution — a `watch?v=…&list=…` link plays just the video. | Can't express "play the playlist of a watch+list URL". | A per-station `playAs: "video" \| "playlist"` field. |
| 6 | `lib/music/youtube-iframe.ts:7` | Hand-written types for just the slice of the YouTube IFrame API we drive. | Only the methods/vars we use are typed. | Pull in `@types/youtube` if more of the API is ever needed. |
| 7 | `components/personal/youtube-player.tsx:17` | No Web Audio analyser, Media Session, or teardown — one permanent mount for the app's lifetime. | Assumes exactly one, never-unmounted player instance. | Add a teardown path if the player ever becomes conditional/multi-instance. |
| 8 | `lib/timer/pomodoro.ts:105` | `pause` clears `endsAt` rather than banking elapsed time; `resume` re-arms the full interval. | No true mid-interval pause/resume. | Persist remaining seconds on pause and offset `endsAt` from it on resume. |
| 9 | `lib/timer/chime.ts:5` | End-of-interval chime is a single oscillator + gain envelope, not an audio engine. | One fixed tone; no-ops when the AudioContext is blocked. | A richer synth or a bundled audio asset if a configurable chime is wanted. |
| 10 | `hooks/use-timer.ts:39` | A single module variable dedupes the audible chime across the timer's several mounts. | Fine for a single tab; would not dedupe across tabs. | A dedicated single-mount timer engine. |
| 11 | `lib/tasks/types.ts:20` / `lib/tasks/tasks.ts:120` | Integer `order` keys, swapped by `moveTask`, instead of fractional keys. | Correct for a local single-user list; not for concurrent/remote reordering. | Fractional order keys if concurrent/remote reordering lands. |
| 12 | `hooks/use-clock.ts:31` | A bad IANA `timezone` in config silently falls back to the local zone. | A typo'd zone reads as local instead of erroring. | Validate the zone in the config schema so a bad value fails loud at load. |
| 13 | `components/personal/command-center-slot.tsx:215` | `cycleWorkspace` is the only key bound outside the command bar (besides Escape). | No general key-routing surface. | The command bar (plan 010) is the command surface; extend there, not with more global bindings. |
| 14 | `components/personal/workspace-edges.tsx:12` | `top` stays in the bookmark-edge union even though it collides with the command-center handle at top-centre. | A top bookmark group's handle overlaps the command-center handle (the shell distributes anchors within one edge, not across the separate `Shell.Edge`s). | Merge same-edge `Shell.Edge`s, or add cross-edge handle-collision avoidance in the shell geometry (see follow-up plan 018). |
| 15 | `components/personal/timer-slot.tsx:214` | The timer-handle clock is a hand-drawn SVG. | The curated icon pack (plan 015) ships no clock/timer glyph, and a wrong-meaning substitute would read worse. | Route through `<Icon value="timer">` once the registry gains a clock — one import + one entry in `lib/icons`. |

## How to use this ledger

- These are the **known, accepted** shortcuts. Don't "fix" one speculatively;
  upgrade only when its ceiling is reached by a real requirement.
- When you do upgrade one, delete its `ponytail:` comment and its row here.
- New `ponytail:` comments added in future work belong in this table — re-run
  the harvest grep before a release (see plan 017 maintenance notes).
