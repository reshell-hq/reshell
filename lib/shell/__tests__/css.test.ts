import { describe, expect, it } from "vitest";
import { SHELL_BOUNDS } from "../constants";
import { handleStyle, transformOriginForEdge } from "../css";

describe("handleStyle", () => {
  it("places a bottom-edge handle in the gutter below the rim", () => {
    expect(handleStyle(SHELL_BOUNDS, { edge: "bottom", center: 50 }, 8)).toEqual({
      position: "fixed",
      left: "50%",
      top: `calc(${SHELL_BOUNDS.bottom}% + 8px)`,
      transform: "translate(-50%, 0)",
    });
  });

  it("places a top-edge handle in the gutter above the rim", () => {
    expect(handleStyle(SHELL_BOUNDS, { edge: "top", center: 30 }, 8)).toEqual({
      position: "fixed",
      left: "30%",
      top: `calc(${SHELL_BOUNDS.top}% - 8px)`,
      transform: "translate(-50%, -100%)",
    });
  });

  it("places a left-edge handle in the gutter left of the rim", () => {
    expect(handleStyle(SHELL_BOUNDS, { edge: "left", center: 40 }, 8)).toEqual({
      position: "fixed",
      top: "40%",
      left: `calc(${SHELL_BOUNDS.left}% - 8px)`,
      transform: "translate(-100%, -50%)",
    });
  });

  it("places a right-edge handle in the gutter right of the rim", () => {
    expect(handleStyle(SHELL_BOUNDS, { edge: "right", center: 60 }, 8)).toEqual({
      position: "fixed",
      top: "60%",
      left: `calc(${SHELL_BOUNDS.right}% + 8px)`,
      transform: "translate(0, -50%)",
    });
  });
});

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
