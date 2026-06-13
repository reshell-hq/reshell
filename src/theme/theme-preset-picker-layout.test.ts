import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  THEME_PRESET_CARD_CLASS,
  THEME_PRESET_GRID_CLASS,
} from "./theme-preset-picker-layout";

describe("theme preset picker layout", () => {
  const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");
  const componentSource = readFileSync(
    resolve(__dirname, "../components/shell/shell-config-workspaces.tsx"),
    "utf8",
  );

  it("lays out preset cards in a three-column grid", () => {
    const rule = css.match(new RegExp(`\\.${THEME_PRESET_GRID_CLASS}\\s*\\{[^}]+\\}`, "s"));
    expect(rule).not.toBeNull();
    expect(rule![0]).toMatch(/display:\s*grid/);
    expect(rule![0]).toMatch(/grid-template-columns:\s*repeat\(3/);
  });

  it("renders all catalog presets and applies via useApplyThemePreset", () => {
    expect(componentSource).toContain("THEME_PRESET_GRID_CLASS");
    expect(componentSource).toContain("THEME_PRESET_CARD_CLASS");
    expect(componentSource).toContain("THEME_PRESETS");
    expect(componentSource).toContain("useApplyThemePreset");
    expect(THEME_PRESET_GRID_CLASS).toBe("shell-config-preset-grid");
    expect(THEME_PRESET_CARD_CLASS).toBe("shell-config-preset-card");
  });
});
