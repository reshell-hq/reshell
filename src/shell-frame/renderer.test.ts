import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("drawShell", () => {
  const source = readFileSync(resolve(__dirname, "./renderer.ts"), "utf8");

  it("uses a single opaque solid fill path", () => {
    expect(source).toContain("function drawSolidShell");
    expect(source).not.toContain("function drawGlassShell");
    expect(source).not.toContain("shellSurface");
    expect(source).toContain("drawSolidShell(ctx, layout, pocket, theme)");
  });

  it("does not stroke the notch fill path separately to avoid double pocket borders", () => {
    expect(source).not.toContain("ctx.stroke(notchPath)");
  });
});
