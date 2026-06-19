import type { CSSProperties } from "react";
import type {
  NotchSpec,
  ShellBounds,
  ShellEdge,
  SlotAnchor,
  SlotExtent,
} from "./types";
import { transformOriginForEdge } from "./viewbox-to-css";

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

/**
 * Positions the full-size content inside the clipped cavity and scales it by
 * the open progress, pinned to the docking edge. Because the cavity is also
 * `box × progress`, the scaled content exactly fills it — content starts tiny
 * inside the small notch and zooms to full size as it opens (see
 * docs/adr/0003). The content keeps its natural layout; only the paint scales.
 */
export function revealContentStyle(
  edge: ShellEdge,
  progress: number,
): CSSProperties {
  const scale = Math.max(progress, 0);
  const transformOrigin = transformOriginForEdge(edge);

  switch (edge) {
    case "bottom":
      return {
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin,
      };
    case "top":
      return {
        position: "absolute",
        top: 0,
        left: "50%",
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin,
      };
    case "left":
      return {
        position: "absolute",
        left: 0,
        top: "50%",
        transform: `translateY(-50%) scale(${scale})`,
        transformOrigin,
      };
    case "right":
      return {
        position: "absolute",
        right: 0,
        top: "50%",
        transform: `translateY(-50%) scale(${scale})`,
        transformOrigin,
      };
  }
}
