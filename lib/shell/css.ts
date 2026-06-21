import type { CSSProperties } from "react";
import {
  NOTCH_CONTENT_INSET_PX,
  NOTCH_CONTENT_RADIUS_PX,
} from "./constants";
import type {
  NotchSpec,
  ShellBounds,
  ShellEdge,
  SlotAnchor,
  SlotExtent,
} from "./types";

const VIEWBOX_SIZE = 100;
const I = NOTCH_CONTENT_INSET_PX;

/** ViewBox units map 1:1 to percentages since the viewBox is 100×100. */
function pct(value: number): string {
  return `${value}%`;
}

/** `value%` shifted inward by the content inset. */
function inset(value: number): string {
  return `calc(${value}% + ${I}px)`;
}

/** `value%` shrunk by the inset on both ends. */
function insetSpan(value: number): string {
  return `calc(${value}% - ${2 * I}px)`;
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
 * Positions slot content inside the notch cavity. The cavity is bounded by the
 * rim edge on the outer side (matching the SVG notch opening) and the animated
 * wall on the inner side, then pulled in by a small pixel inset on every side
 * so the content never paints over the rim stroke (rounded corners included).
 */
export function notchContentStyle(
  bounds: ShellBounds,
  notch: NotchSpec,
): CSSProperties {
  const { edge, center, depth, halfExtent } = notch;
  const span = halfExtent * 2;
  const borderRadius = `${NOTCH_CONTENT_RADIUS_PX}px`;

  switch (edge) {
    case "bottom":
      return {
        position: "fixed",
        left: inset(center - halfExtent),
        width: insetSpan(span),
        top: inset(bounds.bottom - depth),
        bottom: inset(VIEWBOX_SIZE - bounds.bottom),
        borderRadius,
      };
    case "top":
      return {
        position: "fixed",
        left: inset(center - halfExtent),
        width: insetSpan(span),
        top: inset(bounds.top),
        bottom: inset(VIEWBOX_SIZE - (bounds.top + depth)),
        borderRadius,
      };
    case "left":
      return {
        position: "fixed",
        top: inset(center - halfExtent),
        height: insetSpan(span),
        left: inset(bounds.left),
        right: inset(VIEWBOX_SIZE - (bounds.left + depth)),
        borderRadius,
      };
    case "right":
      return {
        position: "fixed",
        top: inset(center - halfExtent),
        height: insetSpan(span),
        right: inset(VIEWBOX_SIZE - bounds.right),
        left: inset(bounds.right - depth),
        borderRadius,
      };
  }
}

/**
 * CSS `transform-origin` that pins a revealed slot panel to its docking edge,
 * so scaling the panel during reveal grows it outward from the notch anchor
 * (e.g. a bottom slot grows upward from the bottom center).
 */
export function transformOriginForEdge(edge: ShellEdge): string {
  switch (edge) {
    case "bottom":
      return "bottom center";
    case "top":
      return "top center";
    case "left":
      return "left center";
    case "right":
      return "right center";
  }
}

/**
 * Positions the full-size content inside the clipped cavity and scales it by
 * the open progress, pinned to the docking edge. Because the cavity is also
 * `box × progress`, the scaled content exactly fills it — content starts tiny
 * inside the small notch and zooms to full size as it opens (see ADR-0003).
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

/**
 * Positions a slot handle entirely in the gutter (the margin between the rim
 * and the screen edge), anchored by its rim-facing edge `offsetPx` away from
 * the rim so it never overlaps the line. Uses the shell percentage coordinate
 * space (% maps 1:1 to viewBox units); the `translate` pulls the handle fully
 * off the rim along the edge normal and centers it along the edge.
 */
export function handleStyle(
  bounds: ShellBounds,
  anchor: SlotAnchor,
  offsetPx: number,
): CSSProperties {
  const { edge, center } = anchor;

  switch (edge) {
    case "bottom":
      return {
        position: "fixed",
        left: `${center}%`,
        top: `calc(${bounds.bottom}% + ${offsetPx}px)`,
        transform: "translate(-50%, 0)",
      };
    case "top":
      return {
        position: "fixed",
        left: `${center}%`,
        top: `calc(${bounds.top}% - ${offsetPx}px)`,
        transform: "translate(-50%, -100%)",
      };
    case "left":
      return {
        position: "fixed",
        top: `${center}%`,
        left: `calc(${bounds.left}% - ${offsetPx}px)`,
        transform: "translate(-100%, -50%)",
      };
    case "right":
      return {
        position: "fixed",
        top: `${center}%`,
        left: `calc(${bounds.right}% + ${offsetPx}px)`,
        transform: "translate(0, -50%)",
      };
  }
}
