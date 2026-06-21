# Plan 005: Handles and bottom search demo

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 99bd0a0..HEAD -- components/shell/ app/page.tsx`
> On mismatch → STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/004-portal-overlay.md
- **Category**: direction
- **Planned at**: commit `99bd0a0`, 2026-06-15

## Why this matters

This plan delivers the primary product scenario: a **bottom-edge search slot** with an optional handle outside the shell, async results growing upward inside the notch, and acceptable accessibility. It replaces the create-next-app boilerplate page with a real reshell demo and documents the API for future pages.

## Current state

After plan 004 (expected):

- Full shell stack: slots, measurement, portal, animation
- `app/page.tsx` has placeholder bottom slot
- No handle component outside shell yet
- Metadata still "Create Next App" (`app/layout.tsx:18-21`)

**Target UX:**

```
┌──────────────────────────────────────┐
│                                      │
│         page content                 │
│                                      │
│  ┌─ results ─────────────────┐     │
│  │ result 1                   │     │  ← portal, grows async
│  │ result 2                   │     │
│  └────────────────────────────┘     │
│ ╭──────────────────────────────────╮ │
│ │  🔍  Search...                   │ │  ← handle + input outside/at edge
└─┴──────────────────────────────────┴─┘
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

- `components/shell/shell-slot.tsx` — `handle?: ReactNode` prop
- `components/shell/shell-handle.tsx` (create) — positioned outside shell along edge normal
- `lib/shell/handle-position.ts` (create) — anchor → handle CSS position
- `components/shell/search-slot.tsx` (create) — reusable search + async results pattern
- `app/page.tsx` — bottom search demo using `Shell`
- `app/layout.tsx` — update metadata title/description to "reshell"
- `AGENTS.md` — add shell module map (short section)
- `lib/shell/__tests__/handle-position.test.ts` (create)
- `plans/README.md` — status row only

**Out of scope:**

- Real search API / backend — mock async with `setTimeout` or static filter
- Removing unused shadcn `button.tsx` (separate cleanup)
- Keyboard global shortcuts beyond basic a11y

## Steps

### Step 1: Handle positioning

Create `lib/shell/handle-position.ts`:

```ts
export function handleStyle(
  bounds: ShellBounds,
  anchor: SlotAnchor,
  svgElement: SVGSVGElement,
): CSSProperties;
```

- **Bottom edge**: handle sits just outside bottom border, centered on anchor x
- Offset outward by configurable `HANDLE_OFFSET_PX` (e.g. 8px)
- Convert anchor viewBox coordinate to pixel position using same math as plan 004

Create `components/shell/shell-handle.tsx`:

```tsx
<div
  style={handleStyle(...)}
  className="pointer-events-auto fixed z-[70]"
  onPointerEnter={() => activate(slotId)}
  // leave: use debounced deactivate or pointerenter on portal to maintain open state
>
  {handle}
</div>
```

**Hover persistence**: activating via handle must keep slot open when pointer moves into portal content. Use:

- `onPointerLeave` on handle with `relatedTarget` check, OR
- shared "hover intent" ref counting (handle + zone + portal)

**Verify**: Hover handle opens slot; moving into results doesn't close

### Step 2: Shell.Slot handle prop

```tsx
<Shell.Slot
  id="search"
  handle={<SearchIcon className="size-4" />}
>
  <SearchSlotContent />
</Shell.Slot>
```

- Render `ShellHandle` when `handle` provided
- Edge hit zone remains for hover on shell edge portion

**Verify**: Handle and edge zone both activate same slot

### Step 3: Search slot component

Create `components/shell/search-slot.tsx`:

```tsx
type SearchSlotProps = {
  onSearch: (query: string) => Promise<string[]>;
  placeholder?: string;
};

export function SearchSlot({ onSearch, placeholder }: SearchSlotProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    setLoading(true);
    let cancelled = false;
    onSearch(query).then((items) => {
      if (!cancelled) { setResults(items); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [query, onSearch]);

  return (
    <div className="flex w-[min(100vw-2rem,32rem)] flex-col">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="..."
      />
      {loading && <p className="text-muted-foreground text-sm">Searching…</p>}
      <ul className="max-h-64 overflow-y-auto">
        {results.map((r) => <li key={r}>{r}</li>)}
      </ul>
    </div>
  );
}
```

Layout order for bottom edge portal: **results above input** visually — use `flex-col-reverse` so measurer height includes both and notch grows upward over results.

**Verify**: Typing triggers async results; notch height increases as list grows

### Step 4: Page demo

Replace `app/page.tsx` boilerplate with:

```tsx
"use client";

import { Shell } from "@/components/shell";
import { SearchSlot } from "@/components/shell/search-slot";

async function mockSearch(q: string): Promise<string[]> {
  await new Promise((r) => setTimeout(r, 300));
  return ["alpha", "beta", "gamma"].filter((s) => s.includes(q.toLowerCase()));
}

export default function Home() {
  return (
    <Shell>
      <Shell.Edge side="bottom">
        <Shell.Slot id="search" handle={<span>⌕</span>}>
          <SearchSlot onSearch={mockSearch} placeholder="Search…" />
        </Shell.Slot>
      </Shell.Edge>
      <Shell.Content>
        <main className="flex flex-1 items-center justify-center p-8">
          <h1 className="text-2xl font-semibold">reshell</h1>
        </main>
      </Shell.Content>
    </Shell>
  );
}
```

Update `app/layout.tsx` metadata:

```ts
export const metadata: Metadata = {
  title: "reshell",
  description: "Shell chrome with edge slots",
};
```

**Verify**: `npm run dev` — full search flow works on bottom edge

### Step 5: Accessibility

- Remove `aria-hidden` from shell SVG if still present
- Active slot: `aria-expanded={true}` on handle
- `ShellHandle` uses `<button type="button">` when handle is not interactive
- `prefers-reduced-motion`: snap open/close (wire from plan 002/003 if missing)
- Search input: label via `aria-label` or visible placeholder

**Verify**: VoiceOver/NVDA spot-check OR axe DevTools no critical violations on shell

### Step 6: Document in AGENTS.md

Append section:

```markdown
## Shell

- `lib/shell/` — pure geometry (notch path, anchors, measurement mapping). Test with `npm test`.
- `components/shell/` — React API: `<Shell>`, `<Shell.Edge>`, `<Shell.Slot>`, `<Shell.Content>`.
- One active slot globally. Content size drives notch via ResizeObserver.
- Primary pattern: bottom-edge search via `SearchSlot`.
```

**Verify**: File exists and renders

## Test plan

- `handle-position.test.ts` — bottom anchor produces style with `bottom` offset
- Manual E2E: handle hover → type → results grow → notch expands

## Done criteria

- [x] `Shell.Slot` accepts optional `handle` rendered outside shell
- [x] Bottom search demo with async results grows notch upward
- [x] Hover handle → portal → results does not flicker closed
- [x] Metadata updated to reshell
- [x] `AGENTS.md` documents shell architecture
- [x] `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` exit 0
- [x] `plans/README.md` row 005 → DONE

## Implementation notes (deviation from snippets)

- `handleStyle` follows the codebase's percentage coordinate space (viewBox is
  `100×100` with `preserveAspectRatio="none"`) instead of a `getScreenCTM` pixel
  matrix — consistent with plan 004. It takes `(bounds, anchor, offsetPx)`; no
  `svgElement` arg is needed. `HANDLE_OFFSET_PX` lives in `constants.ts`.
- Hover persistence uses the shared `data-shell-slot` marker across the handle,
  the activation zone, and the portal (relatedTarget check on pointer-leave), so
  travel between handle and revealed content keeps the slot open.
- `SearchSlot` runs the search from the input change handler with a request
  counter (not a `useEffect` + cancelled flag) to satisfy the
  `react-hooks/set-state-in-effect` lint rule while still dropping stale
  responses on rapid typing.
- Reduced-motion snap was already wired in `useShellAnimation` (plans 002/003).
- The decorative frame SVG is `aria-hidden` (it carries no semantic content;
  live content renders in the overlay portal) — the plan's "remove aria-hidden"
  item did not apply since it was never present.

## STOP conditions

- Portal/handle hover persistence cannot be fixed without redesign — STOP and report with reproduction steps
- `flex-col-reverse` breaks measurement — try alternate layout (results first in DOM with visual reorder)

## Maintenance notes

- `SearchSlot` is the reference implementation for async-growing bottom slots
- Real API integration: only replace `mockSearch`; shell stack unchanged
- Reviewers: test empty query clears results and shrinks notch; test rapid typing doesn't race (cancelled flag)
