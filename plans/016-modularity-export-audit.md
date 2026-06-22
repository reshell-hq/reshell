# Plan 016: Modularity & export-surface audit

> **Executor instructions**: This is the final pass. It is an audit + cleanup, not new features. Read the **Conventions** section in `plans/README.md` and ADR-0009 first. Honor STOP conditions. Update `plans/README.md` when done.
>
> **Drift check (run first)**: confirm plans 007–015 are DONE in `plans/README.md`.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/007–015
- **Category**: hardening
- **Planned at**: commit `38ba3a9`, 2026-06-21

## Why this matters

This repo will be added as a **git submodule** to the main reshell-workspace and its components imported to build the paid tiers (standard, pro, team). That only works if the code is genuinely modular, app-decoupled, cleanly exported, and free of the monolithic-CSS / over-engineering problems that sank the previous attempt (ADR-0009). This plan verifies all of that holds end-to-end and fixes what doesn't.

## Current state

After 007–015: the full personal edition runs. Components and pure-logic modules exist across `lib/**` and `components/**`, ideally already exporting barrels. This plan makes the export surface and the constraints **enforced**, not aspirational.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Tests | `npm test` | all pass |
| Lint | `npm run lint` | exit 0 |
| Find global CSS bloat | `Grep` for rules in `app/globals.css` | tokens/resets only |
| Find app coupling | `Grep` for `from "@/app` / `next/` in `lib/**` + `components/**` | none in importable units |
| Find direct persistence | `Grep` for `localStorage` outside `lib/override/` | none in components |

## Scope

**In scope:**

- **Public export surface**: ensure each feature has a barrel — `lib/<feature>/index.ts` and `components/personal/index.ts` (+ `components/widgets/index.ts`, `components/scenes/index.ts`, `components/icon/index.ts`). Create a top-level `index.ts` (or `src/index.ts` if a `src` root is preferred) re-exporting the supported public API: `ReshellProvider`, hooks (`useReshellState`, `useTimer`, `useTasks`, `useMusic`, `useClock`), slot components, scenes + registry, `<Icon>`, and the public types (`ReshellConfig`, etc.). Document what is public vs internal.
- **App-decoupling audit**: no importable unit imports from `app/` or depends on Next page internals. Fix violations (lift shared code into `lib/`/`components/`).
- **Persistence-injectability audit**: components never touch `localStorage` directly; all of it goes through the plan-007 store interface. Confirm a consumer could provide an alternate store (sketch/verify the seam; a paid tier swaps localStorage for a backend).
- **Styling audit**: `app/globals.css` contains only tokens/`@theme`/resets — no component styles. Component CSS is colocated (CSS Modules) or utility classes. shadcn primitives used for form controls (`components/ui/`).
- **Over-engineering sweep**: remove dead flexibility, single-use abstractions, and indirection without a second caller. Prefer stdlib/native/shadcn. Note anything deliberately deferred.
- **`AGENTS.md`**: add a short "Personal edition" module map + an "Importing as a submodule" note describing the public API and the constraints.
- **README.md** (repo root): document config authoring + how to consume the package from the workspace.
- `plans/README.md` — status row only.

**Out of scope:**

- New features or visual redesigns.
- Publishing to npm / versioning (the consumer uses it as a submodule, not a registry package) — unless the workspace later asks for it.

## Steps

### Step 1: Barrels + public API

- Add/clean per-feature barrels and a single top-level entry exporting the public surface. Mark internals (don't export them). Verify a sample external-style import path resolves and typechecks.

### Step 2: Decoupling audits

- Run the greps above. For each violation: app-coupling → lift into `lib`/`components`; stray `localStorage` → route through the store interface. Re-run build/tests after each fix and commit per fix.

### Step 3: Styling audit

- Inspect `app/globals.css`; move any component rules into colocated modules. Confirm shadcn primitives are used (not hand-rolled inputs/buttons/dialogs/switches).

### Step 4: Over-engineering sweep

- Walk `lib/**` + `components/**`; delete/inline speculative abstractions. Keep changes behavior-preserving (tests stay green).

### Step 5: Docs

- Update `AGENTS.md` (module map + submodule import note) and root `README.md` (config authoring + consumption).

**Verify**: full `npm run build` + `npm test` + `npx tsc --noEmit` + `npm run lint` green; the public barrel imports cleanly; greps come back clean.

## Commits (Conventional Commits)

- `refactor(*): add per-feature export barrels`
- `feat(build): expose public API entry point`
- `refactor(state): route persistence through the store interface`
- `style(*): move component CSS out of globals into colocated modules`
- `refactor(*): remove single-use abstractions` (as found)
- `docs: document submodule import surface and config authoring`

## Modularity & styling

This whole plan *is* the modularity/styling enforcement. Outcome: a consumer in the reshell-workspace can `import { TimerSlot, useTimer, scenes, Icon } from "<submodule>"` and compose paid tiers without dragging in `app/` or a global stylesheet, and without forking to swap persistence.

## Test plan

- Greps return clean (no app coupling, no stray localStorage, no global component CSS).
- A scratch import from the top-level barrel typechecks and tree-shakes.
- Full quality gate green.

## Done criteria

- [ ] Per-feature barrels + a documented top-level public API entry exist.
- [ ] No importable unit depends on `app/` or Next page internals.
- [ ] No component calls `localStorage` directly; persistence is behind the store interface (swappable).
- [ ] `app/globals.css` is tokens/resets only; component CSS is colocated; shadcn used for primitives.
- [ ] Over-engineering sweep done; deferred items noted.
- [ ] `AGENTS.md` + root `README.md` document the import surface and config authoring.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` exit 0.
- [ ] `plans/README.md` row 016 → DONE.

## Skill passes (see README → Skill workflow)

- **improve**: `improve review-plan plans/016-modularity-export-audit.md` before starting; this plan's audits pair naturally with `improve`'s tech-debt/architecture lens.
- **ponytail**: this plan *is* a ponytail pass — use `ponytail-review` on each cleanup diff. (The whole-repo `ponytail-audit` runs in plan 017.)
- **impeccable**: none — no new UI here.

## STOP conditions

- Decoupling requires a large architectural change (a feature is deeply tangled with `app/`) — STOP and report with a proposed refactor rather than a rushed extraction.
- The public API can't be exported without circular imports — STOP, report the cycle, and propose where to break it.

## Maintenance notes

- The top-level barrel is the contract with the workspace: changing an exported name is a breaking change, not a free refactor.
- Re-run the greps in CI or before each release to keep the constraints from regressing.
