import { createDefaultWorkspaceInternalTools } from "@/internal-tools/pomodoro";
import { createDefaultCanvasWidgets } from "@/canvas-widgets/config";
import { createStarterFocusRadio } from "@/focus-radio/starter-stations";
import { rebalanceKeys } from "@/fractional-order/fractional-order";
import { getThemePreset } from "@/theme/theme-presets";
import { LIBRARY_SCHEMA_VERSION } from "./schema";
import type { EdgeGroup, Library, Link, Theme, Workspace } from "./types";

function themeFromPreset(presetId: "work" | "personal"): Theme {
  const preset = getThemePreset(presetId)!;
  return {
    ...preset.theme,
    appliedPresetId: presetId,
    appliedThemePresetId: presetId,
    appliedLayoutPresetId: "default",
  };
}

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
  return linkIds.map((linkId, index) => ({
    linkId,
    orderKey: keys[index],
  }));
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

type WorkspacePlacementsInput = {
  left: EdgeGroupInput[];
  top: EdgeGroupInput[];
  bottom: EdgeGroupInput[];
};

function workspace(
  id: string,
  name: string,
  theme: Theme,
  placements: WorkspacePlacementsInput,
): Workspace {
  return {
    id,
    name,
    theme,
    placements: {
      edges: {
        left: orderedEdgeGroups(placements.left),
        top: orderedEdgeGroups(placements.top),
        bottom: orderedEdgeGroups(placements.bottom),
      },
    },
    internalTools: createDefaultWorkspaceInternalTools(),
    canvasWidgets: createDefaultCanvasWidgets(),
  };
}

const workTheme = themeFromPreset("work");
const personalTheme = themeFromPreset("personal");

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
  const catalog = STARTER_CATALOG;

  const work = workspace("work", "Work", workTheme, {
    left: [
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
        links: [
          "railway",
          "supabase",
          "sentry",
          "npm",
          "docker",
          "cloudflare",
          "prisma",
          "stripe",
          "posthog",
        ],
      },
      {
        id: "work-quality",
        name: "Quality",
        handleIcon: "✅",
        links: ["vitest", "playwright", "posthog"],
      },
    ],
    top: [],
    bottom: [],
  });

  const personal = workspace("personal", "Personal", personalTheme, {
    left: [
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
    ],
    top: [],
    bottom: [],
  });

  return {
    schemaVersion: LIBRARY_SCHEMA_VERSION,
    catalog,
    workspaces: [work, personal],
    shortcuts: {
      focusCommandBar: "Meta+Shift+k",
      cycleWorkspace: "Control+Tab",
    },
    focusRadio: createStarterFocusRadio(),
    activeWorkspaceId: work.id,
  };
}
