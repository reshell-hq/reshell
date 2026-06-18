import { describe, expect, it } from "vitest";
import { SHELL_BOUNDS } from "../constants";
import { handleStyle } from "../handle-position";

describe("handleStyle", () => {
  it("centers a bottom-edge handle on the anchor and offsets it below the border", () => {
    expect(handleStyle(SHELL_BOUNDS, { edge: "bottom", center: 50 }, 8)).toEqual({
      position: "fixed",
      left: "50%",
      bottom: `calc(${100 - SHELL_BOUNDS.bottom}% - 8px)`,
      transform: "translate(-50%, 50%)",
    });
  });

  it("offsets a top-edge handle above the border", () => {
    expect(handleStyle(SHELL_BOUNDS, { edge: "top", center: 30 }, 8)).toEqual({
      position: "fixed",
      left: "30%",
      top: `calc(${SHELL_BOUNDS.top}% - 8px)`,
      transform: "translate(-50%, -50%)",
    });
  });

  it("offsets a left-edge handle outside the left border", () => {
    expect(handleStyle(SHELL_BOUNDS, { edge: "left", center: 40 }, 8)).toEqual({
      position: "fixed",
      top: "40%",
      left: `calc(${SHELL_BOUNDS.left}% - 8px)`,
      transform: "translate(-50%, -50%)",
    });
  });

  it("offsets a right-edge handle outside the right border", () => {
    expect(handleStyle(SHELL_BOUNDS, { edge: "right", center: 60 }, 8)).toEqual({
      position: "fixed",
      top: "60%",
      right: `calc(${100 - SHELL_BOUNDS.right}% - 8px)`,
      transform: "translate(50%, -50%)",
    });
  });
});
