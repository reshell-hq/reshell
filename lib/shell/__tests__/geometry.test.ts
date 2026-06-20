import { describe, expect, it } from "vitest";
import { SHELL_BOUNDS } from "../constants";
import {
  anchorPositions,
  clampExtent,
  contentSizeToExtent,
  pixelsToViewBoxWithScreen,
} from "../geometry";

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

describe("contentSizeToExtent", () => {
  it("maps bottom-edge content size to depth and halfExtent", () => {
    expect(contentSizeToExtent("bottom", { width: 400, height: 300 })).toEqual({
      depth: 300,
      halfExtent: 200,
    });
  });

  it("maps top-edge content size the same as bottom", () => {
    expect(contentSizeToExtent("top", { width: 200, height: 100 })).toEqual({
      depth: 100,
      halfExtent: 100,
    });
  });

  it("maps left-edge content size with width as depth", () => {
    expect(contentSizeToExtent("left", { width: 120, height: 80 })).toEqual({
      depth: 120,
      halfExtent: 40,
    });
  });

  it("maps right-edge content size the same as left", () => {
    expect(contentSizeToExtent("right", { width: 60, height: 200 })).toEqual({
      depth: 60,
      halfExtent: 100,
    });
  });
});

describe("clampExtent", () => {
  it("clamps oversized halfExtent to edge bounds", () => {
    const anchor = { edge: "bottom" as const, center: 51.5 };
    const clamped = clampExtent(SHELL_BOUNDS, anchor, {
      depth: 10,
      halfExtent: 100,
    });

    expect(clamped.halfExtent).toBeLessThan(100);
    expect(clamped.halfExtent).toBeGreaterThan(0);
    expect(anchor.center - clamped.halfExtent).toBeGreaterThanOrEqual(
      SHELL_BOUNDS.left + SHELL_BOUNDS.rx + 1,
    );
    expect(anchor.center + clamped.halfExtent).toBeLessThanOrEqual(
      SHELL_BOUNDS.right - SHELL_BOUNDS.rx - 1,
    );
  });

  it("clamps oversized depth to the interior limit", () => {
    const anchor = { edge: "left" as const, center: 50 };
    const clamped = clampExtent(SHELL_BOUNDS, anchor, {
      depth: 200,
      halfExtent: 5,
    });

    const maxDepth = (SHELL_BOUNDS.right - SHELL_BOUNDS.left) * 0.5;
    expect(clamped.depth).toBe(maxDepth);
    expect(clamped.halfExtent).toBe(5);
  });
});

describe("pixelsToViewBoxWithScreen", () => {
  it("converts pixel dimensions to viewBox units", () => {
    expect(
      pixelsToViewBoxWithScreen(
        { width: 400, height: 300 },
        { width: 1000, height: 800 },
        { width: 100, height: 100 },
      ),
    ).toEqual({ width: 40, height: 37.5 });
  });

  it("returns zero when screen size is zero", () => {
    expect(
      pixelsToViewBoxWithScreen(
        { width: 400, height: 300 },
        { width: 0, height: 800 },
      ),
    ).toEqual({ width: 0, height: 0 });
  });
});
