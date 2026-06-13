import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("shell layering", () => {
  const css = readFileSync(resolve(__dirname, "../../app/globals.css"), "utf8");
  const surfaceSource = readFileSync(
    resolve(__dirname, "./shell-workspace-surface.tsx"),
    "utf8",
  );

  it("paints canvas widgets beneath the opaque shell rim canvas", () => {
    const canvasLayerMatch = css.match(/\.shell-canvas-layer[\s\S]*?z-index:\s*(\d+)/);
    const rimCanvasMatch = css.match(/\.shell-rim-canvas[\s\S]*?z-index:\s*(\d+)/);

    expect(Number(canvasLayerMatch?.[1])).toBeLessThan(Number(rimCanvasMatch?.[1]));
    expect(surfaceSource.indexOf("ShellCanvas")).toBeLessThan(
      surfaceSource.indexOf("shell-canvas-layer"),
    );
  });
});
