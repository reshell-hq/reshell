import { describe, expect, it } from "vitest";
import { resolveActiveNotch } from "../active-notch";
import { SHELL_BOUNDS } from "../constants";
import type { SlotRegistration } from "../types";

function slotsMap(
  entries: SlotRegistration[],
): ReadonlyMap<string, SlotRegistration> {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

const extent = { depth: 14, halfExtent: 10 };

describe("resolveActiveNotch", () => {
  it("returns null when no slot is active", () => {
    const slots = slotsMap([
      { id: "search", edge: "bottom", anchorIndex: 0, siblingCount: 1 },
    ]);

    expect(resolveActiveNotch(null, slots, SHELL_BOUNDS, extent)).toBeNull();
  });

  it("returns the bottom slot anchor center when active", () => {
    const slots = slotsMap([
      { id: "search", edge: "bottom", anchorIndex: 0, siblingCount: 1 },
    ]);

    const notch = resolveActiveNotch("search", slots, SHELL_BOUNDS, extent);

    expect(notch).toEqual({
      edge: "bottom",
      center: 51.5,
      depth: 14,
      halfExtent: 10,
    });
  });

  it("switches anchor center when the active slot changes", () => {
    const slots = slotsMap([
      { id: "left", edge: "bottom", anchorIndex: 0, siblingCount: 2 },
      { id: "right", edge: "bottom", anchorIndex: 1, siblingCount: 2 },
    ]);

    const leftNotch = resolveActiveNotch("left", slots, SHELL_BOUNDS, extent);
    const rightNotch = resolveActiveNotch("right", slots, SHELL_BOUNDS, extent);

    expect(leftNotch?.center).toBeCloseTo(37.33, 1);
    expect(rightNotch?.center).toBeCloseTo(65.67, 1);
    expect(leftNotch?.center).not.toBe(rightNotch?.center);
  });
});
