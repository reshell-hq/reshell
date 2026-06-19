# Aspect-corrected corner radii for the shell rim

The shell SVG uses `viewBox="0 0 100 100"` with `preserveAspectRatio="none"` so that CSS percentages map 1:1 to viewBox units, letting handle and portal positioning stay in `%` with no screen-matrix math. The cost is that a uniform corner radius (`rx=ry=3`) renders as an ellipse on any non-square viewport, producing visibly stretched, inconsistent-looking corners.

We keep the `100×100` / `preserveAspectRatio="none"` coordinate system (and thus all `%`-based positioning) and instead correct *only the path builder*: it receives the viewport aspect ratio and emits per-axis radii (`rx = R·100/W`, `ry = R·100/H`) for both the outer rounded rect and the notch's inner corners, so the stretch cancels and corners render as true circles of radius `R`. The line width was already constant via `vectorEffect="nonScalingStroke"`.

## Considered Options

- **Pixel-accurate viewBox** (`viewBox="0 0 W H"`, normal `preserveAspectRatio`): corners are naturally circular, but it discards the 1:1 %↔unit convenience and forces `handle-position.ts` / `coordinates.ts` to convert to pixels and recompute on resize. Rejected as too invasive.
- **Aspect-corrected radii** (chosen): contained to `notch.ts` plus threading live viewport dimensions to the path builder.
