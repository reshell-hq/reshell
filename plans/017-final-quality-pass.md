# Plan 017: Final quality pass (improve · ponytail-audit · impeccable polish)

> **Executor instructions**: This is the last plan — a holistic, skill-driven quality pass over the finished personal edition. It is audit + targeted cleanup/polish, not new features. Read the **Skill workflow** and **Conventions** in `plans/README.md` first. Honor STOP conditions. Update `plans/README.md` when done.
>
> **Drift check (run first)**: confirm plans 007–016 are DONE in `plans/README.md`.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/007–016
- **Category**: hardening / polish
- **Planned at**: commit `38ba3a9`, 2026-06-21

## Why this matters

The whole point of this build was to avoid the previous attempt's failure modes (monolithic CSS, over-engineering) and to ship something clean, modular, and visually impeccable that the paid tiers can build on. This plan runs the three skills at whole-repo scope one final time, turns their findings into small fixes, and records what was deliberately deferred. After this, the repo is release-ready as a submodule.

## Current state

After 016: full personal edition, modular export surface, decoupled persistence, colocated styling. Per-plan skill passes already ran locally; this is the cross-cutting sweep that catches what per-plan passes missed.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Tests | `npm test` | all pass |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope:**

- **`improve` (deep, read-only)**: run an `improve deep` audit over the whole repo (correctness, security, performance, test coverage, tech debt, DX, docs, direction). It writes findings to `plans/` only — it does not edit code. Triage the table; turn HIGH-leverage, in-scope items into small fixes here, and record genuinely-new larger items as follow-up plans (018+) rather than cramming them in.
- **`ponytail-audit` (whole-repo)**: run the over-engineering audit across the codebase. Apply the clear deletions/simplifications (reinvented stdlib, dead flexibility, single-use abstractions) as small `refactor`/`style` commits, each `ponytail-review`-clean. Target net-negative lines.
- **`ponytail-debt`**: harvest every `ponytail:` comment into a debt ledger (`plans/ponytail-debt.md` or a section in `plans/README.md`) so deferred shortcuts + their upgrade paths are tracked, not forgotten.
- **`impeccable polish`/`audit` (whole UI)**: a final pass over the home station + all four scenes + every slot — contrast, typography, spacing/rhythm, motion + `prefers-reduced-motion`, responsive behavior, empty/error/loading states, the AI-slop test, and the absolute bans. Apply fixes as `style`/`fix` commits. Use `impeccable harden` for edge cases/error states if gaps remain.
- **Quality gate**: full `npm run build` + `npm test` + `npx tsc --noEmit` + `npm run lint` green after every change.
- `plans/README.md` — status row + any 018+ follow-up rows the audits surface.

**Out of scope:**

- Large new features or redesigns surfaced by the audits — capture as 018+ plans, don't build here.
- Re-litigating settled ADR decisions (config-over-IndexedDB, scenes-bundle-look+layout, etc.) — those are by-design, not findings.

## Steps

### Step 1: improve deep audit

- Run `improve deep`. Review the findings table; vet each against the ADRs (settled tradeoffs are not findings). Pick the high-leverage, low-risk, in-scope fixes for this plan; defer the rest to 018+.

### Step 2: ponytail-audit + apply

- Run `ponytail-audit`. Apply clear cuts as small commits; `ponytail-review` each diff. Don't simplify away validation at trust boundaries, error handling, a11y, or anything an ADR mandates (e.g. the persistence interface seam — keep it even though OSS only uses localStorage).

### Step 3: ponytail-debt ledger

- Harvest `ponytail:` comments into the ledger with file:line, the ceiling, and the upgrade path.

### Step 4: impeccable polish

- Polish/audit the full UI. Fix contrast/motion/responsive/empty-state issues. Re-verify each scene passes the slop test and the bans.

### Step 5: Final gate + docs

- All quality commands green. Update `plans/README.md` (this row → DONE; add any 018+ rows). Confirm the public barrel still imports cleanly (no regressions from cleanup).

## Commits (Conventional Commits)

- `refactor: apply ponytail-audit simplifications` (split into small per-area commits)
- `fix: address improve audit findings (<area>)`
- `style: impeccable polish pass on <surface>`
- `docs(plans): add ponytail-debt ledger and 018+ follow-ups`

## Skill passes (see README → Skill workflow)

This plan *is* the skill passes, at whole-repo scope: `improve deep`, `ponytail-audit` + `ponytail-debt`, `impeccable polish`/`audit`/`harden`. `improve` stays read-only (writes only to `plans/`); ponytail + impeccable findings become small commits.

## Modularity & styling (ADR-0009)

- Cleanups must not break the public export surface (a renamed export is a breaking change for the workspace). Re-verify the top-level barrel after the sweep.
- Any CSS touched moves toward colocated/utility; nothing migrates back into `globals.css`.

## Test plan

- Full quality gate green after each change.
- Spot-check the public barrel import still typechecks.
- Manual UI pass per `impeccable` findings.

## Done criteria

- [ ] `improve deep` audit run; high-leverage in-scope findings fixed, the rest captured as 018+ plans.
- [ ] `ponytail-audit` applied (net-negative lines); each cleanup `ponytail-review`-clean.
- [ ] `ponytail-debt` ledger created from `ponytail:` comments.
- [ ] `impeccable polish`/`audit` pass applied across the full UI (contrast, motion, responsive, empty states, slop test, bans).
- [ ] Public export surface intact; `globals.css` still tokens/resets only.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` exit 0.
- [ ] `plans/README.md` row 017 → DONE.

## STOP conditions

- An audit surfaces a security issue or a correctness bug that needs more than a small fix — STOP, write it up as a dedicated 018+ plan, and report; don't rush a risky fix into the final pass.
- Applying simplifications breaks tests in a non-obvious way — STOP and report rather than deleting tests to go green.

## Maintenance notes

- Re-run this trio (`improve` / `ponytail-audit` / `impeccable polish`) before each release; it's the standing quality bar, not a one-off.
- The `ponytail-debt` ledger is the backlog of known shortcuts — review it when the corresponding ceiling is hit.
