/** Default handle diameter in pixels. */
export const EDGE_HANDLE_SIZE_PX = 40;

/** Minimum center-to-center spacing between handles on one rim. */
export const EDGE_MIN_HANDLE_SPACING_PX = 48;

/** Maximum slots that fit along a rim at minimum handle spacing. */
export function computeMaxEdgeSlotCount(
  edgeLengthPx: number,
  minSpacingPx: number = EDGE_MIN_HANDLE_SPACING_PX,
): number {
  if (edgeLengthPx < minSpacingPx) {
    return 1;
  }

  return Math.floor((edgeLengthPx - minSpacingPx) / minSpacingPx) + 1;
}

/** Map a physical slot index to an edge-order insert index. */
export function slotIndexToInsertIndex(
  targetSlot: number,
  groupCount: number,
  maxSlots: number,
): number {
  if (groupCount <= 0) {
    return 0;
  }
  if (groupCount === 1 || maxSlots <= 1) {
    return 0;
  }

  const clamped = Math.max(0, Math.min(targetSlot, maxSlots - 1));
  return Math.round((clamped * (groupCount - 1)) / (maxSlots - 1));
}

/** Map an edge-order insert index to its canonical physical slot. */
export function insertIndexToSlotIndex(
  insertIndex: number,
  groupCount: number,
  maxSlots: number,
): number {
  if (groupCount <= 1 || maxSlots <= 1) {
    return 0;
  }

  const clamped = Math.max(0, Math.min(insertIndex, groupCount - 1));
  return Math.round((clamped * (maxSlots - 1)) / (groupCount - 1));
}

/** Center positions (px along the rim axis) for each edge slot. */
export function computeEdgeSlotCenters(
  groupCount: number,
  edgeLengthPx: number,
  minSpacingPx: number = EDGE_MIN_HANDLE_SPACING_PX,
): number[] {
  if (groupCount <= 0) {
    return [];
  }
  if (groupCount === 1) {
    return [edgeLengthPx / 2];
  }

  const inset = minSpacingPx / 2;
  const available = edgeLengthPx - minSpacingPx;
  const gap = available / (groupCount - 1);

  return Array.from({ length: groupCount }, (_, index) => inset + index * gap);
}

/** Snap a drag position to the nearest slot index. */
export function nearestSlotIndex(positionPx: number, slotCenters: readonly number[]): number {
  let bestIndex = 0;
  let bestDistance = Infinity;

  for (const [index, center] of slotCenters.entries()) {
    const distance = Math.abs(positionPx - center);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}
