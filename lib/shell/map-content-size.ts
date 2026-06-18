import type { ShellEdge, Size, SlotExtent } from "./types";

export function contentSizeToExtent(
  edge: ShellEdge,
  size: Size,
): SlotExtent {
  switch (edge) {
    case "bottom":
    case "top":
      return { depth: size.height, halfExtent: size.width / 2 };
    case "left":
    case "right":
      return { depth: size.width, halfExtent: size.height / 2 };
  }
}
