import type { CSSProperties } from "react";
import type { NotchSpec, ShellBounds, SlotAnchor, SlotExtent } from "./types";

const VIEWBOX_SIZE = { width: 100, height: 100 };

function toPercentX(value: number): string {
  return `${(value / VIEWBOX_SIZE.width) * 100}%`;
}

function toPercentY(value: number): string {
  return `${(value / VIEWBOX_SIZE.height) * 100}%`;
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
        left: toPercentX(center - halfExtent),
        width: toPercentX(span),
        bottom: 0,
        height: toPercentY(depth),
      };
    case "top":
      return {
        position: "fixed",
        left: toPercentX(center - halfExtent),
        width: toPercentX(span),
        top: 0,
        height: toPercentY(depth),
      };
    case "left":
      return {
        position: "fixed",
        top: toPercentY(center - halfExtent),
        height: toPercentY(span),
        left: 0,
        width: toPercentX(depth),
      };
    case "right":
      return {
        position: "fixed",
        top: toPercentY(center - halfExtent),
        height: toPercentY(span),
        right: 0,
        width: toPercentX(depth),
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
        left: toPercentX(center - halfExtent),
        width: toPercentX(span),
        top: toPercentY(bounds.bottom - depth),
        bottom: 0,
      };
    case "top":
      return {
        position: "fixed",
        left: toPercentX(center - halfExtent),
        width: toPercentX(span),
        top: 0,
        bottom: toPercentY(VIEWBOX_SIZE.height - (bounds.top + depth)),
      };
    case "left":
      return {
        position: "fixed",
        top: toPercentY(center - halfExtent),
        height: toPercentY(span),
        left: 0,
        right: toPercentX(VIEWBOX_SIZE.width - (bounds.left + depth)),
      };
    case "right":
      return {
        position: "fixed",
        top: toPercentY(center - halfExtent),
        height: toPercentY(span),
        right: 0,
        left: toPercentX(bounds.right - depth),
      };
  }
}
