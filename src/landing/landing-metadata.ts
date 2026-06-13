import type { Metadata } from "next";
import process from "node:process";
import { getLandingPageContent } from "./landing-page";

const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
}

export function getLandingPageMetadata(): Metadata {
  const content = getLandingPageContent();
  const metadataBase = new URL(getSiteUrl());

  return {
    title: `${content.productName} — ${content.headline}`,
    description: content.tagline,
    metadataBase,
    openGraph: {
      title: content.headline,
      description: content.tagline,
      type: "website",
      images: [
        {
          url: content.heroImageSrc,
          alt: content.heroImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content.headline,
      description: content.tagline,
      images: [content.heroImageSrc],
    },
  };
}
