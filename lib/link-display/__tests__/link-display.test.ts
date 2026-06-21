import { describe, expect, it } from "vitest";
import {
  defaultFaviconUrl,
  resolveLinkImageUrl,
  resolveLinkTitle,
} from "../link-display";
import type { Link } from "@/lib/library/types";

describe("resolveLinkTitle", () => {
  it("uses a custom title when provided", () => {
    const link: Link = { id: "1", url: "https://github.com", title: "GitHub" };

    expect(resolveLinkTitle(link)).toBe("GitHub");
  });

  it("derives a title from the URL hostname when title is omitted", () => {
    const link: Link = { id: "1", url: "https://www.github.com/octocat" };

    expect(resolveLinkTitle(link)).toBe("github.com");
  });

  it("falls back to the raw URL when it cannot be parsed", () => {
    const link: Link = { id: "1", url: "not a url" };

    expect(resolveLinkTitle(link)).toBe("not a url");
  });
});

describe("resolveLinkImageUrl", () => {
  it("uses a custom image when provided", () => {
    const link: Link = {
      id: "1",
      url: "https://github.com",
      image: "https://example.com/icon.png",
    };

    expect(resolveLinkImageUrl(link)).toBe("https://example.com/icon.png");
  });

  it("falls back to a favicon URL derived from the link URL", () => {
    const link: Link = { id: "1", url: "https://github.com" };

    expect(resolveLinkImageUrl(link)).toBe(
      defaultFaviconUrl("https://github.com"),
    );
  });
});
