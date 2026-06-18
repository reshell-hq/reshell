import { describe, expect, it } from "vitest";
import { contentSizeToExtent } from "../map-content-size";

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
