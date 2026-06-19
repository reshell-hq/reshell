import { describe, expect, it } from "vitest";
import { anchorPositions } from "../anchors";
import { SHELL_BOUNDS } from "../constants";

describe("anchorPositions", () => {
  it("spaces 3 slots evenly on the left edge", () => {
    const anchors = anchorPositions(SHELL_BOUNDS, "left", 3);

    expect(anchors).toHaveLength(3);
    expect(anchors[0]).toBeCloseTo(29.5);
    expect(anchors[1]).toBeCloseTo(50);
    expect(anchors[2]).toBeCloseTo(70.5);
    expect(anchors[1] - anchors[0]).toBeCloseTo(anchors[2] - anchors[1]);
  });

  it("places 1 slot at the bottom edge midpoint", () => {
    const anchors = anchorPositions(SHELL_BOUNDS, "bottom", 1);

    expect(anchors).toHaveLength(1);
    expect(anchors[0]).toBeCloseTo(50);
  });
});
