import { describe, expect, it } from "vitest";
import { clampExtent } from "../clamp";
import { SHELL_BOUNDS } from "../constants";

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
