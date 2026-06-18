import type { ShellEdge } from "./types";

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
