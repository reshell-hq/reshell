import { describe, expect, it } from "vitest";
import { canvasBackgroundStyle, themeToShellInput } from "../shell-theme";
import type { Theme } from "../types";

const base: Theme = {
  palette: {
    background: "#101010",
    surface: "#202020",
    text: "#f5f5f5",
    accent: "#ff5500",
  },
  borderRadius: 20,
};

describe("themeToShellInput", () => {
  it("paints shell and panel from the opaque surface, canvas from background", () => {
    const input = themeToShellInput(base);
    expect(input.shellColor).toBe("#202020");
    expect(input.panelColor).toBe("#202020");
    expect(input.canvasColor).toBe("#101010");
  });

  it("draws no border when shellBorderColor is unset", () => {
    const input = themeToShellInput(base);
    expect(input.borderWidth).toBe(0);
    expect(input.borderColor).toBe("transparent");
  });

  it("draws the border at the given colour when shellBorderColor is set", () => {
    const input = themeToShellInput({ ...base, shellBorderColor: "#ff5500" });
    expect(input.borderColor).toBe("#ff5500");
    expect(input.borderWidth).toBeGreaterThan(0);
  });

  it("treats a blank shellBorderColor as no border", () => {
    const input = themeToShellInput({ ...base, shellBorderColor: "   " });
    expect(input.borderWidth).toBe(0);
  });
});

describe("canvasBackgroundStyle", () => {
  it("returns a solid background when no image is set", () => {
    const style = canvasBackgroundStyle(base);
    expect(style.backgroundColor).toBe("#101010");
    expect(style.backgroundImage).toBeUndefined();
  });

  it("references the background image by url without embedding it", () => {
    const style = canvasBackgroundStyle({
      ...base,
      backgroundUrl: "https://example.com/bg.jpg",
    });
    expect(style.backgroundImage).toBe("url(https://example.com/bg.jpg)");
    expect(style.backgroundSize).toBe("cover");
    expect(style.backgroundColor).toBe("#101010");
  });
});
