# Plan 006: Shell simplification (same behavior, fewer lines)

> **Executor instructions**: Follow this plan step by step. After every step run `npm test` (must stay green) and **eyeball the demo** (`npm run dev`) before moving on. Each step is a separate, revertible commit. If anything in "STOP conditions" occurs, stop and report — do not improvise. When done, update the status row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 2b9e551..HEAD -- components/shell/ lib/shell/ hooks/`
> On unexpected mismatch → STOP. (Note: `app/demo-slots.tsx` has uncommitted local edits at planning time — that is expected.)

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (Phases 1–3 LOW, Phase 4 HIGH)
- **Depends on**: plans 001–005 (all DONE)
- **Category**: tech-debt / refactor
- **Planned at**: commit `2b9e551`, 2026-06-20

## Goal

Make the shell a **robust, lightweight, clean** component with the **same functionality and fewer lines**. Pure refactor: no feature is removed.

### Hard constraints (resolved with stakeholder)

1. **Public API frozen.** `<Shell>`, `<Shell.Edge side>`, `<Shell.Slot id handle handleLabel Handle>`, `<Shell.Content>`, the `theme` prop, and the headless-handle contract stay byte-for-byte identical.
2. **Demo frozen as the oracle.** `app/page.tsx`, `app/demo-slots.tsx`, `components/shell/search-slot.tsx` are not changed (the unchanged demo is what gets eyeballed). *Exception:* Phase 4 may **temporarily** add a second slot to one edge to exercise morph, then revert before committing.
3. **Verification per step:** `npm test` green **and** eyeball the demo. No new test deps required.
4. **Keep the boundary:** `lib/shell/` stays pure geometry (no React, unit-tested); `components/shell/` stays the React layer. Internal file structure within each side is free to change.
5. **No behavior/timing changes** except the explicitly-approved Phase 4 (kill the per-frame React re-render).

## Baseline (commit `2b9e551`)

- `lib/shell/`: 16 modules, ~784 source lines (+250 test) — many are 10–20-line single-function files.
- `components/shell/`: 13 files, 1086 lines.
- `hooks/use-shell-animation.ts`: 106 lines.
- Tests: 24 passing, all pure-geometry.

## Eyeball checklist (run after every step)

Open `npm run dev` and confirm all still work:

- [ ] Hover top (◔), left (☰), right (⚙ square handle) handles → slot opens after a beat; leaving closes after a beat.
- [ ] Click a handle → pins open; click again → closes. Escape closes. Tab to a handle (focus) → opens immediately; blur closes.
- [ ] Bottom **search** edge: minimised sliver until you hover the rim near bottom-center; typing filters fruit; the results list grows the notch **upward**; input keeps focus while typing (pin holds).
- [ ] Notch reveal: content zooms from tiny → full out of the edge on first open (not popped in full-size).
- [ ] Rim corners look circular (not stretched); resize the window → rim + open notch stay correct.
- [ ] Minimised edges: bottom rim hugs the screen edge (no handle), the other three keep their gutter.
- [ ] Theme: frame = `--muted`, canvas = `--background`; the canvas/shell boundary follows the notch as it opens.
- [ ] `prefers-reduced-motion: reduce` (toggle in OS/devtools) → notch snaps instead of animating.

## Commands

| Purpose | Command | Expected |
|---------|---------|----------|
| Tests | `npm test` | 24+ pass |
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Build | `npm run build` | exit 0 |
| Dev (eyeball) | `npm run dev` | demo behaves per checklist |

---

## Phase 1 — Consolidate pure-geometry `lib` (LOW risk)

Tests prove correctness here, so this is the safest, highest-clutter-win step.

Merge the many tiny number-math modules into **`lib/shell/geometry.ts`**:

- `perimeter.ts` (`cornerInset`, `getEdgeSpan`)
- `anchors.ts` (`anchorPositions`)
- `active-notch.ts` (`getSlotAnchor`)
- `bounds.ts` (`shellBoundsForViewport`)
- `clamp.ts` (`clampExtent` + helpers)
- `map-content-size.ts` (`contentSizeToExtent`)
- `scale.ts` (`pixelsToViewBox`, `pixelsToViewBoxWithScreen`)

Merge the CSS-builder modules into **`lib/shell/css.ts`**:

- `coordinates.ts` (`anchorHitZoneStyle`, `notchContentStyle`, `revealContentStyle`)
- `handle-position.ts` (`handleStyle`)
- `viewbox-to-css.ts` (`transformOriginForEdge`)

Fold **`easing.ts`** (`lerp`, `isSettled`) into **`animation.ts`** (its only consumer).

Keep `types.ts`, `constants.ts`, `notch.ts`, `theme.ts`, `animation.ts`.

Result: `lib/shell` 16 → ~6 files. Re-export nothing; update every importer (`shell-context`, hook, slot, handle, portal, frame) and the test imports to the new paths. Consolidate the `__tests__` files to match (e.g. `geometry.test.ts`, `css.test.ts`, keep `notch.test.ts`) — keep every existing assertion.

**Verify**: `npm test` green, `npx tsc --noEmit` exit 0, eyeball once.

**STOP if**: any test changes value (not just import path). The geometry must be identical.

---

## Phase 2 — Trim trivial component glue (LOW risk)

- Inline `shell-overlay.tsx` (24 lines) — fold the overlay `<div>` into `ShellSurface`/`ShellFrame` and the `setOverlayElement` callback ref; delete the file and the `ShellOverlayMount` wrapper in `shell.tsx`.
- `shell-content.tsx`: drop the stale `TODO(plan-003)` comment; leave behavior as-is.
- Remove any now-dead exports/imports surfaced by Phase 1.
- Tidy redundant comments (keep only intent-bearing ones).

**Verify**: `npm test` green, eyeball.

---

## Phase 3 — Slim the context (behavior-identical, LOW–MED risk)

`shell-context.tsx` is 457 lines doing three jobs. Split without changing behavior:

1. **`use-slot-activation.ts`** (new hook): the interaction state machine — `activeSlotId`, hover open/close timers (`HOVER_OPEN_DELAY_MS`/`HOVER_CLOSE_DELAY_MS`), `pinnedRef`, and `hoverEnter/hoverLeave/focusOpen/toggleSlot/pinActive/unpinActive/closeActive`. Keep timings and the exact pin/toggle logic.
2. **Geometry selectors**: `getAnchor`, `getSlotExtent`, `getMinSlotExtent`, `extentFromPixelSize`, `pixelSizeToViewBox` — move into `lib/shell/geometry.ts` as pure functions taking `(bounds, slot, sizes, svg)`; the provider wraps them as thin memoized callbacks (or expose `bounds`+`slots`+`sizes` and let consumers call the pure selectors). Prefer the latter if it removes more lines.
3. The provider becomes a thin assembler: registries (`slots`, `slotContentSizes`, gutters→bounds), theme, viewport, and the composed pieces above.

Keep the `useShell` / `useShellEdge` context contract the same (minus the two fields removed in Phase 4).

**Verify**: `npm test` green; eyeball the **full** checklist (this touches activation).

**STOP if**: hover open/close feels different (cascade opens, flicker, stuck-open) — the timer logic was copied wrong.

---

## Phase 4 — Ref-driven animation: kill the per-frame re-render (HIGH risk, isolated)

**Why**: today the rAF loop in `use-shell-animation` writes the SVG `d` directly **and** calls `setAnimatedNotch`/`setAnimatedProgress` every frame, re-rendering the whole provider subtree ~60fps. `animatedNotch`/`animatedProgress` are consumed **only** by `shell-slot-portal.tsx`. Move portal positioning to the same rAF loop via refs and the per-frame React churn disappears.

**Target design**: React owns **discrete** state (active slot, registrations, viewport); a single rAF loop owns **continuous** geometry (rim path + portal clip + portal inner scale) via direct DOM writes.

Steps:

1. Remove `animatedNotch`, `animatedProgress`, `setAnimatedNotch`, `setAnimatedProgress` from context and its memo deps.
2. Context exposes ref setters the portal registers with on mount: `setPortalRefs(clipEl, innerEl, edge)` / clears on unmount. The animation engine holds these in a ref (no state).
3. The rAF render loop (per frame) computes the frame and writes:
   - rim `d` (visible + fill paths) — unchanged;
   - portal clip element style from `notchContentStyle(bounds, notch)` (+ `panelColor`);
   - portal inner element transform from `revealContentStyle(edge, progress)`.
   Write via `element.style` directly; do **not** setState.
4. **Mount/unmount lifecycle** (the only React state changes): portal mounts whenever `activeSlotId === slotId` (discrete). On close, the controller animates progress→0; when it **settles closed**, it fires a single `onClosed` callback → provider clears the closing slot → portal unmounts. (One setState on open path via `activeSlotId`, one on settle-closed. No per-frame setState.)
5. Keep `reducedMotion` snap behavior: `snapTo` then write styles once.
6. Keep the resize/bounds repaint effect, but have it also re-position the live portal (call the same per-frame writer once).

**Verify (do all)**:

- Full eyeball checklist.
- **Temporarily** add a second `<Shell.Slot>` to one edge (e.g. a second top slot) in `app/page.tsx`/`demo-slots.tsx` and confirm: same-edge hop **morphs** (notch slides between the two handles while staying open) and a top→left hop **collapses then grows**. Then **revert** that temporary edit before committing.
- Performance sanity: React DevTools Profiler shows the provider no longer re-renders every frame while a notch animates.

**STOP if**:

- Portal content lags/jumps relative to the rim (clip and `d` are written in different frames — ensure both happen in the **same** loop tick, rim first or together).
- Portal fails to unmount after close (the settle→`onClosed` callback never fires — check the controller's settled branch at `progress===0`).
- Search input loses focus on open/close (the mount/unmount churn changed) — STOP, this is the classic regression.

---

## Phase 5 — Docs

- **ADR-0006**: record the ref-driven animation decision (React = discrete state, rAF = continuous geometry; a future reader will be tempted to "simplify" it back into `setState`-per-frame — qualifies as hard-to-reverse + surprising + a real trade-off).
- Update any ADR/comment references to moved files (e.g. `coordinates.ts` → `css.ts`, `scale.ts` → `geometry.ts`).
- `CONTEXT.md`: no change (no new domain terms — glossary only).
- `plans/README.md`: add row 006 → DONE.

## Done criteria

- [ ] `lib/shell` consolidated to ~6 files, pure/React boundary intact.
- [ ] `shell-context` no longer owns the activation state machine or per-frame animation state.
- [ ] No `setState` on the animation hot path (verified in Profiler).
- [ ] Public API + demo behavior byte-for-byte unchanged; full eyeball checklist passes.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all exit 0.
- [ ] Measurable line reduction vs baseline (target: meaningfully fewer than ~1976 source lines) with no lost functionality.
- [ ] ADR-0006 written; `plans/README.md` row 006 → DONE.

## STOP conditions (global)

- Any step turns a test red and the fix isn't a pure import repoint → STOP.
- Any checklist behavior changes and isn't restored within 2 attempts → STOP and report with the specific behavior + suspected step.
- Phase 4 morph/cross-edge can't be made to work after the rewrite → revert Phase 4 only (Phases 1–3 still ship) and report.
