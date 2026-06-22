# Plan 008: Bookmarks on edges

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving on. Honor STOP conditions. When done, update the status row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 38ba3a9..HEAD -- lib/config/ hooks/use-reshell-state.tsx` — plan 007 must be DONE.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/007
- **Category**: feature
- **Planned at**: commit `38ba3a9`, 2026-06-21

## Why this matters

Bookmarks are the bulk of the config and the most visible feature. Each config **bookmark group** becomes a `Shell.Slot` (with a handle) on its configured edge; opening the slot reveals the group's links. This validates rendering multiple slots per edge from config-driven data.

## Current state

After 007: home station boots from config, renders active workspace name in `Shell.Content`. No edge slots are rendered from config yet. `Shell.Edge` already spaces N sibling slots per edge (plans 002/005); `SearchSlot` shows the handle + portal pattern.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Tests | `npm test` | all pass |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope:**

- `lib/icons/resolve.ts` + `lib/icons/index.ts` (create) — the **icon-resolver seam**: pure `resolveIcon(value?)` classifying emoji (literal) vs image URL (`http(s)://`) vs named (anything else). Here it handles emoji + image; **named** resolution falls back to a placeholder until plan 015 fills the registry. A minimal `<Icon value />` component renders emoji/image now. Keep it standalone (the paid tiers reuse it).
- `lib/bookmarks/link-display.ts` (create) — pure: `displayTitle(bookmark)` (config title else hostname-derived) and `faviconUrl(url)` (favicon service or `/favicon.ico`), `displayIcon(bookmark)` (returns `resolveIcon(bookmark.icon)`, else favicon).
- `components/personal/bookmark-group-slot.tsx` (create) — given a `BookmarkGroup` + edge + anchor index, renders a `Shell.Slot` whose handle shows the group icon/name and whose content lists the links (open in new tab, `rel="noreferrer"`).
- `components/personal/workspace-edges.tsx` (create) — reads the effective active workspace, maps `bookmarks.left/top/bottom` to `<Shell.Edge side>` blocks each containing the group slots in array order.
- `app/page.tsx` — mount `<WorkspaceEdges />` inside `<Shell>`.
- `lib/bookmarks/__tests__/link-display.test.ts` (create).
- `plans/README.md` — status row only.

**Out of scope:**

- Right edge (tools — plans 011–013) and the top/bottom system slots (command center/bar — plans 009/010). Bookmark groups may still be placed on top/bottom; they will co-exist as sibling slots once those land.
- Editing/reordering bookmarks at runtime (config-only; no UI).

## Steps

### Step 1: Link display helpers

- Pure functions, no DOM. `displayTitle`: prefer `title`, else `new URL(url).hostname` without leading `www.`. `faviconUrl`: `https://www.google.com/s2/favicons?domain=…&sz=64` (or document an alternative). Handle invalid URLs gracefully (return the raw string).

**Verify**: `link-display.test.ts` — title fallback, www stripping, invalid URL.

### Step 2: Bookmark group slot

- `BookmarkGroupSlot` renders `<Shell.Slot id={groupSlotId} handle={…}>` with a handle showing the icon (emoji/img) + group name. Content: a list of links, each a row with favicon + display title, `<a target="_blank" rel="noreferrer">`. Reuse the panel styling conventions from `search-slot.tsx`.
- Slot id must be stable + unique per workspace+edge+index (e.g. `bm:${edge}:${index}`).

### Step 3: Workspace edges

- `WorkspaceEdges` reads `activeWorkspace.bookmarks`. For each of `left`/`top`/`bottom` with groups, render a `<Shell.Edge side>` containing the `BookmarkGroupSlot`s. Skip empty edges. Pass `anchorIndex`/sibling count via the existing `Shell.Edge` mechanism (it injects them).

**Verify**: `npm run dev` — Work workspace shows its left-edge groups; hovering a handle opens the group; links open in new tabs. Multiple groups on one edge space out correctly.

## Test plan

- Unit: `link-display.test.ts`.
- Manual: groups render on configured edges; handles open/close; favicons load; switching the config edge of a group moves it.

## Done criteria

- [ ] Config bookmark groups render as handled edge slots on left/top/bottom.
- [ ] Link rows show favicon + display title and open in a new tab.
- [ ] Empty edges render nothing; multiple groups per edge space correctly.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` exit 0.
- [ ] `plans/README.md` row 008 → DONE.

## Commits (Conventional Commits — commit per atomic change; see README Conventions)

- `feat(icons): add icon-resolver seam and minimal <Icon> (emoji|image)`
- `feat(bookmarks): add link-display helpers`
- `test(bookmarks): cover link-display`
- `feat(bookmarks): render bookmark group as edge slot`
- `feat(bookmarks): map workspace bookmarks to edges`

## Modularity & styling (ADR-0009)

- `link-display.ts` + `lib/icons/*` are pure/standalone with barrels; `BookmarkGroupSlot`/`WorkspaceEdges` take data via the provider hook, no `app/` coupling.
- Link rows + handles styled with Tailwind utilities; reuse `search-slot.tsx` panel conventions. No global CSS additions.
- The icon seam is deliberately split from the pack (plan 015) so this slice stays small — don't pull in `@animateicons/react` here.

## Skill passes (see README → Skill workflow)

- **improve**: `improve review-plan plans/008-bookmarks-on-edges.md` before starting.
- **impeccable**: `impeccable shape "bookmark group slot + link rows"` before building, `impeccable polish "bookmark slots"` before the final commit (against `DESIGN.md` from 007). Mind contrast, hover/focus states, favicon fallback visuals.
- **ponytail (full)**: bookmarks are pure projections of config — no local store, no reorder UI, no link CRUD. `link-display` should be a few lines, not a class. Pre-commit: `ponytail-review` the diff.

## STOP conditions

- More than a handful of groups on one edge collide/overflow the anchor spacing — STOP and report; spacing is a shell-geometry concern, not to be hacked here.

## Maintenance notes

- `link-display.ts` is the single place favicon/title resolution lives; the command bar (plan 010) and `nowPlaying`/widgets reuse it.
- Slots are pure projections of config — no local bookmark state. Editing is done in `reshell.config.ts`.
