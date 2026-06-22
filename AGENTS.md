<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Shell

- `lib/shell/` — pure geometry (notch path, anchors, content-size mapping, viewBox↔CSS, handle position). No React; unit-tested with `npm test`.
- `components/shell/` — React API: `<Shell>`, `<Shell.Edge side>`, `<Shell.Slot id handle>`, `<Shell.Content>`. State lives in `shell-context`.
- One active slot globally. Slot content size is measured offscreen (ResizeObserver) and drives the animated notch; `useShellAnimation` lerps the spec each frame.
- Active slot content renders via `createPortal` into a fixed overlay layer, clipped to the animated notch cavity and anchored to its docking edge.
- Geometry uses viewBox `100×100` with `preserveAspectRatio="none"`, so CSS percentages map 1:1 to viewBox units — positioning helpers return `%`, no screen-matrix math.
- Primary pattern: bottom-edge search via `SearchSlot` (async results grow the notch upward). Real APIs only replace its `onSearch`.

## Personal edition

A config-driven productivity station built on the shell primitive. `reshell.config.ts` is the read-only source of truth; runtime changes live in a localStorage **override** merged over it (ADR-0007). Edge slots host bookmarks, tools, the command bar, and the command center; a **Scene** owns the canvas look + widget layout (ADR-0008).

### Module map

| Area | Pure logic (`lib/**`, React-free, unit-tested) | React (`components/**`, `hooks/**`) |
|------|------------------------------------------------|-------------------------------------|
| Config | `lib/config` — types, zod schema, `validateConfig` | — |
| Override store | `lib/override` — the **only** module touching `localStorage`; subscribe/snapshot/write seam | — |
| Effective state | `lib/state` — merge override over config | `hooks/use-reshell-state` — `ReshellProvider` + `useReshellState` |
| Bookmarks | `lib/bookmarks` — title/favicon display | `components/personal/bookmark-group-slot`, `workspace-edges` |
| Workspaces / command center | `lib/workspace` — cycle order | `components/personal/command-center-slot` |
| Command bar | `lib/command` — parse, fuzzy rank, index | `components/personal/command-bar-slot` |
| Timer | `lib/timer` — timestamp pomodoro/countdown | `hooks/use-timer`, `components/personal/timer-slot` |
| Tasks | `lib/tasks` — task ops + timer link | `hooks/use-tasks`, `components/personal/tasks-slot` |
| Music | `lib/music` — YouTube source resolution, playback | `hooks/use-music`, `components/personal/music-slot`, `youtube-player` |
| Scenes / widgets | `lib/scene` — contract + visibility rules | `components/scenes/*`, `components/widgets/*`, `components/personal/canvas` |
| Icons | `lib/icons` — emoji \| image \| named resolution | `components/icon` |
| Clock | — | `hooks/use-clock` |

`app/` is only the composition root: `app/page.tsx` wires the config into `ReshellProvider` and mounts the shell; `app/globals.css` is tokens/`@theme`/resets only (ADR-0009).

### Edge reservations

Bookmark groups go on `left` / `bottom`; the **`top` edge is reserved for the command center** and `right` for the tools (timer/tasks/music). The command center and bookmark groups mount separate `<Shell.Edge side="top">`s, and the shell distributes anchors *within* one edge — so a top bookmark group's handle collides with the command-center handle at top-centre. The starter config keeps groups off `top`; a cross-edge handle-collision fix in the shell geometry is a deferred follow-up (see `components/personal/workspace-edges.tsx`).

## Importing as a submodule

This repo is consumed as a **git submodule** by the reshell-workspace to build the paid tiers. The public contract is the top-level barrel `index.ts` — import only from there:

```ts
import {
  ReshellProvider, useReshellState, useTimer, useTasks, useMusic, useClock,
  Shell, TimerSlot, CommandBarSlot, CommandCenterSlot, WorkspaceEdges, Canvas,
  scenes, getScene, Icon, validateConfig,
  type ReshellConfig, type Scene, type ShellThemeInput,
} from "<submodule>";
```

It re-exports `ReshellProvider`, the tool/clock hooks, the `Shell` primitive + theme types, the slot components, scenes + registry, canvas widgets, `<Icon>`, and the config types/validators. **Anything reachable only by a deep path (`@/lib/.../*`) is internal** and may change without notice; renaming/removing an export from `index.ts` is a breaking change for the consumer, not a free refactor.

Constraints the barrel guarantees (enforced by plan 016; re-run the greps before a release):

- **No `app/` coupling** — nothing in the public surface imports from `app/` or Next page internals, so importing the barrel never drags in the composition root or `globals.css`.
- **Injectable persistence** — components/hooks never call `localStorage`; all of it routes through the `lib/override` store seam, so a tier can swap in a backend store without forking feature code.
- **Colocated styling** — components use Tailwind utilities + colocated CSS Modules + shadcn primitives (`components/ui/`); there is no shared component stylesheet. A consumer supplies its own design tokens.

A consumer provides its own `ReshellConfig` (validated by `ReshellProvider`); to swap persistence, replace the `lib/override` store implementation behind its subscribe/snapshot/write surface.
