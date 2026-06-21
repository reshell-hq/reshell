import { NOTCH_CORNER_RADIUS } from "./constants";
import type { NotchSpec, ShellBounds, ShellEdge, Size } from "./types";

/**
 * Used when the live viewport size is unknown (SSR, pre-measurement, unit
 * tests). Aspect ratio 1 means radii are left in their raw viewBox units, which
 * matches the original square-coordinate behaviour.
 */
const UNIT_VIEWPORT: Size = { width: 1, height: 1 };

function aspectOf(viewport: Size): number {
  if (viewport.width <= 0 || viewport.height <= 0) {
    return 1;
  }
  return viewport.width / viewport.height;
}

/**
 * Corner radii (viewBox units) that render as visually circular despite
 * `preserveAspectRatio="none"` stretching the 100×100 user space to fill a
 * non-square viewport. The vertical radius is the canonical `r`; the horizontal
 * radius is divided by the aspect ratio so both map to the same pixel length.
 * See docs/adr/0001.
 */
function circularRadii(
  r: number,
  viewport: Size,
): { rx: number; ry: number } {
  const aspect = aspectOf(viewport);
  return { rx: r / aspect, ry: r };
}

/**
 * Notch inner-corner radii, aspect-corrected like the outer corners and clamped
 * so the rounding never exceeds the room available on each axis of the pocket.
 */
function notchRadii(
  edge: ShellEdge,
  depth: number,
  halfExtent: number,
  viewport: Size,
): { nrx: number; nry: number } {
  const aspect = aspectOf(viewport);
  const baseY = NOTCH_CORNER_RADIUS;
  const baseX = NOTCH_CORNER_RADIUS / aspect;

  if (edge === "top" || edge === "bottom") {
    // depth runs vertically, the pocket spans 2·halfExtent horizontally.
    return {
      nrx: Math.min(baseX, halfExtent),
      nry: Math.min(baseY, depth / 2),
    };
  }

  // left | right: depth runs horizontally, the pocket spans 2·halfExtent.
  return {
    nrx: Math.min(baseX, depth / 2),
    nry: Math.min(baseY, halfExtent),
  };
}

export function buildRoundedRectPath(
  bounds: ShellBounds,
  viewport: Size = UNIT_VIEWPORT,
): string {
  const { left, top, right, bottom } = bounds;
  const { rx, ry } = circularRadii(bounds.ry, viewport);

  return [
    `M ${left + rx} ${top}`,
    `H ${right - rx}`,
    `Q ${right} ${top} ${right} ${top + ry}`,
    `V ${bottom - ry}`,
    `Q ${right} ${bottom} ${right - rx} ${bottom}`,
    `H ${left + rx}`,
    `Q ${left} ${bottom} ${left} ${bottom - ry}`,
    `V ${top + ry}`,
    `Q ${left} ${top} ${left + rx} ${top}`,
    "Z",
  ].join(" ");
}

function hasVisibleNotch(notch: NotchSpec | null): notch is NotchSpec {
  return notch !== null && notch.depth > 0 && notch.halfExtent > 0;
}

function buildNotchPath(
  bounds: ShellBounds,
  notch: NotchSpec,
  viewport: Size,
): string {
  const { left, top, right, bottom } = bounds;
  const { edge, center, depth, halfExtent } = notch;
  const { rx, ry } = circularRadii(bounds.ry, viewport);
  const { nrx, nry } = notchRadii(edge, depth, halfExtent, viewport);

  switch (edge) {
    case "left": {
      const notchTop = center - halfExtent;
      const notchBottom = center + halfExtent;
      const wall = left + depth;
      return [
        `M ${left + rx} ${top}`,
        `H ${right - rx}`,
        `Q ${right} ${top} ${right} ${top + ry}`,
        `V ${bottom - ry}`,
        `Q ${right} ${bottom} ${right - rx} ${bottom}`,
        `H ${left + rx}`,
        `Q ${left} ${bottom} ${left} ${bottom - ry}`,
        `V ${notchBottom + nry}`,
        `Q ${left} ${notchBottom} ${left + nrx} ${notchBottom}`,
        `H ${wall - nrx}`,
        `Q ${wall} ${notchBottom} ${wall} ${notchBottom - nry}`,
        `V ${notchTop + nry}`,
        `Q ${wall} ${notchTop} ${wall - nrx} ${notchTop}`,
        `H ${left + nrx}`,
        `Q ${left} ${notchTop} ${left} ${notchTop - nry}`,
        `V ${top + ry}`,
        `Q ${left} ${top} ${left + rx} ${top}`,
        "Z",
      ].join(" ");
    }
    case "right": {
      const notchTop = center - halfExtent;
      const notchBottom = center + halfExtent;
      const wall = right - depth;
      return [
        `M ${left + rx} ${top}`,
        `H ${right - rx}`,
        `Q ${right} ${top} ${right} ${top + ry}`,
        `V ${notchTop - nry}`,
        `Q ${right} ${notchTop} ${right - nrx} ${notchTop}`,
        `H ${wall + nrx}`,
        `Q ${wall} ${notchTop} ${wall} ${notchTop + nry}`,
        `V ${notchBottom - nry}`,
        `Q ${wall} ${notchBottom} ${wall + nrx} ${notchBottom}`,
        `H ${right - nrx}`,
        `Q ${right} ${notchBottom} ${right} ${notchBottom + nry}`,
        `V ${bottom - ry}`,
        `Q ${right} ${bottom} ${right - rx} ${bottom}`,
        `H ${left + rx}`,
        `Q ${left} ${bottom} ${left} ${bottom - ry}`,
        `V ${top + ry}`,
        `Q ${left} ${top} ${left + rx} ${top}`,
        "Z",
      ].join(" ");
    }
    case "top": {
      const notchLeft = center - halfExtent;
      const notchRight = center + halfExtent;
      const wall = top + depth;
      return [
        `M ${left + rx} ${top}`,
        `H ${notchLeft - nrx}`,
        `Q ${notchLeft} ${top} ${notchLeft} ${top + nry}`,
        `V ${wall - nry}`,
        `Q ${notchLeft} ${wall} ${notchLeft + nrx} ${wall}`,
        `H ${notchRight - nrx}`,
        `Q ${notchRight} ${wall} ${notchRight} ${wall - nry}`,
        `V ${top + nry}`,
        `Q ${notchRight} ${top} ${notchRight + nrx} ${top}`,
        `H ${right - rx}`,
        `Q ${right} ${top} ${right} ${top + ry}`,
        `V ${bottom - ry}`,
        `Q ${right} ${bottom} ${right - rx} ${bottom}`,
        `H ${left + rx}`,
        `Q ${left} ${bottom} ${left} ${bottom - ry}`,
        `V ${top + ry}`,
        `Q ${left} ${top} ${left + rx} ${top}`,
        "Z",
      ].join(" ");
    }
    case "bottom": {
      const notchLeft = center - halfExtent;
      const notchRight = center + halfExtent;
      const wall = bottom - depth;
      return [
        `M ${left + rx} ${top}`,
        `H ${right - rx}`,
        `Q ${right} ${top} ${right} ${top + ry}`,
        `V ${bottom - ry}`,
        `Q ${right} ${bottom} ${right - rx} ${bottom}`,
        `H ${notchRight + nrx}`,
        `Q ${notchRight} ${bottom} ${notchRight} ${bottom - nry}`,
        `V ${wall + nry}`,
        `Q ${notchRight} ${wall} ${notchRight - nrx} ${wall}`,
        `H ${notchLeft + nrx}`,
        `Q ${notchLeft} ${wall} ${notchLeft} ${wall + nry}`,
        `V ${bottom - nry}`,
        `Q ${notchLeft} ${bottom} ${notchLeft - nrx} ${bottom}`,
        `H ${left + rx}`,
        `Q ${left} ${bottom} ${left} ${bottom - ry}`,
        `V ${top + ry}`,
        `Q ${left} ${top} ${left + rx} ${top}`,
        "Z",
      ].join(" ");
    }
  }
}

export function buildShellPath(
  bounds: ShellBounds,
  notch: NotchSpec | null,
  viewport: Size = UNIT_VIEWPORT,
): string {
  if (!hasVisibleNotch(notch)) {
    return buildRoundedRectPath(bounds, viewport);
  }

  return buildNotchPath(bounds, notch, viewport);
}
