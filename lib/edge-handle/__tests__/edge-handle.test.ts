import { describe, expect, it } from "vitest";
import { resolveEdgeHandleDisplay } from "../edge-handle";

describe("resolveEdgeHandleDisplay", () => {
  it("uses a custom image URL when the handle icon is an http(s) URL", () => {
    expect(
      resolveEdgeHandleDisplay({
        name: "Docs",
        handleIcon: "https://example.com/icon.png",
      }),
    ).toEqual({ kind: "image", url: "https://example.com/icon.png" });
  });

  it("uses an emoji/text glyph when the handle icon is not a URL", () => {
    expect(
      resolveEdgeHandleDisplay({ name: "Today", handleIcon: "☀️" }),
    ).toEqual({ kind: "glyph", text: "☀️" });
  });

  it("derives two-letter initials from a multi-word name when no icon is set", () => {
    expect(resolveEdgeHandleDisplay({ name: "Side projects" })).toEqual({
      kind: "glyph",
      text: "SP",
    });
  });

  it("derives initials from the first two letters of a single-word name", () => {
    expect(resolveEdgeHandleDisplay({ name: "Reshell" })).toEqual({
      kind: "glyph",
      text: "RE",
    });
  });
});
