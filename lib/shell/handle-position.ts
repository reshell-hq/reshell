import type { CSSProperties } from "react";
import type { ShellBounds, SlotAnchor } from "./types";

/**
 * Positions a slot handle just outside the shell border, centered on the slot
 * anchor and offset outward along the edge normal by `offsetPx`. Uses the same
 * percentage coordinate space as the rest of the shell (viewBox is 100×100 with
 * `preserveAspectRatio="none"`, so % maps 1:1 to viewBox units). The handle is
 * centered on the anchor with a `translate` that straddles the border line.
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
        bottom: `calc(${100 - bounds.bottom}% - ${offsetPx}px)`,
        transform: "translate(-50%, 50%)",
      };
    case "top":
      return {
        position: "fixed",
        left: `${center}%`,
        top: `calc(${bounds.top}% - ${offsetPx}px)`,
        transform: "translate(-50%, -50%)",
      };
    case "left":
      return {
        position: "fixed",
        top: `${center}%`,
        left: `calc(${bounds.left}% - ${offsetPx}px)`,
        transform: "translate(-50%, -50%)",
      };
    case "right":
      return {
        position: "fixed",
        top: `${center}%`,
        right: `calc(${100 - bounds.right}% - ${offsetPx}px)`,
        transform: "translate(50%, -50%)",
      };
  }
}
