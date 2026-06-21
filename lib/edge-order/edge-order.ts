import {
  insertBetween,
  sortByKey,
} from "@/lib/fractional-order/fractional-order";
import type { EdgeGroup } from "@/lib/library/types";

/**
 * The fractional order of edge groups along one edge (CONTEXT: "Edge order").
 * Moving a group to a slot index inserts it there, assigning a new key between
 * its new neighbors — neighbors keep their keys (no renumbering).
 */
export function moveEdgeGroupToSlot(
  groups: readonly EdgeGroup[],
  groupId: string,
  targetSlotIndex: number,
): EdgeGroup[] {
  const sorted = sortByKey([...groups], (group) => group.orderKey);
  const fromIndex = sorted.findIndex((group) => group.id === groupId);
  if (fromIndex === -1) {
    return [...groups];
  }

  const targetIndex = Math.max(0, Math.min(targetSlotIndex, sorted.length - 1));
  if (fromIndex === targetIndex) {
    return [...groups];
  }

  const reordered = [...sorted];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(targetIndex, 0, moved);

  const beforeKey =
    targetIndex === 0 ? null : reordered[targetIndex - 1].orderKey;
  const afterKey =
    targetIndex === reordered.length - 1
      ? null
      : reordered[targetIndex + 1].orderKey;
  const newOrderKey = insertBetween(beforeKey, afterKey);

  return groups.map((group) =>
    group.id === groupId ? { ...group, orderKey: newOrderKey } : group,
  );
}
