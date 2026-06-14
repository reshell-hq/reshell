import process from "node:process";
import { describe, expect, it } from "vitest";
import { getLandingPageContent } from "./landing-page";

describe("landing page", () => {
  it("describes Reshell and links to the home station for compose consumers", () => {
    const content = getLandingPageContent();

    expect(content.productName).toBe("Reshell");
    expect(content.headline).toBe("Make any browser your home");
    expect(content.tagline).toMatch(/portable home station/i);
    expect(content.tagline).toMatch(/quickshell/i);
    expect(content.supportingStatement).toMatch(/start page when you need speed/i);
    expect(content.features).toHaveLength(3);
    expect(content.features.map((feature) => feature.title)).toEqual([
      "Works anywhere",
      "Launch instantly",
      "Always within reach",
    ]);
    expect(content.setupTitle).toBe("Bring your workflow");
    expect(content.setupDescription).toMatch(/portable yaml library/i);
    expect(content.heroImageSrc).toBe("/landing/hero.png");
    expect(content.homeStationHref).toBe("/home");
    expect(content.homeStationCta).toBe("Open Reshell");
    expect(content.startPageHref).toBe("/start");
    expect(content.startPageCta).toBe("Open start page");
    expect(content.earlyAccessNote).toMatch(/personal edition/i);
    expect(content.earlyAccessNote).not.toMatch(/preview|beta/i);
    expect(content.footerLocalTierNote).toMatch(/personal edition/i);
    expect(content.setupLinks.some((link) => link.label.match(/example config/i))).toBe(true);
    expect(content.setupLinks.some((link) => link.label.match(/config authoring skills/i))).toBe(true);
    expect(content.setupLinks.some((link) => link.label.match(/extension/i))).toBe(false);
    expect(content.footerLinks.some((link) => link.href === "/llms.txt")).toBe(true);
    expect(
      content.footerLinks.some((link) => link.href.includes("github.com/reshell-hq/reshell")),
    ).toBe(true);
    expect(content.footerLinks.some((link) => link.href.includes("CONTEXT.md"))).toBe(false);
  });

  it("hides the waitlist CTA when NEXT_PUBLIC_WAITLIST_URL is unset", () => {
    const previous = process.env.NEXT_PUBLIC_WAITLIST_URL;
    delete process.env.NEXT_PUBLIC_WAITLIST_URL;

    try {
      expect(getLandingPageContent().waitlistHref).toBeNull();
    } finally {
      if (previous === undefined) {
        delete process.env.NEXT_PUBLIC_WAITLIST_URL;
      } else {
        process.env.NEXT_PUBLIC_WAITLIST_URL = previous;
      }
    }
  });

  it("shows the waitlist CTA when NEXT_PUBLIC_WAITLIST_URL is set", () => {
    const previous = process.env.NEXT_PUBLIC_WAITLIST_URL;
    process.env.NEXT_PUBLIC_WAITLIST_URL = "https://tally.so/r/example";

    try {
      const content = getLandingPageContent();
      expect(content.waitlistHref).toBe("https://tally.so/r/example");
      expect(content.waitlistCta).toMatch(/waitlist/i);
    } finally {
      if (previous === undefined) {
        delete process.env.NEXT_PUBLIC_WAITLIST_URL;
      } else {
        process.env.NEXT_PUBLIC_WAITLIST_URL = previous;
      }
    }
  });
});
