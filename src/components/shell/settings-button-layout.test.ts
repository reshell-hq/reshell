import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SETTINGS_BUTTON_CLASS } from "./settings-button-layout";

describe("settings button layout", () => {
  const css = readFileSync(resolve(__dirname, "../../app/globals.css"), "utf8");

  it("keeps the settings handle hover state inside its bounds", () => {
    const rule = css.match(
      new RegExp(`\\.${SETTINGS_BUTTON_CLASS}\\.shell-icon-btn-ghost:hover[^}]*\\{[^}]+\\}`, "s"),
    );
    expect(rule).not.toBeNull();
    expect(rule![0]).toMatch(/transform:\s*none/);
    expect(rule![0]).not.toMatch(/translateY/);
  });

  it("still lifts other ghost handles on hover", () => {
    const genericGhostHover = css.match(
      /\.shell-icon-btn-ghost:hover,\s*\n\.shell-icon-btn-ghost\.active\s*\{[^}]+\}/s,
    );
    expect(genericGhostHover).not.toBeNull();
    expect(genericGhostHover![0]).toMatch(/translateY\(-1px\)/);
  });
});
