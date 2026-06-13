import { describe, expect, it } from "vitest";
import { resolveEdgeHandleDisplay } from "./edge-handle";

describe("resolveEdgeHandleDisplay", () => {
  it("uses a custom image URL when the edge group handle icon is a URL", () => {
    const display = resolveEdgeHandleDisplay({
      name: "Dev tools",
      handleIcon: "https://example.com/icon.png",
    });

    expect(display).toEqual({
      kind: "image",
      url: "https://example.com/icon.png",
    });
  });

  it("uses emoji or text glyph when handle icon is not a URL", () => {
    const display = resolveEdgeHandleDisplay({
      name: "Docs",
      handleIcon: "📚",
    });

    expect(display).toEqual({ kind: "glyph", text: "📚" });
  });

  it("falls back to initials derived from the edge group name", () => {
    const display = resolveEdgeHandleDisplay({
      name: "Dev tools",
    });

    expect(display).toEqual({ kind: "glyph", text: "DT" });
  });
});
