import type { ShellBounds } from "./types";

/**
 * Representative static bounds (used as a fallback and in unit tests). At
 * runtime the shell derives bounds from {@link SHELL_GUTTER_PX} and the live
 * viewport so the gutter is a uniform pixel size on every edge.
 */
export const SHELL_BOUNDS: ShellBounds = {
  left: 5,
  top: 5,
  right: 95,
  bottom: 95,
  rx: 3,
  ry: 3,
};

/**
 * Gutter (CSS px) between the rim and the screen edge — sized to just hold a
 * handle (h-7 = 28px) plus its offset and a little breathing room.
 */
export const SHELL_GUTTER_PX = 40;

/** Canonical rim corner radius (viewBox units; aspect-corrected when drawn). */
export const SHELL_CORNER_RADIUS = 3;

/** Inset (CSS px) of slot content from the notch walls so it never paints over the rim. */
export const NOTCH_CONTENT_INSET_PX = 3;

/** Corner radius (CSS px) of the revealed slot content panel. */
export const NOTCH_CONTENT_RADIUS_PX = 8;

/** Corner radius (viewBox units) applied to the notch cut for smooth corners. */
export const NOTCH_CORNER_RADIUS = 1.5;

/** Minimum slot content size in CSS pixels before measurement completes. */
export const MIN_NOTCH_SIZE = {
  width: 160,
  height: 40,
} as const;

/** Gap (CSS px) between the shell rim and a slot handle in the gutter. */
export const HANDLE_OFFSET_PX = 6;

/**
 * Hover debounce: a handle must be hovered this long before its slot opens, so
 * sweeping the pointer across a cluster of handles doesn't cascade opens.
 */
export const HOVER_OPEN_DELAY_MS = 70;

/**
 * Grace period before a slot closes after the pointer leaves, so travel between
 * a handle and its revealed panel (or between adjacent handles) doesn't flicker.
 */
export const HOVER_CLOSE_DELAY_MS = 120;

export const NOTCH_ANIMATION = {
  smoothing: 0.18,
  settleThreshold: 0.05,
  visibleStrokeWidth: 1.5,
} as const;

export const SHELL_VIEWBOX = "0 0 100 100";
