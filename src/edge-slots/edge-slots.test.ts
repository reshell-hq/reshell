import { describe, expect, it } from "vitest";
import {
  computeEdgeSlotCenters,
  computeMaxEdgeSlotCount,
  insertIndexToSlotIndex,
  nearestSlotIndex,
  slotIndexToInsertIndex,
} from "./edge-slots";

describe("computeEdgeSlotCenters", () => {
  it("places one handle at the center of the rim", () => {
    expect(computeEdgeSlotCenters(1, 600, 48)).toEqual([300]);
  });

  it("distributes handles along the rim with minimum spacing", () => {
    const centers = computeEdgeSlotCenters(3, 600, 48);

    expect(centers).toHaveLength(3);
    expect(centers[0]).toBeLessThan(centers[1]);
    expect(centers[1]).toBeLessThan(centers[2]);
    expect(centers[1] - centers[0]).toBeGreaterThanOrEqual(48);
    expect(centers[2] - centers[1]).toBeGreaterThanOrEqual(48);
  });
});

describe("computeMaxEdgeSlotCount", () => {
  it("derives the maximum slots from rim length and minimum spacing", () => {
    expect(computeMaxEdgeSlotCount(600, 48)).toBe(12);
    expect(computeMaxEdgeSlotCount(48, 48)).toBe(1);
  });
});

describe("slot index mapping", () => {
  it("maps physical slots to edge-order insert indices", () => {
    expect(slotIndexToInsertIndex(0, 3, 12)).toBe(0);
    expect(slotIndexToInsertIndex(11, 3, 12)).toBe(2);
    expect(insertIndexToSlotIndex(1, 3, 12)).toBe(6);
  });
});

describe("nearestSlotIndex", () => {
  it("snaps a drag position to the closest edge slot", () => {
    const centers = computeEdgeSlotCenters(3, 600, 48);

    expect(nearestSlotIndex(30, centers)).toBe(0);
    expect(nearestSlotIndex(290, centers)).toBe(1);
    expect(nearestSlotIndex(560, centers)).toBe(2);
  });
});
