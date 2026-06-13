import type { Metadata } from "next";
import { BRAND_CREAM } from "@/branding/logo-mark";
import { PRODUCT_NAME } from "@/branding/branding";

export const siteMetadata: Metadata = {
  title: `${PRODUCT_NAME} — browser home station`,
  description:
    "A riced desktop shell in your browser. Links on the rim, calm canvas to lock in. Local-first, portable like dotfiles.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: BRAND_CREAM,
      },
    ],
  },
};
