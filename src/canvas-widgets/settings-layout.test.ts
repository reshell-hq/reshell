import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CANVAS_WIDGET_TOGGLE_ROW_CLASS } from "./settings-layout";

describe("canvas widget settings layout", () => {
  const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");
  const componentSource = readFileSync(
    resolve(__dirname, "../components/shell/shell-config-canvas-widgets.tsx"),
    "utf8",
  );

  it("aligns checkbox and label on one row inside catalog items", () => {
    const rule = css.match(new RegExp(`\\.${CANVAS_WIDGET_TOGGLE_ROW_CLASS}\\s*\\{[^}]+\\}`, "s"));
    expect(rule).not.toBeNull();
    expect(rule![0]).toMatch(/display:\s*flex/);
    expect(rule![0]).toMatch(/align-items:\s*center/);
  });

  it("uses the toggle row class in the canvas settings section", () => {
    expect(componentSource).toContain("CANVAS_WIDGET_TOGGLE_ROW_CLASS");
  });
});
