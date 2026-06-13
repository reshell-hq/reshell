import { describe, expect, it } from "vitest";
import {
  compareKeys,
  initialKey,
  insertBetween,
  rebalanceKeys,
  sortByKey,
} from "./fractional-order";

describe("initialKey", () => {
  it("returns the first fractional order key for an empty sequence", () => {
    expect(initialKey()).toBe("a0");
  });
});

describe("insertBetween", () => {
  it("assigns a key between two neighbors in fractional order", () => {
    const first = initialKey();
    const third = insertBetween(first, null);
    const second = insertBetween(first, third);

    expect(compareKeys(second, first)).toBeGreaterThan(0);
    expect(compareKeys(second, third)).toBeLessThan(0);
  });
});

describe("sortByKey", () => {
  it("sorts items by fractional order key", () => {
    const a = initialKey();
    const c = insertBetween(a, null);
    const b = insertBetween(a, c);

    const items = [
      { id: "third", orderKey: c },
      { id: "first", orderKey: a },
      { id: "second", orderKey: b },
    ];

    expect(sortByKey(items, (item) => item.orderKey).map((item) => item.id)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("preserves input order when two items share the same key", () => {
    const shared = initialKey();
    const items = [
      { id: "earlier", orderKey: shared },
      { id: "later", orderKey: shared },
    ];

    expect(sortByKey(items, (item) => item.orderKey).map((item) => item.id)).toEqual([
      "earlier",
      "later",
    ]);
  });
});

describe("rebalanceKeys", () => {
  it("returns evenly spaced keys for a dense sequence", () => {
    const keys = rebalanceKeys(3);

    expect(keys).toHaveLength(3);
    expect(compareKeys(keys[0], keys[1])).toBeLessThan(0);
    expect(compareKeys(keys[1], keys[2])).toBeLessThan(0);
  });
});
