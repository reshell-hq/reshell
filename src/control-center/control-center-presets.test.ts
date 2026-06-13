import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("control center presets tab", () => {
  const dashboardSource = readFileSync(
    resolve(__dirname, "../components/shell/shell-dashboard.tsx"),
    "utf8",
  );
  const presetsSource = readFileSync(
    resolve(__dirname, "../components/shell/control-center-presets-tab.tsx"),
    "utf8",
  );

  it("exposes a presets tab with independent layout and theme apply controls", () => {
    expect(dashboardSource).toContain('id: "presets"');
    expect(dashboardSource).toContain("ControlCenterPresetsTab");
    expect(presetsSource).toContain("useApplyLayoutPreset");
    expect(presetsSource).toContain("useApplyThemePreset");
    expect(presetsSource).toContain("LAYOUT_PRESETS");
    expect(presetsSource).toContain("THEME_PRESETS");
  });
});
