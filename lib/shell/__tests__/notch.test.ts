import { describe, expect, it } from "vitest";
import { SHELL_BOUNDS } from "../constants";
import { buildShellPath } from "../notch";

const LEFT_NOTCH_CHARACTERIZATION =
  "M 8 5 H 92 Q 95 5 95 8 V 92 Q 95 95 92 95 H 8 Q 5 95 5 92 V 71.5 Q 5 70 6.5 70 H 13.5 Q 15 70 15 68.5 V 31.5 Q 15 30 13.5 30 H 6.5 Q 5 30 5 28.5 V 8 Q 5 5 8 5 Z";

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

    // inner wall sits at bottom - depth = 85, rounded by the corner radius
    expect(path).toContain("Q 70 85 68.5 85");
    expect(path).toContain("Q 30 85 30 86.5");
    // bottom edge stays open between the notch walls (no straight line at y=95)
    expect(path).not.toContain("L 30 95");
    expect(path).toContain("Q 30 95 28.5 95");
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

    expect(path).not.toContain("Q 70 85 68.5 85");
    expect(path.endsWith("Z")).toBe(true);
  });

  it("shrinks the horizontal corner radius on a wide viewport so corners read as circular", () => {
    // viewBox is stretched to fill the viewport; on a 2:1 viewport the
    // horizontal radius must be half the vertical radius to map to equal pixels.
    const wide = buildShellPath(SHELL_BOUNDS, null, {
      width: 2000,
      height: 1000,
    });

    // canonical radius is bounds.ry (3); horizontal radius becomes 3 / 2 = 1.5
    // → first horizontal move is to left + rx = 5 + 1.5 = 6.5
    expect(wide.startsWith("M 6.5 5")).toBe(true);
    // vertical radius is unchanged at 3 → first vertical curve ends at top + ry = 8
    expect(wide).toContain("Q 95 5 95 8");
  });

  it("leaves radii untouched when the viewport is square (aspect 1)", () => {
    const square = buildShellPath(SHELL_BOUNDS, null, {
      width: 800,
      height: 800,
    });

    expect(square).toBe(buildShellPath(SHELL_BOUNDS, null));
  });
});
