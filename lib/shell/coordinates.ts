import type { CSSProperties } from "react";
import type { NotchSpec, ShellBounds, SlotAnchor, SlotExtent } from "./types";

const VIEWBOX_SIZE = 100;

/** ViewBox units map 1:1 to percentages since the viewBox is 100×100. */
function pct(value: number): string {
  return `${value}%`;
}

export function anchorHitZoneStyle(
  anchor: SlotAnchor,
  extent: SlotExtent,
): CSSProperties {
  const { edge, center } = anchor;
  const { depth, halfExtent } = extent;
  const span = halfExtent * 2;

  switch (edge) {
    case "bottom":
      return {
        position: "fixed",
        left: pct(center - halfExtent),
        width: pct(span),
        bottom: 0,
        height: pct(depth),
      };
    case "top":
      return {
        position: "fixed",
        left: pct(center - halfExtent),
        width: pct(span),
        top: 0,
        height: pct(depth),
      };
    case "left":
      return {
        position: "fixed",
        top: pct(center - halfExtent),
        height: pct(span),
        left: 0,
        width: pct(depth),
      };
    case "right":
      return {
        position: "fixed",
        top: pct(center - halfExtent),
        height: pct(span),
        right: 0,
        width: pct(depth),
      };
  }
}

/**
 * Positions slot content inside the notch cavity, pinning the outer side to the
 * screen edge so the pocket reads as open (no floating border at the shell
 * boundary). The inner side tracks the animated notch wall.
 */
export function notchContentStyle(
  bounds: ShellBounds,
  notch: NotchSpec,
): CSSProperties {
  const { edge, center, depth, halfExtent } = notch;
  const span = halfExtent * 2;

  switch (edge) {
    case "bottom":
      return {
        position: "fixed",
        left: pct(center - halfExtent),
        width: pct(span),
        top: pct(bounds.bottom - depth),
        bottom: 0,
      };
    case "top":
      return {
        position: "fixed",
        left: pct(center - halfExtent),
        width: pct(span),
        top: 0,
        bottom: pct(VIEWBOX_SIZE - (bounds.top + depth)),
      };
    case "left":
      return {
        position: "fixed",
        top: pct(center - halfExtent),
        height: pct(span),
        left: 0,
        right: pct(VIEWBOX_SIZE - (bounds.left + depth)),
      };
    case "right":
      return {
        position: "fixed",
        top: pct(center - halfExtent),
        height: pct(span),
        right: 0,
        left: pct(bounds.right - depth),
      };
  }
}
