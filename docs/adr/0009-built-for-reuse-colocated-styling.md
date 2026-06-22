# Built for reuse: component-driven, colocated styling, no monolithic global CSS

The personal edition is built so this repo can be added as a **git submodule** to the main reshell-workspace, with its components and hooks imported to build the paid tiers (standard, pro, team). That goal drives three standing constraints, recorded here because they are easy to erode one careless commit at a time — and because the previous attempt failed precisely on the last one.

1. **Component-driven, app-decoupled.** Features are small single-responsibility components plus pure-logic modules (`lib/**`, zero React/DOM, unit-tested). Importable units never depend on `app/` or Next.js page internals; they receive data via props/hooks/context. `app/page.tsx` is only a composition root. Each feature exposes a barrel for clean imports.
2. **Persistence is injectable.** The config + override store sits behind the plan-007 interface. Components never call `localStorage` directly, so a paid tier can swap in a backend store without touching feature code.
3. **Styling is Tailwind-first and colocated; `globals.css` is tokens/resets only.** Component-specific CSS (keyframes, complex selectors) lives in a colocated CSS Module next to its component. shadcn primitives cover form controls. There is no shared catch-all stylesheet.

We also hold a hard line against over-engineering: prefer the standard library, the native platform, and existing UI primitives over bespoke abstractions; no indirection without a second caller.

## Consequences

- A future contributor will be tempted to "just add it to `globals.css`" or to import from `app/` for convenience. Both reintroduce the coupling/monolith this record exists to prevent — don't. Plan 016 audits for exactly these regressions.
- Keeping persistence behind an interface costs a little ceremony in the OSS/personal build (which only ever uses localStorage), but it is the seam the paid tiers depend on.
- The public export surface is part of the contract: moving/renaming an exported component is a breaking change for the consuming workspace, not a free refactor.
