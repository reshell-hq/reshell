import { describe, expect, it } from "vitest";
import {
  compareKeys,
  rebalanceKeys,
  sortByKey,
} from "@/lib/fractional-order/fractional-order";
import type { EdgeGroup } from "@/lib/library/types";
import { moveEdgeGroupToSlot } from "../edge-order";

function groups(ids: string[]): EdgeGroup[] {
  const keys = rebalanceKeys(ids.length);
  return ids.map((id, index) => ({
    id,
    name: id,
    orderKey: keys[index],
    links: [],
  }));
}

function orderOf(result: EdgeGroup[]): string[] {
  return sortByKey(result, (group) => group.orderKey).map((group) => group.id);
}

describe("moveEdgeGroupToSlot", () => {
  it("moves a group earlier on the rim, leaving neighbors' keys untouched", () => {
    const initial = groups(["a", "b", "c", "d"]);

    const moved = moveEdgeGroupToSlot(initial, "d", 1);

    expect(orderOf(moved)).toEqual(["a", "d", "b", "c"]);
    // Only the moved group's key changed.
    for (const id of ["a", "b", "c"]) {
      const before = initial.find((g) => g.id === id)!.orderKey;
      const after = moved.find((g) => g.id === id)!.orderKey;
      expect(after).toBe(before);
    }
  });

  it("moves a group later on the rim", () => {
    const moved = moveEdgeGroupToSlot(groups(["a", "b", "c", "d"]), "a", 2);

    expect(orderOf(moved)).toEqual(["b", "c", "a", "d"]);
  });

  it("inserts the moved group with a key strictly between its new neighbors", () => {
    const initial = groups(["a", "b", "c", "d"]);
    const moved = moveEdgeGroupToSlot(initial, "d", 1);
    const sorted = sortByKey(moved, (g) => g.orderKey);

    expect(compareKeys(sorted[0].orderKey, sorted[1].orderKey)).toBeLessThan(0);
    expect(compareKeys(sorted[1].orderKey, sorted[2].orderKey)).toBeLessThan(0);
  });

  it("is a no-op when the group is already at the target slot", () => {
    const initial = groups(["a", "b", "c"]);
    expect(moveEdgeGroupToSlot(initial, "b", 1)).toEqual(initial);
  });

  it("returns the groups unchanged when the id is unknown", () => {
    const initial = groups(["a", "b"]);
    expect(moveEdgeGroupToSlot(initial, "missing", 0)).toEqual(initial);
  });
});
