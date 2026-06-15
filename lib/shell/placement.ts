import type { NotchPlacement, Point, ShellBounds } from "./types";

function cornerInset(bounds: ShellBounds): number {
  return bounds.rx + 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function horizontalCenterBounds(bounds: ShellBounds, halfExtent: number) {
  const inset = cornerInset(bounds) + halfExtent;
  return {
    min: bounds.left + inset,
    max: bounds.right - inset,
  };
}

function verticalCenterBounds(bounds: ShellBounds, halfExtent: number) {
  const inset = cornerInset(bounds) + halfExtent;
  return {
    min: bounds.top + inset,
    max: bounds.bottom - inset,
  };
}

export function closestPlacement(
  bounds: ShellBounds,
  pointer: Point,
): NotchPlacement {
  const { left, top, right, bottom } = bounds;

  const clampedX = clamp(pointer.x, left, right);
  const clampedY = clamp(pointer.y, top, bottom);

  const distanceToTop = Math.abs(pointer.y - top);
  const distanceToBottom = Math.abs(pointer.y - bottom);
  const distanceToLeft = Math.abs(pointer.x - left);
  const distanceToRight = Math.abs(pointer.x - right);

  const nearestDistance = Math.min(
    distanceToTop,
    distanceToBottom,
    distanceToLeft,
    distanceToRight,
  );

  if (nearestDistance === distanceToTop) {
    return { edge: "top", center: clampedX };
  }

  if (nearestDistance === distanceToBottom) {
    return { edge: "bottom", center: clampedX };
  }

  if (nearestDistance === distanceToLeft) {
    return { edge: "left", center: clampedY };
  }

  return { edge: "right", center: clampedY };
}

export function clampPlacement(
  bounds: ShellBounds,
  placement: NotchPlacement,
  halfExtent: number,
): NotchPlacement {
  if (placement.edge === "top" || placement.edge === "bottom") {
    const { min, max } = horizontalCenterBounds(bounds, halfExtent);
    return { edge: placement.edge, center: clamp(placement.center, min, max) };
  }

  const { min, max } = verticalCenterBounds(bounds, halfExtent);
  return { edge: placement.edge, center: clamp(placement.center, min, max) };
}
