import { getEdgeSpan } from "./perimeter";
import type { ShellBounds, ShellEdge } from "./types";

export function anchorPositions(
  bounds: ShellBounds,
  edge: ShellEdge,
  slotCount: number,
): number[] {
  if (slotCount <= 0) {
    return [];
  }

  const { start, length } = getEdgeSpan(bounds, edge);

  return Array.from({ length: slotCount }, (_, index) => {
    return start + (length / (slotCount + 1)) * (index + 1);
  });
}
