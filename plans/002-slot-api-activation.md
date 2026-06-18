# Plan 002: Slot API and global activation

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 99bd0a0..HEAD -- lib/shell/ components/ hooks/ app/page.tsx`
> Compare "Current state" excerpts against live code on mismatch → STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-geometry-foundation.md
- **Category**: tech-debt
- **Planned at**: commit `99bd0a0`, 2026-06-15

## Why this matters

The shell needs a composable React API: slots declared per edge, one active globally, notch opening at a fixed anchor (not free pointer position). This plan replaces the pointer-hover prototype with `Shell` / `Shell.Edge` / `Shell.Slot` / `Shell.Content` and wires activation to the geometry from plan 001. Slot size is still fixed in this plan — dynamic measurement comes in plan 003.

## Current state

After plan 001 (expected):

- `lib/shell/notch.ts` — `buildShellPath(bounds, notch: NotchSpec | null)`
- `lib/shell/anchors.ts` — `anchorPositions(bounds, edge, slotCount)`
- `lib/shell/animation.ts` — lerp controller (still uses `NotchPlacement` / `NotchSize`)

**Current React surface** (to be replaced/refactored):

- `components/shell-frame.tsx` — thin SVG wrapper
- `hooks/use-shell-notch.ts` — pointer events on single hit path

```tsx
// components/shell-frame.tsx (today)
export function ShellFrame() {
  const { svgRef, visiblePathRef, hitPath, pointerHandlers } = useShellNotch();
  // ...
}
```

**Product decisions (fixed requirements):**

- One active slot globally
- `<Shell>` is a client component used per page (not in `layout.tsx`)
- Anchors evenly spaced along an edge; extent fixed for now

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Tests | `npm test` | all pass |

## Scope

**In scope:**

- `lib/shell/types.ts` — slot registry types
- `lib/shell/animation.ts` — adapt controller to `NotchSpec` / `SlotExtent` (or add adapter)
- `components/shell/shell-context.tsx` (create)
- `components/shell/shell.tsx` (create)
- `components/shell/shell-edge.tsx` (create)
- `components/shell/shell-slot.tsx` (create)
- `components/shell/shell-content.tsx` (create)
- `components/shell/shell-frame.tsx` (create) — move/refactor from `components/shell-frame.tsx`
- `components/shell/index.ts` (create) — public exports
- `hooks/use-shell-animation.ts` (create) — replaces `use-shell-notch.ts` pointer logic
- `app/page.tsx` — demo with one bottom-edge slot (placeholder content)
- `lib/shell/__tests__/shell-context.test.ts` (optional, if testable pure helpers extracted)
- Delete or deprecate `components/shell-frame.tsx` and `hooks/use-shell-notch.ts` after migration
- `plans/README.md` — status row only

**Out of scope:**

- ResizeObserver / dynamic sizing — plan 003
- Portals — plan 004
- Handles outside shell — plan 005
- Search UI — plan 005

## Git workflow

- Branch: `advisor/002-slot-api`
- Do NOT push unless instructed

## Steps

### Step 1: Shell context and registry

Create `components/shell/shell-context.tsx`:

```ts
type SlotRegistration = {
  id: string;
  edge: ShellEdge;
  anchorIndex: number; // index among siblings on same edge
  siblingCount: number;
};

type ShellContextValue = {
  bounds: ShellBounds;
  activeSlotId: string | null;
  activate: (id: string) => void;
  deactivate: () => void;
  registerSlot: (slot: SlotRegistration) => void;
  unregisterSlot: (id: string) => void;
  getAnchor: (id: string) => SlotAnchor | null;
};
```

- `registerSlot` / `unregisterSlot` maintain a `Map<string, SlotRegistration>`
- `getAnchor(id)` computes center via `anchorPositions(bounds, edge, siblingCount)[anchorIndex]`
- `activate(id)` sets `activeSlotId`; activating a new id implicitly deactivates the previous
- `deactivate()` sets `activeSlotId` to null

Export `ShellProvider`, `useShell`.

**Verify**: `npx tsc --noEmit` → exit 0

### Step 2: Compound components

Create `components/shell/shell.tsx` (`"use client"`):

```tsx
export function Shell({ children, bounds = SHELL_BOUNDS }: ShellProps) {
  return (
    <ShellProvider bounds={bounds}>
      <div className="relative min-h-full flex flex-col">
        <ShellFrame />
        {children}
      </div>
    </ShellProvider>
  );
}
```

Attach static subcomponents: `Shell.Edge`, `Shell.Slot`, `Shell.Content`.

`Shell.Edge` — wraps children, provides edge context (`side: ShellEdge`), counts slot children.

`Shell.Slot` — requires `id: string`, registers on mount, unregisters on unmount. Renders:
- Invisible hit zone `div` positioned along its anchor on the edge (fixed size for now: `NOTCH_LIMITS` defaults)
- `onPointerEnter` → `activate(id)`; zone also handles `onPointerLeave` with care (use pointer capture or check `relatedTarget`)

`Shell.Content` — children with padding/inset matching shell bounds (CSS or calculated from bounds).

**Verify**: `npx tsc --noEmit` → exit 0

### Step 3: Animation hook wired to active slot

Create `hooks/use-shell-animation.ts`:

- Reads `activeSlotId`, `getAnchor` from context
- When active: `targetNotch = { ...anchor, depth: NOTCH_LIMITS.maxDepth, halfExtent: NOTCH_LIMITS.maxHalfExtent }`
- When inactive: `targetNotch = null`
- Reuse `createNotchAnimationController` pattern from `lib/shell/animation.ts` — refactor controller to accept `NotchSpec | null` targets
- Each frame: `visiblePath.setAttribute('d', buildShellPath(bounds, animatedNotch))`

Refactor `components/shell/shell-frame.tsx`:

- Remove `aria-hidden` from SVG (interactive shell — a11y handled in plan 005)
- Visible path only; hit zones are HTML divs from slots, not SVG stroke

**Verify**: `npm run build` → exit 0

### Step 4: Migrate page demo

Update `app/page.tsx`:

```tsx
"use client";
import { Shell } from "@/components/shell";

export default function Home() {
  return (
    <Shell>
      <Shell.Edge side="bottom">
        <Shell.Slot id="search">
          <div className="p-4">Search placeholder</div>
        </Shell.Slot>
      </Shell.Edge>
      <Shell.Content>
        {/* existing page content */}
      </Shell.Content>
    </Shell>
  );
}
```

Remove `ShellFrame` import from old path.

Delete `components/shell-frame.tsx` and `hooks/use-shell-notch.ts` if fully replaced.

**Verify**: `npm run dev` — hover bottom edge zone opens notch at center; only one slot active at a time

### Step 5: Tests for activation logic

Extract pure helper if needed: `resolveActiveNotch(activeSlotId, slots, bounds) → NotchSpec | null`

Add `lib/shell/__tests__/active-notch.test.ts`:

- No active slot → null
- Active bottom slot → correct anchor center
- Switching active slot changes anchor center

**Verify**: `npm test` → all pass

## Test plan

- Unit tests for active notch resolution
- Manual: bottom slot opens on hover, closes on leave, second slot on same edge deactivates first

## Done criteria

- [ ] `Shell`, `Shell.Edge`, `Shell.Slot`, `Shell.Content` exported from `components/shell/index.ts`
- [ ] One active slot globally enforced in context
- [ ] Notch opens at evenly spaced anchor, not pointer position
- [ ] `app/page.tsx` uses new `Shell` API with bottom-edge demo slot
- [ ] Old `use-shell-notch.ts` removed or unused
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` all exit 0
- [ ] `plans/README.md` row 002 → DONE

## STOP conditions

- Plan 001 geometry modules (`notch.ts`, `anchors.ts`) don't exist — complete 001 first
- Slot hit zones cannot be positioned without DOM measurement and plan 001's viewBox→pixel helper isn't ready — report; may need minimal `lib/shell/coordinates.ts` extension (in scope if limited to anchor→pixel for hit zones)

## Maintenance notes

- Hit zone positioning will change in plan 005 when handles move outside shell — keep zone logic in `Shell.Slot`, not scattered
- `Shell.Content` inset must account for open notch depth in plan 003+ — add TODO comment in `shell-content.tsx`
