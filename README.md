# reshell — personal edition

A config-driven personal productivity station built on the **reshell** shell
primitive: a per-page `<Shell>` with content-driven edge notches. One typed,
build-time `reshell.config.ts` is the read-only source of truth; runtime changes
(active workspace, scene/widget toggles) live in a thin per-workspace
localStorage **override** merged over the config (ADR-0007). The canvas look and
widget layout are owned by swappable **Scene** components (ADR-0008).

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Quality gates (all must pass before a commit):

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## Authoring your setup — `reshell.config.ts`

`reshell.config.ts` is your dotfile: edit it and reload. It is **read-only at
runtime** — the app never writes back to it; runtime changes are stored
separately as an override and merged over it. `ReshellProvider` validates the
config on load (zod) and renders an explanatory error surface if it's invalid.

```ts
import type { ReshellConfig } from "@/lib/config";

export const reshellConfig = {
  displayName: "Jack",
  defaultWorkspaceId: "work",
  clock: { format: "24h", timezone: "local" }, // "12h" | "24h"; IANA zone or "local"
  quotes: [{ text: "…", author: "…" }],
  music: {
    // YouTube only. A watch?v= / youtu.be URL is a single video; a
    // playlist?list= URL auto-advances.
    stations: [{ id: "lofi", label: "Lofi beats", url: "https://youtu.be/…", icon: "🎧" }],
  },
  workspaces: [
    {
      id: "work",
      name: "Work",
      scene: "default", // default | editorial | meridian | atelier
      widgets: { clock: true, welcome: true, quote: true },
      bookmarks: {
        // Edges: `left` and `bottom` only. `top` is reserved for the command
        // center, `right` for the tools (timer/tasks/music).
        left: [
          {
            name: "Dev",
            icon: "code", // see icon resolution below
            links: [{ url: "https://github.com", title: "GitHub", icon: "github" }],
          },
        ],
      },
    },
  ],
} satisfies ReshellConfig;

export default reshellConfig;
```

**Icons** (bookmarks, groups, stations) resolve in priority order:

1. **emoji** literal (`"🎧"`),
2. **image URL** (`http`/`https`),
3. **named pack icon** (`"github"`, `"code"`, …) — animates on hover.

A bookmark with no `icon` falls back to its favicon. See `lib/icons/README.md`
for the curated names. `validateConfig` (exported) reports exactly what's wrong.

## Consuming it from the workspace

This repo is added as a **git submodule** to the reshell-workspace and its
components imported to build the paid tiers. Import **only** from the top-level
public barrel (`index.ts`) — it is the supported contract:

```ts
import {
  ReshellProvider, useReshellState,
  useTimer, useTasks, useMusic, useClock,
  Shell, TimerSlot, CommandBarSlot, CommandCenterSlot, WorkspaceEdges, Canvas,
  scenes, getScene, Icon, validateConfig,
  type ReshellConfig, type Scene, type ShellThemeInput,
} from "<submodule>";

function Tier({ config }: { config: ReshellConfig }) {
  return (
    <ReshellProvider config={config}>
      <Shell>
        <CommandCenterSlot />
        <CommandBarSlot />
        <TimerSlot />
        <WorkspaceEdges />
        <Shell.Content><Canvas /></Shell.Content>
      </Shell>
    </ReshellProvider>
  );
}
```

What the barrel exports: `ReshellProvider`, the tool/clock hooks, the `Shell`
primitive + theme types, the slot components, scenes + registry, the canvas
widgets, `<Icon>`, and the config types/validators. Anything reachable only by a
deep path (`@/lib/.../*`) is **internal** and may change without notice.

The contract holds three constraints (audited by plan 016, see ADR-0009):

- **No `app/` coupling** — importing the barrel never pulls in the composition
  root or a global stylesheet; `app/` is only this repo's own demo host.
- **Injectable persistence** — features never call `localStorage` directly; all
  of it routes through the `lib/override` store seam, so a paid tier can swap in
  a backend store by replacing that module's subscribe/snapshot/write surface.
- **Colocated styling** — Tailwind utilities + colocated CSS Modules + shadcn
  primitives; the consumer supplies its own design tokens.

## Project layout

- `lib/**` — pure, React-free, unit-tested logic (config, override, state,
  bookmarks, command, timer, tasks, music, scene, icons, shell geometry).
- `components/**` — React: `shell/` (primitive), `personal/` (slots), `scenes/`,
  `widgets/`, `icon/`, `ui/` (shadcn).
- `hooks/**` — the provider and tool/clock hooks.
- `app/**` — composition root only (`page.tsx`) + tokens/resets (`globals.css`).
- `docs/adr/**`, `CONTEXT.md`, `DESIGN.md`, `plans/**` — architecture decisions,
  glossary, design system, and the implementation plans.

See `AGENTS.md` for the full module map and the submodule import surface.
