import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("canvas zone layout UI", () => {
  const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");
  const stackSource = readFileSync(
    resolve(__dirname, "../components/shell/canvas-widget-stack.tsx"),
    "utf8",
  );
  const editorialStackSource = readFileSync(
    resolve(__dirname, "../components/shell/editorial-canvas-stack.tsx"),
    "utf8",
  );
  const meridianStackSource = readFileSync(
    resolve(__dirname, "../components/shell/meridian-canvas-stack.tsx"),
    "utf8",
  );
  const atelierStackSource = readFileSync(
    resolve(__dirname, "../components/shell/atelier-canvas-stack.tsx"),
    "utf8",
  );

  it("routes layouts from appliedLayoutPresetId only", () => {
    expect(stackSource).toContain("resolveLayoutPresetId");
    expect(stackSource).not.toContain('appliedPresetId === "editorial"');
    expect(stackSource).toContain('case "meridian"');
    expect(stackSource).toContain('case "atelier"');
  });

  it("renders editorial timer corners when pomodoro replaces the clock", () => {
    expect(editorialStackSource).toContain("CanvasEditorialTimerTimeWidget");
    expect(editorialStackSource).toContain("CanvasEditorialTimerPhaseWidget");
    expect(editorialStackSource).toContain('isWidgetInLayout(layout, "pomodoro")');
  });

  it("uses dedicated stage layouts for editorial, meridian, and atelier", () => {
    expect(stackSource).toContain("EditorialCanvasStack");
    expect(stackSource).toContain("MeridianCanvasStack");
    expect(stackSource).toContain("AtelierCanvasStack");
    expect(editorialStackSource).toContain("editorialFont");
    expect(meridianStackSource).toContain("canvas-widget-stage--meridian");
    expect(atelierStackSource).toContain("canvas-widget-stage--atelier");
    expect(css).toContain(".canvas-widget-stage--editorial");
    expect(css).toContain(".canvas-widget-stage--meridian");
    expect(css).toContain(".canvas-widget-stage--atelier");
  });

  it("uses a five-zone grid driven by buildCanvasZoneLayout for the default layout", () => {
    expect(stackSource).toContain("buildCanvasZoneLayout");
    expect(stackSource).toContain("canvas-zone-upper-center");
    expect(css).toMatch(/\.canvas-widget-stage[\s\S]*grid-template-areas/);
    expect(css).toContain(".canvas-zone-upper-center");
    expect(css).toContain(".canvas-zone-bottom-center");
  });
});
