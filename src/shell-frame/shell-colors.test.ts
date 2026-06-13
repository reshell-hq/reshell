import { describe, expect, it } from "vitest";
import { rgbaFromHex } from "./shell-colors";
import { themeToShellColors } from "./shell-animation";

const palette = {
  background: "#f5f0e8",
  surface: "#fffdf9",
  text: "#2c2419",
  accent: "#c17f59",
};

describe("shell-colors", () => {
  it("converts hex surface to rgba", () => {
    expect(rgbaFromHex("#fffdf9", 0.96)).toBe("rgba(255, 253, 249, 0.96)");
  });

  it("renders solid shell as a flat opaque fill with a customizable border", () => {
    const colors = themeToShellColors({
      palette,
      shellBorderColor: "#112233",
    });

    expect(colors.surfaceFill).toBe("rgba(255, 253, 249, 1)");
    expect(colors.notchFill).toBe("rgba(255, 253, 249, 1)");
    expect(colors.strokeOuter).toBe("rgba(17, 34, 51, 1)");
    expect(colors.borderWidth).toBe(2);
  });

  it("omits shell border stroke when shellBorderColor is unset", () => {
    const colors = themeToShellColors({ palette });

    expect(colors.strokeOuter).toBe("transparent");
    expect(colors.borderWidth).toBe(0);
  });
});
