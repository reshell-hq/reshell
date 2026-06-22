import { describe, expect, it } from "vitest";
import { displayTitle, faviconUrl } from "../link-display";
import type { Bookmark } from "@/lib/config";

describe("displayTitle", () => {
  it("uses a custom title when provided", () => {
    const bookmark: Bookmark = { url: "https://github.com", title: "GitHub" };
    expect(displayTitle(bookmark)).toBe("GitHub");
  });

  it("derives the title from the hostname, stripping leading www.", () => {
    const bookmark: Bookmark = { url: "https://www.github.com/octocat" };
    expect(displayTitle(bookmark)).toBe("github.com");
  });

  it("trims a whitespace-only title and falls back to the hostname", () => {
    const bookmark: Bookmark = { url: "https://example.com", title: "   " };
    expect(displayTitle(bookmark)).toBe("example.com");
  });

  it("falls back to the raw URL when it cannot be parsed", () => {
    const bookmark: Bookmark = { url: "not a url" };
    expect(displayTitle(bookmark)).toBe("not a url");
  });
});

describe("faviconUrl", () => {
  it("builds an S2 favicon URL from the hostname", () => {
    expect(faviconUrl("https://github.com/octocat")).toBe(
      "https://www.google.com/s2/favicons?domain=github.com&sz=64",
    );
  });

  it("falls back to /favicon.ico for an invalid URL", () => {
    expect(faviconUrl("not a url")).toBe("/favicon.ico");
  });
});
