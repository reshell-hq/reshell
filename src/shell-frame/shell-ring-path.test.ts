import { describe, expect, it } from "vitest";
import { getShellLayout } from "./layout";
import { frameShellRingSvgD } from "./shell-ring-path";

describe("frameShellRingSvgD", () => {
  it("returns an even-odd ring path covering the viewport minus the panel hole", () => {
    const layout = getShellLayout();
    const path = frameShellRingSvgD(layout, {
      rim: "top",
      anchor: layout.panelX + layout.panelW / 2,
      span: 120,
      depth: 0,
      radius: layout.pocketCorner,
      active: false,
    });

    expect(path).toContain(`H ${layout.w}`);
    expect(path).toContain(`M ${layout.panelX + layout.shellRadius}`);
    expect(path).toContain("Z");
  });
});
