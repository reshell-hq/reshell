import { describe, expect, it } from "vitest";
import { SHELL_BOUNDS } from "../constants";
import { buildShellPath } from "../notch";

const LEFT_NOTCH_CHARACTERIZATION =
  "M 8 2 H 95 Q 98 2 98 5 V 95 Q 98 98 95 98 H 8 Q 5 98 5 95 V 71.5 Q 5 70 6.5 70 H 13.5 Q 15 70 15 68.5 V 31.5 Q 15 30 13.5 30 H 6.5 Q 5 30 5 28.5 V 5 Q 5 2 8 2 Z";

describe("buildShellPath", () => {
  it("returns a closed path when notch is null", () => {
    const path = buildShellPath(SHELL_BOUNDS, null);

    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it("cuts a bottom notch upward from the bottom edge with rounded corners", () => {
    const path = buildShellPath(SHELL_BOUNDS, {
      edge: "bottom",
      center: 50,
      depth: 10,
      halfExtent: 20,
    });

    // inner wall sits at bottom - depth = 88, rounded by the corner radius
    expect(path).toContain("Q 70 88 68.5 88");
    expect(path).toContain("Q 30 88 30 89.5");
    // bottom edge stays open between the notch walls (no straight line at y=98)
    expect(path).not.toContain("L 30 98");
    expect(path).toContain("Q 30 98 28.5 98");
  });

  it("rounds the notch corners with quadratic curves, not sharp lines", () => {
    const path = buildShellPath(SHELL_BOUNDS, {
      edge: "left",
      center: 50,
      depth: 10,
      halfExtent: 20,
    });

    expect(path).toBe(LEFT_NOTCH_CHARACTERIZATION);
  });

  it("returns a closed rounded rect when depth is zero", () => {
    const path = buildShellPath(SHELL_BOUNDS, {
      edge: "bottom",
      center: 50,
      depth: 0,
      halfExtent: 20,
    });

    expect(path).not.toContain("Q 70 88 68.5 88");
    expect(path.endsWith("Z")).toBe(true);
  });
});
