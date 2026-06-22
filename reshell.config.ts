import type { ReshellConfig } from "@/lib/config";

/**
 * Your reshell setup. This file is the read-only source of truth — edit it like
 * a dotfile and reload. Runtime changes (active workspace, scene/widget toggles
 * from the command center) are stored separately as a per-workspace override and
 * merged over this (ADR-0007); reset a workspace to fall back to these values.
 */
export const reshellConfig = {
  displayName: "Jack",
  defaultWorkspaceId: "work",
  clock: { format: "24h", timezone: "local" },
  quotes: [
    { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
    { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  ],
  workspaces: [
    {
      id: "work",
      name: "Work",
      scene: "default",
      widgets: { clock: true, welcome: true, quote: true },
      bookmarks: {
        left: [
          {
            name: "Dev",
            icon: "🛠️",
            links: [
              { url: "https://github.com", title: "GitHub", icon: "🐙" },
              { url: "https://stackoverflow.com" },
              { url: "https://developer.mozilla.org", title: "MDN" },
            ],
          },
          {
            name: "Docs",
            icon: "📚",
            links: [
              { url: "https://nextjs.org/docs", title: "Next.js" },
              { url: "https://react.dev" },
              { url: "https://tailwindcss.com" },
            ],
          },
        ],
        top: [
          {
            name: "Mail",
            icon: "✉️",
            links: [
              { url: "https://mail.google.com", title: "Gmail" },
              { url: "https://calendar.google.com", title: "Calendar" },
            ],
          },
        ],
      },
    },
    {
      id: "personal",
      name: "Personal",
      scene: "editorial",
      widgets: { clock: true, welcome: true },
      bookmarks: {
        left: [
          {
            name: "Read",
            icon: "📖",
            links: [
              { url: "https://news.ycombinator.com", title: "Hacker News" },
              { url: "https://www.reddit.com" },
            ],
          },
        ],
        bottom: [
          {
            name: "Watch",
            icon: "📺",
            links: [
              { url: "https://youtube.com", title: "YouTube" },
              { url: "https://twitch.tv" },
            ],
          },
        ],
      },
    },
  ],
} satisfies ReshellConfig;

export default reshellConfig;
