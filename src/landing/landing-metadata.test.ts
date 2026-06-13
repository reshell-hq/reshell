import process from "node:process";
import { describe, expect, it } from "vitest";
import { getLandingPageMetadata, getSiteUrl } from "./landing-metadata";
import { getLandingPageContent } from "./landing-page";

describe("landing metadata", () => {
  it("exports Open Graph and Twitter fields from landing content", () => {
    const content = getLandingPageContent();
    const metadata = getLandingPageMetadata();

    expect(metadata.title).toContain(content.productName);
    expect(metadata.description).toBe(content.tagline);
    expect(metadata.metadataBase?.toString()).toBe(`${getSiteUrl()}/`);
    expect(metadata.openGraph?.title).toBe(content.headline);
    expect(metadata.openGraph?.description).toBe(content.tagline);
    expect(metadata.openGraph?.images).toEqual([
      { url: content.heroImageSrc, alt: content.heroImageAlt },
    ]);
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(metadata.twitter?.title).toBe(content.headline);
    expect(metadata.twitter?.images).toEqual([content.heroImageSrc]);
  });

  it("uses NEXT_PUBLIC_SITE_URL for metadataBase when set", () => {
    const previous = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://reshell.example.com";

    try {
      expect(getSiteUrl()).toBe("https://reshell.example.com");
      expect(getLandingPageMetadata().metadataBase?.toString()).toBe("https://reshell.example.com/");
    } finally {
      if (previous === undefined) {
        delete process.env.NEXT_PUBLIC_SITE_URL;
      } else {
        process.env.NEXT_PUBLIC_SITE_URL = previous;
      }
    }
  });
});
