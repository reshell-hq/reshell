import type { EdgeGutters, ShellBounds, Size } from "./types";

/** Used before the viewport is measured (SSR / first paint). */
const FALLBACK_VIEWPORT: Size = { width: 1280, height: 800 };

/**
 * Builds shell bounds from per-edge pixel gutters, so the margin between the
 * rim and the screen edge is a physical size set independently on each edge: a
 * full gutter where handles live, a sliver on a minimised edge (see ADR-0004).
 * Bounds stay in the shell percentage space (viewBox 100×100) for positioning;
 * only their values are derived from pixels.
 */
export function shellBoundsForViewport(
  viewport: Size,
  gutters: EdgeGutters,
  radius: number,
): ShellBounds {
  const width = viewport.width > 0 ? viewport.width : FALLBACK_VIEWPORT.width;
  const height =
    viewport.height > 0 ? viewport.height : FALLBACK_VIEWPORT.height;

  return {
    left: (gutters.left / width) * 100,
    top: (gutters.top / height) * 100,
    right: 100 - (gutters.right / width) * 100,
    bottom: 100 - (gutters.bottom / height) * 100,
    rx: radius,
    ry: radius,
  };
}
