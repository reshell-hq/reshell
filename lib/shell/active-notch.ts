import { anchorPositions } from "./anchors";
import type { ShellBounds, SlotAnchor, SlotRegistration } from "./types";

export function getSlotAnchor(
  bounds: ShellBounds,
  slot: SlotRegistration,
): SlotAnchor {
  const positions = anchorPositions(bounds, slot.edge, slot.siblingCount);
  return {
    edge: slot.edge,
    center: positions[slot.anchorIndex] ?? positions[0],
  };
}
