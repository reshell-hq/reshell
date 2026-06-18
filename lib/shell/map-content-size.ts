import type { ShellEdge, SlotExtent } from "./types";

export type ContentSize = {
  width: number;
  height: number;
};

export function contentSizeToExtent(
  edge: ShellEdge,
  size: ContentSize,
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
