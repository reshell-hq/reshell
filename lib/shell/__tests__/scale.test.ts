import { describe, expect, it } from "vitest";
import { pixelsToViewBoxWithScreen } from "../scale";

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
