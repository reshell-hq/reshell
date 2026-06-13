import { describe, expect, it } from "vitest";
import { resolveCommandBarListNavigation } from "./command-bar";

describe("resolveCommandBarListNavigation", () => {
  it("moves selection with arrow keys and tab", () => {
    expect(resolveCommandBarListNavigation("ArrowDown", false)).toBe("down");
    expect(resolveCommandBarListNavigation("ArrowUp", false)).toBe("up");
    expect(resolveCommandBarListNavigation("Tab", false)).toBe("down");
    expect(resolveCommandBarListNavigation("Tab", true)).toBe("up");
  });

  it("does not treat j or k as navigation keys", () => {
    expect(resolveCommandBarListNavigation("j", false)).toBeNull();
    expect(resolveCommandBarListNavigation("k", false)).toBeNull();
  });
});
