import { describe, expect, it } from "vitest";
import { lerpPalette, themeToCssVars } from "./theme";
import type { Theme } from "@/library/types";

describe("lerpPalette", () => {
  it("interpolates each palette channel between two themes", () => {
    expect(
      lerpPalette(
        {
          background: "#000000",
          surface: "#222222",
          text: "#ffffff",
          accent: "#ff0000",
        },
        {
          background: "#ffffff",
          surface: "#dddddd",
          text: "#000000",
          accent: "#00ff00",
        },
        0.5,
      ),
    ).toEqual({
      background: "#808080",
      surface: "#808080",
      text: "#808080",
      accent: "#808000",
    });
  });
});

describe("themeToCssVars", () => {
  it("maps palette and background URL to CSS custom properties", () => {
    const theme: Theme = {
      palette: {
        background: "#f5f0e8",
        surface: "#fffdf9",
        text: "#2c2419",
        accent: "#c17f59",
      },
      backgroundUrl: "https://example.com/bg.jpg",
      borderRadius: 20,
      widgets: {},
    };

    expect(themeToCssVars(theme)).toMatchObject({
      "--qs-color-background": "#f5f0e8",
      "--qs-color-surface": "#fffdf9",
      "--qs-color-text": "#2c2419",
      "--qs-color-accent": "#c17f59",
      "--qs-background-image": "url(https://example.com/bg.jpg)",
      "--qs-border-radius": "20px",
      "--qs-shell-fill-strength": "1",
    });
  });

  it("maps shell border color to a CSS custom property", () => {
    const vars = themeToCssVars({
      palette: {
        background: "#ffffff",
        surface: "#ffffff",
        text: "#000000",
        accent: "#000000",
      },
      shellBorderColor: "#333333",
      borderRadius: 0,
      widgets: {},
    });

    expect(vars["--qs-shell-border-color"]).toBe("#333333");
  });

  it("sets hero clock typography vars for the editorial layout preset", () => {
    const vars = themeToCssVars({
      palette: {
        background: "#ffffff",
        surface: "#ffffff",
        text: "#000000",
        accent: "#000000",
      },
      borderRadius: 0,
      widgets: {},
      appliedLayoutPresetId: "editorial",
    });

    expect(vars["--canvas-widget-clock-time-size"]).toBe("clamp(4rem, 12vw, 7rem)");
    expect(vars["--canvas-widget-clock-time-weight"]).toBe("700");
    expect(vars["--canvas-widget-clock-time-tracking"]).toBe("-0.04em");
  });

  it("omits editorial hero clock vars for other presets", () => {
    const vars = themeToCssVars({
      palette: {
        background: "#f5f0e8",
        surface: "#fffdf9",
        text: "#2c2419",
        accent: "#c17f59",
      },
      borderRadius: 20,
      widgets: {},
      appliedPresetId: "work",
    });

    expect(vars["--canvas-widget-clock-time-size"]).toBeUndefined();
    expect(vars["--canvas-widget-clock-time-weight"]).toBeUndefined();
  });

  it("maps per-canvas-widget colours to CSS custom properties", () => {
    const palette = {
      background: "#f5f0e8",
      surface: "#fffdf9",
      text: "#2c2419",
      accent: "#c17f59",
    };
    const theme: Theme = {
      palette,
      borderRadius: 20,
      widgets: {
        clock: {
          zone: "upper-center",
          order: 0,
          text: "#ffffff",
          textMuted: "#cccccc",
          textShadow: "0 1px 3px rgba(0,0,0,0.6)",
        },
      },
    };

    expect(themeToCssVars(theme)).toMatchObject({
      "--canvas-widget-clock-text": "#ffffff",
      "--canvas-widget-clock-text-muted": "#cccccc",
      "--canvas-widget-clock-text-shadow": "0 1px 3px rgba(0,0,0,0.6)",
      "--canvas-widget-welcome-text": palette.text,
    });
  });
});
