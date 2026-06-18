import { cornerInset, getEdgeSpan } from "./perimeter";
import type { NotchSpec, ShellBounds, SlotAnchor, SlotExtent } from "./types";

/** Notch may grow up to half the interior depth before content must scroll. */
const MAX_DEPTH_RATIO = 0.5;

function maxDepth(bounds: ShellBounds, edge: NotchSpec["edge"]): number {
  const interiorHeight = bounds.bottom - bounds.top;
  const interiorWidth = bounds.right - bounds.left;

  if (edge === "top" || edge === "bottom") {
    return interiorHeight * MAX_DEPTH_RATIO;
  }

  return interiorWidth * MAX_DEPTH_RATIO;
}

function maxHalfExtent(
  bounds: ShellBounds,
  anchor: SlotAnchor,
): number {
  const { start, end } = getEdgeSpan(bounds, anchor.edge);
  const margin = cornerInset(bounds);
  const availableBefore = anchor.center - start - margin;
  const availableAfter = end - anchor.center - margin;

  return Math.max(0, Math.min(availableBefore, availableAfter));
}

export function clampExtent(
  bounds: ShellBounds,
  anchor: SlotAnchor,
  extent: SlotExtent,
): SlotExtent {
  return {
    depth: Math.min(extent.depth, maxDepth(bounds, anchor.edge)),
    halfExtent: Math.min(extent.halfExtent, maxHalfExtent(bounds, anchor)),
  };
}
