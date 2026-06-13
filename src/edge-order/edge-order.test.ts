import { describe, expect, it } from "vitest";
import { initialKey, insertBetween } from "@/fractional-order/fractional-order";
import type { EdgeGroup } from "@/library/types";
import { moveEdgeGroupToSlot } from "./edge-order";

function group(id: string, orderKey: string): EdgeGroup {
  return { id, name: id, orderKey, links: [] };
}

describe("moveEdgeGroupToSlot", () => {
  it("inserts a handle on an occupied slot and assigns a new fractional order key", () => {
    const first = initialKey();
    const second = insertBetween(first, null);
    const third = insertBetween(second, null);
    const groups = [group("alpha", first), group("beta", second), group("gamma", third)];

    const result = moveEdgeGroupToSlot(groups, "gamma", 0);
    const ordered = [...result].sort((a, b) => (a.orderKey < b.orderKey ? -1 : 1));

    expect(ordered.map((entry) => entry.id)).toEqual(["gamma", "alpha", "beta"]);
    expect(ordered[0].orderKey < ordered[1].orderKey).toBe(true);
    expect(ordered[1].orderKey < ordered[2].orderKey).toBe(true);
  });
});
