import type { ShellBounds } from "./types";

export const SHELL_BOUNDS: ShellBounds = {
  left: 5,
  top: 2,
  right: 98,
  bottom: 98,
  rx: 3,
  ry: 3,
};

export const NOTCH_LIMITS = {
  maxDepth: 14,
  maxHalfExtent: 10,
} as const;

/** Corner radius (viewBox units) applied to the notch cut for smooth corners. */
export const NOTCH_CORNER_RADIUS = 1.5;

/** Minimum slot content size in CSS pixels before measurement completes. */
export const MIN_NOTCH_SIZE = {
  width: 160,
  height: 40,
} as const;

export const NOTCH_ANIMATION = {
  smoothing: 0.18,
  settleThreshold: 0.05,
  hitStrokeWidth: 20,
  visibleStrokeWidth: 0.8,
} as const;

export const SHELL_VIEWBOX = "0 0 100 100";
