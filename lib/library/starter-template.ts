import { rebalanceKeys } from "@/lib/fractional-order/fractional-order";
import type { Theme } from "@/lib/theme/types";
import { LIBRARY_SCHEMA_VERSION } from "./schema";
import type { EdgeGroup, Library, Link, Workspace } from "./types";

/**
 * The opinionated starter template (CONTEXT: "First run") — Work + Personal
 * workspaces with distinct themes and ~6–8 sample dev links each on the left
 * edge. Seeded on first run; everything is removable. The full theme-preset
 * catalog and per-widget styling land with later slices (issue 08).
 */

const workTheme: Theme = {
  palette: {
    background: "#f5f0e8",
    surface: "#fffdf9",
    text: "#2c2419",
    accent: "#c17f59",
  },
  backgroundUrl:
    "https://images.unsplash.com/photo-1497215728101-856f1ea4214f?w=1920",
  borderRadius: 20,
};

const personalTheme: Theme = {
  palette: {
    background: "#1a1d24",
    surface: "#252a33",
    text: "#e8e6e3",
    accent: "#7eb8da",
  },
  borderRadius: 20,
};

function link(id: string, url: string, title: string): Link {
  return { id, url, title };
}

type EdgeGroupInput = {
  id: string;
  name: string;
  handleIcon?: string;
  links: string[];
};

function orderedLinks(linkIds: string[]): EdgeGroup["links"] {
  const keys = rebalanceKeys(linkIds.length);
  return linkIds.map((linkId, index) => ({ linkId, orderKey: keys[index] }));
}

function orderedEdgeGroups(groups: EdgeGroupInput[]): EdgeGroup[] {
  const keys = rebalanceKeys(groups.length);
  return groups.map((group, index) => ({
    id: group.id,
    name: group.name,
    handleIcon: group.handleIcon,
    orderKey: keys[index],
    links: orderedLinks(group.links),
  }));
}

function workspace(
  id: string,
  name: string,
  theme: Theme,
  left: EdgeGroupInput[],
): Workspace {
  return {
    id,
    name,
    theme,
    placements: {
      edges: { left: orderedEdgeGroups(left), top: [], bottom: [] },
    },
  };
}

export const STARTER_CATALOG: Link[] = [
  link("github", "https://github.com", "GitHub"),
  link("linear", "https://linear.app", "Linear"),
  link("notion", "https://www.notion.so", "Notion"),
  link("figma", "https://www.figma.com", "Figma"),
  link("slack", "https://slack.com", "Slack"),
  link("localhost", "http://localhost:3000/home", "Reshell — Home"),
  link("reshell-repo", "https://github.com/reshell-hq/reshell", "Reshell repo"),
  link("ci", "https://github.com/features/actions", "GitHub Actions"),
  link("releases", "https://github.com/reshell-hq/reshell/releases", "Releases"),
  link("mdn", "https://developer.mozilla.org", "MDN"),
  link("stackoverflow", "https://stackoverflow.com", "Stack Overflow"),
  link("typescript", "https://www.typescriptlang.org", "TypeScript"),
  link("react", "https://react.dev", "React"),
  link("nextjs", "https://nextjs.org", "Next.js"),
  link("tailwind", "https://tailwindcss.com", "Tailwind CSS"),
  link("railway", "https://railway.app", "Railway"),
  link("supabase", "https://supabase.com", "Supabase"),
  link("sentry", "https://sentry.io", "Sentry"),
  link("npm", "https://www.npmjs.com", "npm"),
  link("docker", "https://www.docker.com", "Docker"),
  link("cloudflare", "https://dash.cloudflare.com", "Cloudflare"),
  link("vitest", "https://vitest.dev", "Vitest"),
  link("playwright", "https://playwright.dev", "Playwright"),
  link("posthog", "https://posthog.com", "PostHog"),
  link("prisma", "https://www.prisma.io", "Prisma"),
  link("stripe", "https://dashboard.stripe.com", "Stripe"),
  link("hackernews", "https://news.ycombinator.com", "Hacker News"),
  link("obsidian", "https://obsidian.md", "Obsidian"),
  link("raycast", "https://www.raycast.com", "Raycast"),
];

export function createStarterLibrary(): Library {
  const work = workspace("work", "Work", workTheme, [
    {
      id: "work-today",
      name: "Today",
      handleIcon: "☀️",
      links: ["linear", "github", "notion", "figma", "slack"],
    },
    {
      id: "work-reshell",
      name: "Reshell",
      handleIcon: "🐚",
      links: ["localhost", "reshell-repo", "cloudflare", "ci", "releases"],
    },
    {
      id: "work-docs",
      name: "Docs",
      handleIcon: "📚",
      links: ["mdn", "typescript", "react", "nextjs", "tailwind", "stackoverflow"],
    },
    {
      id: "work-ship",
      name: "Ship",
      handleIcon: "🚀",
      links: ["railway", "supabase", "sentry", "npm", "docker", "prisma", "stripe", "posthog"],
    },
    {
      id: "work-quality",
      name: "Quality",
      handleIcon: "✅",
      links: ["vitest", "playwright", "posthog"],
    },
  ]);

  const personal = workspace("personal", "Personal", personalTheme, [
    {
      id: "personal-read",
      name: "Read",
      handleIcon: "📰",
      links: ["hackernews", "obsidian"],
    },
    {
      id: "personal-tools",
      name: "Tools",
      handleIcon: "🧰",
      links: ["raycast", "notion", "figma"],
    },
    {
      id: "personal-learn",
      name: "Learn",
      handleIcon: "📖",
      links: ["mdn", "typescript", "react", "nextjs"],
    },
    {
      id: "personal-projects",
      name: "Side projects",
      handleIcon: "🌙",
      links: ["github", "cloudflare", "railway", "prisma", "stripe"],
    },
  ]);

  return {
    schemaVersion: LIBRARY_SCHEMA_VERSION,
    catalog: STARTER_CATALOG,
    workspaces: [work, personal],
    shortcuts: {
      focusCommandBar: "Meta+Shift+k",
      cycleWorkspace: "Control+Tab",
    },
    activeWorkspaceId: work.id,
  };
}
