import process from "node:process";
import { PRODUCT_NAME } from "@/branding/branding";
import { RESHELL_ROUTES } from "@/routing/routes";

export type LandingFeature = {
  title: string;
  description: string;
};

export type LandingLink = {
  href: string;
  label: string;
};

export type LandingPageContent = {
  productName: string;
  headline: string;
  tagline: string;
  supportingStatement: string;
  features: LandingFeature[];
  setupTitle: string;
  setupDescription: string;
  setupLinks: LandingLink[];
  heroImageSrc: string;
  heroImageAlt: string;
  homeStationHref: string;
  homeStationCta: string;
  startPageHref: string;
  startPageCta: string;
  waitlistHref: string | null;
  waitlistCta: string;
  earlyAccessNote: string;
  footerLinks: LandingLink[];
  footerLocalTierNote: string;
};

const EXAMPLE_CONFIG_REPO_HREF = "https://github.com/reshell-hq/reshell-config";
const CONFIG_SKILLS_HREF =
  "https://github.com/reshell-hq/reshell-config/tree/main/.cursor/skills";
const MAIN_REPO_HREF = "https://github.com/reshell-hq/reshell";

export function getLandingPageContent(): LandingPageContent {
  const waitlistHref = process.env.NEXT_PUBLIC_WAITLIST_URL?.trim() || null;

  return {
    productName: PRODUCT_NAME,
    headline: "Make any browser your home",
    tagline:
      "A portable home station for links, projects, and workflows. Launch anything with a few keystrokes, or browse through an always-within-reach quickshell.",
    supportingStatement: "A start page when you need speed. A home station when you need context.",
    features: [
      {
        title: "Works anywhere",
        description:
          "Keep your browser of choice. Reshell runs as a home station in any modern browser and keeps your library portable.",
      },
      {
        title: "Launch instantly",
        description:
          "Find links, projects, workspaces, and actions from a keyboard-first command bar.",
      },
      {
        title: "Always within reach",
        description:
          "Organize resources around screen-edge quickshells that stay accessible without cluttering your workspace.",
      },
    ],
    setupTitle: "Bring your workflow",
    setupDescription:
      "Import existing bookmarks, workspaces, and resources into a portable YAML library. Fork the example config or use agent skills to build your own from browser exports.",
    setupLinks: [
      {
        label: "Example config repo",
        href: EXAMPLE_CONFIG_REPO_HREF,
      },
      {
        label: "Config authoring skills",
        href: CONFIG_SKILLS_HREF,
      },
    ],
    heroImageSrc: "/landing/hero.png",
    heroImageAlt: "Reshell home station with a left edge bookmark flyout open",
    homeStationHref: RESHELL_ROUTES.homeStation,
    homeStationCta: "Open Reshell",
    startPageHref: RESHELL_ROUTES.startPage,
    startPageCta: "Open start page",
    waitlistHref,
    waitlistCta: "Join the waitlist",
    earlyAccessNote:
      "Public preview. Local-first by default, with portable YAML snapshots for backup and migration. Cloud sync is planned for a future release.",
    footerLinks: [
      {
        label: "View source on GitHub",
        href: MAIN_REPO_HREF,
      },
      {
        label: "llms.txt",
        href: "/llms.txt",
      },
    ],
    footerLocalTierNote:
      "Local-first. Your library stays in this browser until you export a snapshot.",
  };
}
