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
