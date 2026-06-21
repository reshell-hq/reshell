# Plan 001: Geometry foundation and test baseline

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 99bd0a0..HEAD -- lib/shell/ components/shell-frame.tsx hooks/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `99bd0a0`, 2026-06-15

## Why this matters

The shell will become a content-sized dynamic container. All slot positioning, notch animation, and portal layout depend on correct perimeter geometry. Today `lib/shell/path.ts` duplicates four nearly identical notch builders and placement uses axis-aligned bbox edges instead of the path perimeter. This plan replaces that with a single parametric path builder, adds anchor placement math, and establishes Vitest so later plans can verify geometry without manual browser QA.

## Current state

**Shell geometry modules** (pure TypeScript, no React):

- `lib/shell/types.ts` — `ShellBounds`, `NotchPlacement`, `NotchSize`, `ShellEdge`
- `lib/shell/constants.ts` — `SHELL_BOUNDS`, `NOTCH_LIMITS`, `NOTCH_ANIMATION`, `SHELL_VIEWBOX`
- `lib/shell/path.ts` — `buildRoundedRectPath` plus four separate `buildLeft/Right/Top/BottomNotchPath` functions (~165 lines)
- `lib/shell/placement.ts` — `closestPlacement` uses distance to bbox edges (not path perimeter)
- `lib/shell/animation.ts` — rAF lerp controller for `NotchSize`
- `lib/shell/easing.ts` — `lerp`, `isSettled`

**React integration** (do not refactor yet — only update imports if path exports change):

- `components/shell-frame.tsx` — renders SVG via `useShellNotch`
- `hooks/use-shell-notch.ts` — pointer-hover drives free-floating notch

**Example current notch builder** (`lib/shell/path.ts`):

```ts
function buildLeftNotchPath(bounds, centerY, depth, halfExtent) {
  // ... 25 lines, duplicated pattern for each edge
}
```

**Conventions:**

- `@/*` path alias maps to repo root (`tsconfig.json`)
- Strict TypeScript (`"strict": true`)
- New pure logic goes in `lib/shell/`; React in `components/` and `hooks/`
- `AGENTS.md` warns: read `node_modules/next/dist/docs/` before Next.js APIs — not relevant to this plan (no Next changes)

**No test runner exists.** `package.json` has `build`, `lint`, `dev`, `start` only.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install | `npm install` | exit 0 |
| Typecheck | `npx tsc --noEmit` | exit 0, no errors |
| Build | `npm run build` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Tests | `npm test` | exit 0, all pass |

## Scope

**In scope:**

- `package.json` — add `test` script and vitest devDependency
- `vitest.config.ts` (create)
- `lib/shell/types.ts` — extend types for anchors and slot geometry
- `lib/shell/perimeter.ts` (create)
- `lib/shell/anchors.ts` (create)
- `lib/shell/clamp.ts` (create)
- `lib/shell/notch.ts` (create) — unified path builder
- `lib/shell/notch-rect.ts` (create) — notch → axis-aligned rect in viewBox coords
- `lib/shell/path.ts` — refactor to re-export from `notch.ts` or thin wrapper (keep `buildRoundedRectPath` export stable)
- `lib/shell/__tests__/*.test.ts` (create)
- `plans/README.md` — update status row only

**Out of scope:**

- `components/shell-frame.tsx`, `hooks/use-shell-notch.ts` — pointer-hover behavior unchanged in this plan (may update imports only)
- React slot API (`Shell.Slot`, etc.) — plan 002
- ResizeObserver / portals — plans 003–004
- Removing dead shadcn scaffolding

## Git workflow

- Branch: `advisor/001-geometry-foundation`
- Commit message style: imperative, short (repo has `99bd0a0 init`)
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Add Vitest

Add to `package.json` devDependencies: `vitest` (latest compatible with Node 20).

Add script: `"test": "vitest run"` and `"test:watch": "vitest"`.

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: { environment: "node" },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

**Verify**: `npm install && npm test` → runs with 0 tests or a placeholder, exit 0

### Step 2: Extend types

In `lib/shell/types.ts`, add:

```ts
export type SlotAnchor = {
  edge: ShellEdge;
  center: number; // coordinate along edge in viewBox units
};

export type SlotExtent = {
  depth: number;      // inward from edge
  halfExtent: number; // half of along-edge span
};

export type NotchSpec = SlotAnchor & SlotExtent;
```

Keep existing `NotchPlacement` / `NotchSize` types for now — `use-shell-notch.ts` still uses them. Add type aliases or adapters if helpful.

**Verify**: `npx tsc --noEmit` → exit 0

### Step 3: Implement perimeter and anchor math

Create `lib/shell/perimeter.ts`:

- `getEdgeSpan(bounds, edge)` → `{ start, end, length }` where start/end are along-edge coordinates (x for top/bottom, y for left/right), excluding corner radii.
- `cornerInset(bounds)` → `bounds.rx + 1` (match existing `placement.ts` convention)

Create `lib/shell/anchors.ts`:

- `anchorPositions(bounds, edge, slotCount)` → `number[]`
- Formula: for `N` slots, `anchor[i] = start + (length / (N + 1)) * (i + 1)` using `getEdgeSpan`

Create `lib/shell/clamp.ts`:

- `clampExtent(bounds, anchor, edge, extent)` → clamped `SlotExtent`
- Cap `halfExtent` so notch stays within edge span minus margins
- Cap `depth` to a reasonable max (e.g. 80% of perpendicular interior distance) — use `SHELL_BOUNDS` interior

**Verify**: `npx tsc --noEmit` → exit 0

### Step 4: Unified notch path builder

Create `lib/shell/notch.ts`:

- `buildShellPath(bounds, notch: NotchSpec | null)` → SVG `d` string
- When `notch` is null or `depth === 0` or `halfExtent === 0`, return rounded rect (same output as current `buildRoundedRectPath`)
- Single implementation for all four edges — replace the four duplicated functions
- Preserve numeric output compatible with existing visual (test against known snapshots)

Refactor `lib/shell/path.ts` to re-export `buildRoundedRectPath` and `buildShellPath` from `notch.ts`. Keep exports stable for existing imports.

**Verify**: `npm run build` → exit 0 (existing shell frame still renders)

### Step 5: Notch rect helper

Create `lib/shell/notch-rect.ts`:

- `notchRect(bounds, notch: NotchSpec)` → `{ x, y, width, height }` in viewBox coordinates
- Mapping for each edge:
  - **bottom** (primary use case): `y = bottom - depth`, `height = depth`, `x = center - halfExtent`, `width = halfExtent * 2`
  - **top**: grows downward from top edge
  - **left/right**: analogous

Used by plan 004 for portal positioning.

**Verify**: `npx tsc --noEmit` → exit 0

### Step 6: Write geometry tests

Create `lib/shell/__tests__/anchors.test.ts`:

- 3 slots on left edge → centers evenly spaced
- 1 slot on bottom edge → center at midpoint

Create `lib/shell/__tests__/notch.test.ts`:

- Closed shell (null notch) path starts with `M` and ends with `Z`
- Bottom notch with `center=50, depth=10, halfExtent=20` contains `L` commands cutting upward from bottom
- Left notch from old implementation produces same path string as new builder for a fixed input (characterization)

Create `lib/shell/__tests__/notch-rect.test.ts`:

- Bottom notch rect: `y + height === bottom`, `width === 2 * halfExtent`

Create `lib/shell/__tests__/clamp.test.ts`:

- Oversized halfExtent is clamped to edge bounds

**Verify**: `npm test` → all tests pass

## Test plan

- New test files under `lib/shell/__tests__/`
- Cases: anchor spacing, path closed/open, bottom-edge rect mapping, clamp behavior
- Pattern: Vitest `describe`/`it`/`expect` — no existing test to copy; keep tests pure (no DOM unless needed)

**Verify**: `npm test` → ≥10 tests pass

## Done criteria

- [ ] `npm test` exits 0 with geometry tests for anchors, notch path, notch rect, clamp
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` exits 0
- [ ] `npm run lint` exits 0
- [ ] `lib/shell/notch.ts` is the single notch path implementation (no four duplicate builders)
- [ ] `buildRoundedRectPath` and `buildShellPath` remain importable from `lib/shell/path.ts`
- [ ] No files outside scope modified
- [ ] `plans/README.md` status row for 001 updated to DONE

## STOP conditions

Stop and report if:

- Current `lib/shell/path.ts` structure doesn't match excerpts (drifted since `99bd0a0`)
- Unified path builder cannot reproduce existing left-notch path for equivalent inputs after 2 fix attempts
- Vitest install conflicts with Next.js 16 build
- Fix requires changing `hooks/use-shell-notch.ts` behavior beyond import path updates

## Maintenance notes

- `notch-rect.ts` viewBox coords must stay in sync with `notch.ts` path geometry — change both together, run both test files
- When `preserveAspectRatio="none"` stretches the SVG, portal code in plan 004 must convert viewBox rects to pixels — document this in 004
- Reviewers: confirm characterization test matches pre-refactor path output, not just "looks right"
