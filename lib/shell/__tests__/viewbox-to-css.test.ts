import { describe, expect, it } from "vitest";
import { transformOriginForEdge } from "../viewbox-to-css";

describe("transformOriginForEdge", () => {
  it("anchors bottom-edge reveals to the bottom so content grows upward", () => {
    expect(transformOriginForEdge("bottom")).toBe("bottom center");
  });

  it("anchors top-edge reveals to the top so content grows downward", () => {
    expect(transformOriginForEdge("top")).toBe("top center");
  });

  it("anchors left-edge reveals to the left so content grows rightward", () => {
    expect(transformOriginForEdge("left")).toBe("left center");
  });

  it("anchors right-edge reveals to the right so content grows leftward", () => {
    expect(transformOriginForEdge("right")).toBe("right center");
  });
});
