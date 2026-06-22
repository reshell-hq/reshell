import { describe, expect, it } from "vitest";
import { resolveIcon } from "../resolve";

describe("resolveIcon", () => {
  it("returns none for undefined / empty / whitespace", () => {
    expect(resolveIcon()).toEqual({ kind: "none" });
    expect(resolveIcon("")).toEqual({ kind: "none" });
    expect(resolveIcon("   ")).toEqual({ kind: "none" });
  });

  it("classifies http(s) URLs as images", () => {
    expect(resolveIcon("https://example.com/icon.png")).toEqual({
      kind: "image",
      src: "https://example.com/icon.png",
    });
    expect(resolveIcon("http://example.com/favicon.ico").kind).toBe("image");
  });

  it("classifies a known curated name as named", () => {
    expect(resolveIcon("github")).toEqual({ kind: "named", name: "github" });
  });

  it("falls back to emoji/literal for an unknown name", () => {
    expect(resolveIcon("definitely-not-an-icon")).toEqual({
      kind: "emoji",
      value: "definitely-not-an-icon",
    });
  });

  it("classifies a literal emoji as emoji", () => {
    expect(resolveIcon("🐙")).toEqual({ kind: "emoji", value: "🐙" });
  });

  it("trims surrounding whitespace before classifying", () => {
    expect(resolveIcon("  github  ")).toEqual({ kind: "named", name: "github" });
  });
});
