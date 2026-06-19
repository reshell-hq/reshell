import type { CSSProperties } from "react";
import type { ShellBounds, SlotAnchor } from "./types";

/**
 * Positions a slot handle entirely in the gutter (the margin between the rim
 * and the screen edge), anchored by its rim-facing edge `offsetPx` away from
 * the rim so it never overlaps the line. Uses the shell percentage coordinate
 * space (viewBox is 100×100 with `preserveAspectRatio="none"`, so % maps 1:1 to
 * viewBox units); the `translate` pulls the handle fully off the rim along the
 * edge normal and centers it along the edge.
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
