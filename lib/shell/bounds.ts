import type { ShellBounds, Size } from "./types";

/** Used before the viewport is measured (SSR / first paint). */
const FALLBACK_VIEWPORT: Size = { width: 1280, height: 800 };

/**
 * Builds shell bounds from a uniform pixel gutter, so the margin between the
 * rim and the screen edge is the same physical size on every edge (just enough
 * to hold the handles) rather than a percentage that balloons on the wide axis.
 * Bounds stay in the shell percentage space (viewBox 100×100) for positioning;
 * only their values are derived from pixels.
 */
export function shellBoundsForViewport(
  viewport: Size,
  gutterPx: number,
  radius: number,
): ShellBounds {
  const width = viewport.width > 0 ? viewport.width : FALLBACK_VIEWPORT.width;
  const height =
    viewport.height > 0 ? viewport.height : FALLBACK_VIEWPORT.height;
  const gx = (gutterPx / width) * 100;
  const gy = (gutterPx / height) * 100;

  return {
    left: gx,
    top: gy,
    right: 100 - gx,
    bottom: 100 - gy,
    rx: radius,
    ry: radius,
  };
}
