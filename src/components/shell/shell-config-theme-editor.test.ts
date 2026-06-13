import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("settings theme editor", () => {
  const workspacesSource = readFileSync(
    resolve(__dirname, "./shell-config-workspaces.tsx"),
    "utf8",
  );
  const widgetsSource = readFileSync(
    resolve(__dirname, "./shell-config-theme-widgets.tsx"),
    "utf8",
  );

  it("exposes shell surface control and shell reset to preset", () => {
    expect(workspacesSource).toContain("ShellConfigShellSurface");
    expect(workspacesSource).toContain("resetShellThemeToPreset");
    expect(workspacesSource).toContain("ShellConfigThemeWidgets");
  });

  it("exposes per-widget zone, colour, and reset controls", () => {
    expect(widgetsSource).toContain("resetWidgetThemeToPreset");
    expect(widgetsSource).toContain("CANVAS_ZONES");
    expect(widgetsSource).toContain("textShadow");
  });
});
