# Plan 004: Portal overlay and content reveal

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 99bd0a0..HEAD -- components/shell/ lib/shell/ hooks/`
> On mismatch → STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/003-dynamic-content-measurement.md
- **Category**: tech-debt
- **Planned at**: commit `99bd0a0`, 2026-06-15

## Why this matters

Slot content (search input, results list, panels) must render inside the animated notch cavity, clipped and scaled as the path opens. Inline rendering in a hidden measurer duplicates DOM; portaling the visible copy into a shell overlay keeps one measurement source and correct z-index stacking. Content should appear to grow from the edge anchor — matching the original notch diagram.

## Current state

After plan 003 (expected):

- `Shell.Slot` has hidden measurer with ResizeObserver
- Active slot drives animated `NotchSpec` on SVG path
- `lib/shell/notch-rect.ts` — viewBox rect for notch
- `lib/shell/scale.ts` — pixel ↔ viewBox conversion
- Slot children may still render in measurer only (not visible when active)

**Shell structure after plan 002:**

```tsx
<ShellProvider>
  <div className="relative min-h-full flex flex-col">
    <ShellFrame />   {/* SVG */}
    {children}       {/* Edge, Slot, Content */}
  </div>
</ShellProvider>
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` | exit 0 |
| Tests | `npm test` | all pass |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope:**

- `components/shell/shell-overlay.tsx` (create) — fixed overlay container + portal target ref
- `components/shell/shell-slot-portal.tsx` (create)
- `components/shell/shell.tsx` — add overlay layer
- `components/shell/shell-slot.tsx` — measurer only for children; visible copy via portal when active
- `lib/shell/viewbox-to-css.ts` (create) — convert `notchRect` + animated size to CSS `top/left/width/height` in pixels relative to shell root
- `hooks/use-shell-animation.ts` — expose `animatedNotch` to context each frame
- `components/shell/shell-context.tsx` — `animatedNotch`, `overlayRef`
- `plans/README.md` — status row only

**Out of scope:**

- Handles outside shell — plan 005
- Full search UI — plan 005
- `document.body` portals — use in-shell overlay only unless clipping forces otherwise

## Steps

### Step 1: Overlay container

Create `components/shell/shell-overlay.tsx`:

```tsx
export function ShellOverlay({ overlayRef }: { overlayRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-[60]"
      aria-live="polite"
    />
  );
}
```

Add to `Shell` layout **after** `ShellFrame` (z-50) so content sits above frame stroke.

Store `overlayRef` in context.

**Verify**: `npx tsc --noEmit` → exit 0

### Step 2: Expose animated notch to React

Update animation hook to write `animatedNotch: NotchSpec | null` into context each frame (not only SVG attribute). Use `useSyncExternalStore` or callback ref pattern to avoid excessive re-renders — throttle to rAF is acceptable since animation already runs on rAF.

Context consumers need:

- `animatedNotch` — current lerped notch spec (viewBox units)
- `isSlotActive(id)` — boolean

**Verify**: `npm run build` → exit 0

### Step 3: ViewBox rect → CSS pixels

Create `lib/shell/viewbox-to-css.ts`:

```ts
export function notchRectToCss(
  bounds: ShellBounds,
  notch: NotchSpec,
  svgElement: SVGSVGElement,
): { top: number; left: number; width: number; height: number };
```

- Call `notchRect(bounds, notch)` for viewBox rect
- Map corners through `clientToViewBox` inverse: viewBox point → client pixels
- Account for `preserveAspectRatio="none"` stretching

Add unit tests with a mock SVG or fixed transform matrix.

**Verify**: `npm test` → pass

### Step 4: Slot portal

Create `components/shell/shell-slot-portal.tsx`:

```tsx
export function ShellSlotPortal({ slotId, children }: { slotId: string; children: ReactNode }) {
  const { activeSlotId, animatedNotch, overlayRef, bounds, svgRef } = useShell();
  if (activeSlotId !== slotId || !animatedNotch || !overlayRef.current) return null;

  const rect = notchRectToCss(bounds, animatedNotch, svgRef.current!);
  const origin = transformOriginForEdge(animatedNotch.edge);

  return createPortal(
    <div
      className="pointer-events-auto overflow-hidden bg-background"
      style={{
        position: "fixed",
        ...rect,
        transform: `scale(${animatedNotch.depth / targetDepth})`, // or derive from animated/target ratio
        transformOrigin: origin,
      }}
    >
      {children}
    </div>,
    overlayRef.current,
  );
}
```

Refine scale logic: content reveal syncs with `animatedNotch.depth / targetDepth` and `animatedNotch.halfExtent / targetHalfExtent` — use the smaller ratio or per-axis scale for bottom edge (scaleY from bottom).

For **bottom edge**: `transformOrigin: "bottom center"` so content grows upward.

Update `Shell.Slot`:

```tsx
<>
  <div ref={measureRef} className="...hidden measurer...">{children}</div>
  <ShellSlotPortal slotId={id}>{children}</ShellSlotPortal>
  <SlotHitZone ... />
</>
```

Visible portal duplicates children — acceptable for search UI; optimize later with render props if needed.

**Verify**: Activate bottom slot — content visible inside notch, clipped by `overflow-hidden`

### Step 5: Content reveal polish

- Animate opacity: `opacity: depth > threshold ? 1 : 0` with short transition OR tie to scale
- `overflow-y: auto` on portal when results exceed max depth (after clamp) — scroll inside cavity
- Remove duplicate visible render outside portal

**Verify**: Async growing results (plan 003 stub) expand portal and notch together

## Test plan

- `viewbox-to-css.test.ts` with known matrix
- Manual: bottom slot content aligned to notch, grows upward with async list

## Done criteria

- [ ] Active slot content renders via `createPortal` into shell overlay
- [ ] Measurer remains hidden; portal shows visible copy
- [ ] Bottom-edge content uses `transformOrigin: bottom center`
- [ ] Notch and portal resize together when content grows
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` exit 0
- [ ] `plans/README.md` row 004 → DONE

## STOP conditions

- `createPortal` target not ready on first activate — fix with layout effect, don't skip portal
- viewBox→CSS math wrong after 2 fix attempts on bottom edge — STOP and report with measured vs expected values
- Duplicate children cause focus/input bugs — document; may need single-instance pattern in follow-up

## Maintenance notes

- Portal duplicates DOM — search input focus may need `autoFocus` on portal copy or shared ref (plan 005)
- Max notch depth clamp + `overflow-y: auto` is required for unbounded result lists
- Reviewers: test on wide and tall viewports (`preserveAspectRatio="none"` distortion)
