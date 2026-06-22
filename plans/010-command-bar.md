# Plan 010: Command bar

> **Executor instructions**: Follow step by step, run every verification command, honor STOP conditions, update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 38ba3a9..HEAD -- components/personal/ components/shell/search-slot.tsx` — plans 008 and 009 must be DONE.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MEDIUM
- **Depends on**: plans/008, plans/009
- **Category**: feature
- **Planned at**: commit `38ba3a9`, 2026-06-21

## Why this matters

The command bar is the single command surface (ADR / CONTEXT: "Command bar"). The bottom `SearchSlot` becomes it: any printable keystroke (when no field is focused) opens it pre-filled and fuzzy-finds workspaces + bookmarks; a `:` / `>` prefix switches to verbs. There are no bare single-key shortcuts.

## Current state

After 008/009: bookmark slots + command-center slot render; workspaces switch via click/Tab. `SearchSlot` exists as a presentational, parent-owned search panel (plan 005) on the bottom edge. No global keystroke capture, no fuzzy index, no verbs.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Tests | `npm test` | all pass |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope:**

- `lib/command/index-build.ts` (create) — pure: build a searchable index of commands from current state: every workspace (`switch to {name}`) and every bookmark (`open {title}` with its url), plus static verbs (start/stop timer, add task, switch scene {name}, play/pause music, reset workspace). Each entry: `{ id, kind, label, keywords, run-descriptor }`.
- `lib/command/fuzzy.ts` (create) — pure fuzzy match/rank (subsequence + score). Unit-tested.
- `lib/command/parse.ts` (create) — pure: classify input → `{ mode: "nav" | "verb", query }` based on `:`/`>` prefix.
- `components/personal/command-bar-slot.tsx` (create) — a bottom-edge `Shell.Slot` (no handle, so the bottom edge minimises) wrapping a command panel: input + ranked result rows; Enter runs the top/selected entry; ↑/↓ select; Escape closes. Built on the `SearchSlot` layout (results grow upward).
- `hooks/use-global-typeahead.ts` (create) — document keydown: when no editable element is focused and the key is a single printable char (no ⌘/Ctrl), open the command bar and seed the query with that char (focus the input). Leaves Tab/Escape/⌘-combos alone.
- Action dispatch: a `runCommand(entry)` that maps entries to provider actions (`setActiveWorkspace`, open url, timer/task/music/scene actions where those plans have landed — guard for not-yet-implemented verbs).
- `app/page.tsx` — mount `<CommandBarSlot />` on the bottom edge.
- `lib/command/__tests__/{fuzzy,parse,index-build}.test.ts` (create).
- `plans/README.md` — status row only.

**Out of scope:**

- Verbs for tools not yet built (timer/tasks/music) beyond stubbed descriptors — wire them as those plans land; here, nav (workspaces + bookmarks) + scene switch + reset must work.
- Persisting command history.

## Steps

### Step 1: Pure command core

- `parse.ts`: `>`/`:` prefix → verb mode (strip prefix); else nav mode.
- `fuzzy.ts`: `rank(query, entries)` returning sorted matches; empty query returns a sensible default set (recent/likely).
- `index-build.ts`: assemble entries from `config` + effective state.

**Verify**: tests for prefix parsing, subsequence ranking (e.g. "gh" matches "GitHub"), and that workspaces + bookmarks appear in the index.

### Step 2: Command bar slot

- Bottom-edge handleless `Shell.Slot id="command"`. Input bound to a parent-owned `query` (the slot renders in measurer + portal — keep state in the parent, per `search-slot.tsx` contract). Results = `rank(parse(query), index)`. Row click / Enter → `runCommand`.
- Selection state (↑/↓ + highlighted row), Enter runs selected, Escape closes/clears.

### Step 3: Global typeahead

- `useGlobalTypeahead()` opens the bar on a bare printable key and seeds the query. Must ignore keystrokes while an input/textarea/contenteditable is focused, and ignore modifier combos. Opening focuses the input so subsequent keys land there.

### Step 4: Dispatch

- `runCommand`: `switch` → `setActiveWorkspace`; `open` → `window.open(url, "_blank")`; `scene` → `patchOverride({ scene })`; `reset` → `resetWorkspace`. Tool verbs: call provider methods if present, else no-op + (optional) toast/log.

**Verify**: `npm run dev` — typing a letter on the canvas opens the bar with that letter; fuzzy-finding a workspace + Enter switches it; finding a bookmark + Enter opens it; `>scene editorial` switches scene; Escape closes; typing inside a bookmark/handle field does NOT open the bar.

## Test plan

- Unit: `fuzzy`, `parse`, `index-build`.
- Manual: typeahead open + seed; nav vs verb prefix; selection keys; focus-guard (no hijack while typing in fields).

## Done criteria

- [ ] Bare printable keystroke opens the command bar seeded with that char (guarded against focused fields + modifiers).
- [ ] Nav mode fuzzy-finds workspaces + bookmarks; Enter switches/opens.
- [ ] Verb mode (`:`/`>`) runs scene switch + reset (and tool verbs where implemented).
- [ ] ↑/↓ selection, Enter, Escape behave.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` exit 0.
- [ ] `plans/README.md` row 010 → DONE.

## Commits (Conventional Commits — commit per atomic change; see README Conventions)

- `feat(cmd): add fuzzy match, parse, and index core`
- `test(cmd): cover fuzzy, parse, index-build`
- `feat(cmd): add command-bar slot`
- `feat(cmd): add global typeahead capture`
- `feat(cmd): dispatch nav and verb commands`

## Modularity & styling (ADR-0009)

- `lib/command/*` (fuzzy/parse/index-build) is pure, unit-tested, and barrel-exported — reusable by any future palette UI in the paid tiers.
- The slot reuses the `search-slot.tsx` layout + Tailwind utilities; result rows use `<Icon>`. No global CSS.
- `useGlobalTypeahead` is a standalone hook; keep its focus-guard logic free of `app/` specifics.

## Skill passes (see README → Skill workflow)

- **improve**: `improve review-plan plans/010-command-bar.md` before starting.
- **impeccable**: `impeccable shape "command bar (input + ranked results, verb mode)"` before building, `impeccable polish "command bar"` before the final commit. Focus on result-row legibility, selection highlight, empty/loading states, and the type-to-open feel.
- **ponytail (full)**: write a tiny subsequence fuzzy ranker — do NOT add a fuzzy-search dependency for this. Parse is a prefix check. `ponytail:` the ranking heuristic with its upgrade path. Pre-commit: `ponytail-review` the diff.

## STOP conditions

- Global keydown capture interferes with the shell's slot activation/focus model or the command-center inputs — STOP and report; the focus guard must be airtight before shipping.

## Maintenance notes

- The fuzzy/parse/index core is pure and reused by any future palette UI.
- New verbs register in `index-build.ts` + `runCommand`; later tool plans add their verbs there.
