# Plan 007: Config + override foundation

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 38ba3a9..HEAD -- app/ components/shell/`
> On mismatch → re-read changed files before proceeding.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MEDIUM
- **Depends on**: plans/001–006 (shell primitive complete)
- **Category**: foundation
- **Planned at**: commit `38ba3a9`, 2026-06-21

## Why this matters

Everything in the personal edition reads through two layers: the read-only **config** and the per-workspace **override** in localStorage, merged (ADR-0007). This plan builds those layers, the types every later plan imports, and a minimal home station that boots from config — replacing the search demo in `app/page.tsx`. No tools or bookmarks yet; this is the tracer bullet that proves config → render → override-persist works.

## Current state

- `app/page.tsx` is the bottom-search demo (plan 005); `app/layout.tsx` metadata says "reshell".
- `<Shell>` accepts a `theme` prop (`lib/shell/theme.ts`, `ShellTheme`). No config or persistence anywhere.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Tests | `npm test` | all pass |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope:**

- `lib/config/types.ts` (create) — the `ReshellConfig` type tree (see below).
- `lib/config/validate.ts` (create) — runtime validation + friendly errors; install `zod` and derive types from a schema, OR hand-write a validator. Prefer `zod` (`schema.parse`) with `z.infer` as the source of `ReshellConfig`.
- `reshell.config.ts` (create, repo root) — a starter config (2 workspaces: Work, Personal) the user edits. Typed `satisfies ReshellConfig`.
- `lib/override/types.ts` (create) — `WorkspaceOverride`, `OverrideState` (keyed by workspace id).
- `lib/override/store.ts` (create) — localStorage read/write under key `reshell.override.v1`, SSR-safe (guard `typeof window`), tolerant of malformed JSON (fall back to empty).
- `lib/state/effective.ts` (create) — pure merge: `effectiveWorkspace(config, override)` and `resetWorkspaceOverride(...)`. Config wins for non-overridden fields; override wins where present. Orphaned overrides (no matching config workspace id) are ignored.
- `hooks/use-reshell-state.tsx` (create) — a React context/provider that loads config (validated once at module load), reads override from localStorage, exposes `{ config, activeWorkspace (effective), activeWorkspaceId, setActiveWorkspace, patchOverride, resetWorkspace }`, and writes override changes back to localStorage.
- `app/page.tsx` — replace demo with the home station: `<ReshellProvider><Shell><Shell.Content>…</Shell.Content></Shell></ReshellProvider>`, rendering the active workspace name (proves config load).
- `app/layout.tsx` — metadata description → personal edition.
- `lib/state/__tests__/effective.test.ts`, `lib/config/__tests__/validate.test.ts` (create).
- `plans/README.md` — status row only.

**Out of scope:**

- Bookmarks, tools, scenes, command bar, command center (later plans). Keep the page minimal.
- Cross-tab sync (later/optional). Single tab only here.

## Config type tree (target)

```ts
// lib/config/types.ts
export type ReshellConfig = {
  displayName?: string;
  defaultWorkspaceId: string;
  clock?: { format?: "12h" | "24h"; timezone?: string };       // "local" or IANA tz
  quotes?: { text: string; author?: string }[];
  music?: { stations: MusicStation[] };                         // GLOBAL
  timer?: { splits: FocusSplit[]; defaultSplitId: string; chimeEnabled?: boolean };
  shortcuts?: Partial<Record<ShortcutAction, string>>;          // overrides hardcoded defaults
  workspaces: WorkspaceConfig[];
};

export type MusicStation = { id: string; label: string; url: string; icon?: string };
export type FocusSplit = { id: string; label: string; workMinutes: number; shortBreakMinutes: number; longBreakMinutes: number };
export type ShortcutAction = "cycleWorkspace" | "openCommandBar" | "toggleTimer";

export type SceneName = "default" | "editorial" | "meridian" | "atelier";
export type CanvasWidgetId = "clock" | "welcome" | "quote" | "nowPlaying" | "pomodoro" | "focusTasks";

export type WorkspaceConfig = {
  id: string;
  name: string;
  scene: SceneName;
  widgets: Partial<Record<CanvasWidgetId, boolean>>;            // default off if absent
  bookmarks?: { left?: BookmarkGroup[]; top?: BookmarkGroup[]; bottom?: BookmarkGroup[] };
  // NOTE: no `right` — reserved for tools.
};

export type BookmarkGroup = { name: string; icon?: string; links: Bookmark[] };
export type Bookmark = { url: string; title?: string; icon?: string };
```

```ts
// lib/override/types.ts
export type WorkspaceOverride = {
  scene?: SceneName;                                   // command-center scene switch
  widgets?: Partial<Record<CanvasWidgetId, boolean>>;  // command-center widget toggles
  // tool runtime state added by later plans (timer, tasks)
};
export type OverrideState = {
  activeWorkspaceId?: string;
  workspaces: Record<string, WorkspaceOverride>;       // keyed by workspace id
  // global music playback added in plan 013
};
```

## Steps

### Step 1: Config types + validation

- Add `zod` (`npm install zod`). Write the schema in `lib/config/validate.ts`; export `ReshellConfig = z.infer<typeof reshellConfigSchema>` re-exported from `lib/config/types.ts` (or hand-write types and a validator — your call, but a single source of truth).
- `validateConfig(raw): ReshellConfig` throws a readable error listing the bad path. Assert `defaultWorkspaceId` matches some workspace id and that workspace ids are unique.

**Verify**: `validate.test.ts` — valid starter config parses; a bad one (duplicate ids, missing default) throws with a useful message.

### Step 2: Override store

- `lib/override/store.ts`: `readOverride(): OverrideState`, `writeOverride(state)`. SSR-safe, malformed-JSON-safe. Key `reshell.override.v1`.

### Step 3: Merge

- `lib/state/effective.ts`: `effectiveWorkspace(workspaceConfig, override?)` returns the merged view (override fields win, else config). `resolveActiveWorkspaceId(config, override)` = override.activeWorkspaceId if it still exists in config, else `config.defaultWorkspaceId`. `resetWorkspaceOverride(state, id)` deletes that workspace's override entry.

**Verify**: `effective.test.ts` — override scene wins; absent override falls back to config; orphaned override id is ignored; reset clears.

### Step 4: Provider

- `hooks/use-reshell-state.tsx`: `ReshellProvider` loads `validateConfig(config)` once, holds `OverrideState` in `useState` seeded from `readOverride()`, and persists to localStorage on change (effect or in the setters). Expose the API in the Scope section. Throw config errors into a visible error UI (simple full-screen message), not a blank page.

### Step 5: Home page

- Replace `app/page.tsx` with the provider + `<Shell>` + `<Shell.Content>` showing `activeWorkspace.name` and `config.displayName`. Keep it a client component (`"use client"`).
- Update `app/layout.tsx` metadata description.

**Verify**: `npm run dev` boots, shows the Work workspace name. Manually editing `reshell.config.ts` + refresh reflects changes. Introducing a config error shows the error UI, not a crash.

## Test plan

- Unit: `validate.test.ts`, `effective.test.ts` (pure, node env — matches existing test setup).
- Manual: boot, edit config, refresh; corrupt localStorage value → app still boots.

## Done criteria

- [ ] `ReshellConfig` type tree + validator exist; `reshell.config.ts` starter parses.
- [ ] Override store reads/writes localStorage safely (SSR + malformed JSON).
- [ ] `effectiveWorkspace` merge + reset implemented and unit-tested.
- [ ] `ReshellProvider` exposes config + effective active workspace + setters; persists override.
- [ ] `app/page.tsx` is the home station booting from config; demo removed.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` exit 0.
- [ ] `plans/README.md` row 007 → DONE.

## Commits (Conventional Commits — commit per atomic change; see README Conventions)

- `feat(config): add ReshellConfig types and zod schema`
- `test(config): cover config validation`
- `feat(override): add SSR-safe localStorage override store`
- `feat(state): add effective-workspace merge and reset`
- `test(state): cover merge and reset semantics`
- `feat(state): add ReshellProvider`
- `feat(app): boot home station from config, remove demo page`
- `docs(config): add starter reshell.config.ts`

## Modularity & styling (ADR-0009)

- Pure logic in `lib/config`, `lib/override`, `lib/state` has zero React/DOM deps and exports a barrel. `ReshellProvider`/`useReshellState` are app-decoupled (no `app/` imports).
- **Persistence stays behind the store interface** — this is the seam the paid tiers swap for a backend. No component calls `localStorage`; only `lib/override/store.ts` does.
- The error UI uses Tailwind utilities (or a shadcn primitive); nothing goes into `globals.css`.

## Skill passes (see README → Skill workflow)

- **improve**: `improve review-plan plans/007-config-override-foundation.md` before starting.
- **impeccable (one-time setup)**: run `impeccable init` here to create `PRODUCT.md`, `DESIGN.md`, and the committed OKLCH token palette — the design baseline every later UI plan depends on. Then `impeccable audit` the boot/error screen (contrast, responsiveness).
- **ponytail (full)**: keep the config/override/merge code minimal — no premature migration framework, no generic "settings engine". `ponytail:` any deliberate shortcut (e.g. naive deep-merge). Pre-commit: `ponytail-review` the diff.

## STOP conditions

- `zod` (or chosen validator) cannot express the type tree cleanly — STOP and report; do not ship an unvalidated config.
- Persisting override forces per-frame re-renders or fights the shell's ref-driven animation (ADR-0006) — STOP; override writes must be discrete, not on the animation path.

## Maintenance notes

- This is the single seam later plans build on: read via `useReshellState()`, write only to the override. Never write back to `reshell.config.ts`.
- Keep `WorkspaceOverride` additive — plans 011/012/013 extend it with tool state; don't reshape its existing fields.
