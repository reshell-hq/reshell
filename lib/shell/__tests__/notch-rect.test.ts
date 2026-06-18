import { describe, expect, it } from "vitest";
import { SHELL_BOUNDS } from "../constants";
import { notchRect } from "../notch-rect";

describe("notchRect", () => {
  it("maps a bottom notch to viewBox coordinates", () => {
    const rect = notchRect(SHELL_BOUNDS, {
      edge: "bottom",
      center: 50,
      depth: 10,
      halfExtent: 20,
    });

    expect(rect.y + rect.height).toBe(SHELL_BOUNDS.bottom);
    expect(rect.width).toBe(40);
    expect(rect.x).toBe(30);
    expect(rect.y).toBe(88);
  });

  it("maps a top notch downward from the top edge", () => {
    const rect = notchRect(SHELL_BOUNDS, {
      edge: "top",
      center: 40,
      depth: 8,
      halfExtent: 12,
    });

    expect(rect.y).toBe(SHELL_BOUNDS.top);
    expect(rect.height).toBe(8);
    expect(rect.width).toBe(24);
    expect(rect.x).toBe(28);
  });
});
