# Plan 003: Dynamic content measurement

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 99bd0a0..HEAD -- lib/shell/ components/shell/ hooks/`
> On mismatch with excerpts → STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/002-slot-api-activation.md
- **Category**: tech-debt
- **Planned at**: commit `99bd0a0`, 2026-06-15

## Why this matters

Slot notch size must follow content dimensions, not fixed `NOTCH_LIMITS`. The primary use case is a **bottom-edge search slot**: input sits near the bottom handle; results render above and **grow asynchronously** as data loads. The shell must re-measure and smoothly animate the notch larger when results arrive — without jumping or closing the slot.

## Current state

After plan 002 (expected):

- `Shell.Slot` registers slots and activates on hover
- Notch uses fixed `NOTCH_LIMITS.maxDepth` and `maxHalfExtent`
- Slot children render inline (not yet portaled)

**Edge → extent mapping (product rule):**

| Edge | `depth` (inward) | `halfExtent` (along edge) |
|------|------------------|---------------------------|
| bottom | content height | content width / 2 |
| top | content height | content width / 2 |
| left | content width | content height / 2 |
| right | content width | content height / 2 |

For bottom search: results stack upward → total content height drives `depth`; search bar + results width drives `halfExtent`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Tests | `npm test` | all pass |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope:**

- `lib/shell/map-content-size.ts` (create) — `contentSizeToExtent(edge, { width, height }) → SlotExtent`
- `lib/shell/clamp.ts` — extend clamp for dynamic extents
- `components/shell/shell-context.tsx` — per-slot `contentSize` in registry
- `components/shell/shell-slot.tsx` — measurer + ResizeObserver
- `components/shell/use-slot-measure.ts` (create)
- `hooks/use-shell-animation.ts` — target size from measured content, re-animate on resize while active
- `lib/shell/__tests__/map-content-size.test.ts` (create)
- `lib/shell/constants.ts` — add `MIN_NOTCH_SIZE` for stable initial open (avoid 0→full jump)
- `plans/README.md` — status row only

**Out of scope:**

- Portal rendering (content still inline or hidden) — plan 004
- Handle outside shell — plan 005
- Real search API — plan 005

## Steps

### Step 1: Content size → extent mapping

Create `lib/shell/map-content-size.ts`:

```ts
export function contentSizeToExtent(
  edge: ShellEdge,
  size: { width: number; height: number },
): SlotExtent {
  switch (edge) {
    case "bottom":
    case "top":
      return { depth: size.height, halfExtent: size.width / 2 };
    case "left":
    case "right":
      return { depth: size.width, halfExtent: size.height / 2 };
  }
}
```

Add tests for bottom edge: `{ width: 400, height: 300 }` → `{ depth: 300, halfExtent: 200 }`.

**Verify**: `npm test` → new tests pass

### Step 2: Measurer hook

Create `components/shell/use-slot-measure.ts`:

```ts
export function useSlotMeasure(onResize: (size: { width: number; height: number }) => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      onResize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [onResize]);
  return ref;
}
```

**Measurer rendering strategy** in `Shell.Slot`:

```tsx
<div
  ref={measureRef}
  className="fixed left-[-9999px] top-0 w-max visibility-hidden pointer-events-none"
  aria-hidden
>
  {children}
</div>
```

- Always mounted so size is known before first activate
- `w-max` lets content define natural width
- Report size to context via `updateSlotContentSize(id, size)`

Add `MIN_NOTCH_SIZE` to constants (e.g. `depth: 40, halfExtent: 80` in pixels before viewBox conversion — document conversion approach):

- On first activate before measure completes: use `MIN_NOTCH_SIZE`
- Once measured: use clamped extent

**Verify**: `npx tsc --noEmit` → exit 0

### Step 3: Context size tracking

Extend `ShellContext`:

```ts
slotContentSizes: Map<string, { width: number; height: number }>;
updateSlotContentSize: (id: string, size: { width: number; height: number }) => void;
getSlotExtent: (id: string) => SlotExtent | null;
```

`getSlotExtent(id)`:

1. Read content size from map (or MIN fallback)
2. `contentSizeToExtent(edge, size)`
3. `clampExtent(bounds, anchor, edge, extent)`

When `updateSlotContentSize` fires and `id === activeSlotId`, animation controller retargets without deactivating.

**Verify**: `npm test` → pass

### Step 4: Animate to measured size

Update `hooks/use-shell-animation.ts`:

- `targetNotch = activeSlot ? { ...anchor, ...getSlotExtent(activeSlot) } : null`
- Subscribe to context size changes — when active slot's size updates, call controller retarget (same as `move` but update extent)
- Notch smoothly grows when async content loads

Refactor `lib/shell/animation.ts` if needed:

- Separate retargeting placement vs extent (placement fixed per slot, extent animates)

**Verify**: Manual test with async content stub in `Shell.Slot`:

```tsx
function GrowingResults() {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => { setTimeout(() => setItems(["a","b","c"]), 500); }, []);
  return (
    <div>
      <input placeholder="Search" />
      <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>
    </div>
  );
}
```

Activate slot → notch opens to min size → grows when items appear.

### Step 5: ViewBox vs pixel conversion

Measurer works in CSS pixels; path geometry uses viewBox 0–100.

Create `lib/shell/scale.ts`:

```ts
export function pixelsToViewBox(
  pixels: { width: number; height: number },
  svgElement: SVGSVGElement,
): { width: number; height: number };
```

Use SVG `getScreenCTM()` and viewBox dimensions (same approach as `clientToViewBox` in `lib/shell/coordinates.ts`).

Apply in `getSlotExtent` when converting measured pixels before `contentSizeToExtent`.

**Verify**: `npm test` with mocked conversion function OR integration test with jsdom SVG if feasible

## Test plan

- `map-content-size.test.ts` — all four edges
- Manual async growth test on bottom slot
- Optional: mock ResizeObserver in vitest for measure hook

## Done criteria

- [ ] Notch `depth` and `halfExtent` derive from measured content, not `NOTCH_LIMITS` max constants
- [ ] Bottom-edge slot grows smoothly when async children increase height
- [ ] `MIN_NOTCH_SIZE` prevents zero-size flash on first open
- [ ] `clampExtent` prevents notch exceeding shell interior
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` exit 0
- [ ] `plans/README.md` row 003 → DONE

## STOP conditions

- ResizeObserver not available in test environment — use manual verification only, document in PR
- Pixel→viewBox conversion cannot be made consistent with `preserveAspectRatio="none"` after 2 attempts — STOP and report (plan 004 may need different approach)

## Maintenance notes

- Async images/fonts in slot content will trigger further ResizeObserver callbacks — expected; ensure debounce only if perf issue (start without debounce)
- Search results should use `key` on list items to avoid remount storms
- Reviewers: verify notch grows **upward** on bottom edge (depth increases, rect y decreases)
