import { anchorPositions } from "./anchors";
import type {
  NotchSpec,
  ShellBounds,
  SlotAnchor,
  SlotExtent,
  SlotRegistration,
} from "./types";

export type { SlotRegistration };

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

export function resolveActiveNotch(
  activeSlotId: string | null,
  slots: ReadonlyMap<string, SlotRegistration>,
  bounds: ShellBounds,
  extent: SlotExtent,
): NotchSpec | null {
  if (!activeSlotId) {
    return null;
  }

  const slot = slots.get(activeSlotId);
  if (!slot) {
    return null;
  }

  return { ...getSlotAnchor(bounds, slot), ...extent };
}
