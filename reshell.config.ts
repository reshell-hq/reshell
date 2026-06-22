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
  music: {
    // YouTube-only stations. A `watch?v=`/`youtu.be` URL is a single video; a
    // `playlist?list=` URL is a whole playlist that auto-advances.
    stations: [
      {
        id: "lofi",
        label: "Lofi beats",
        url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        icon: "🎧",
      },
      {
        id: "jazz",
        label: "Coffee jazz",
        url: "https://youtu.be/Dx5qFachd3A",
        icon: "☕",
      },
      {
        id: "ambient",
        label: "Ambient focus",
        url: "https://www.youtube.com/playlist?list=PLOzDu-MXXLliO9fBNZOQTBDddoA3FzZUo",
        icon: "🌌",
      },
    ],
  },
  workspaces: [
    {
      id: "work",
      name: "Work",
      scene: "default",
      widgets: { clock: true, welcome: true, quote: true },
      bookmarks: {
        // `icon` resolves image URL → curated named glyph → emoji/literal. Named
        // glyphs (e.g. "github") animate on hover; bookmarks with no icon fall
        // back to their favicon. Mix freely — see lib/icons/README.md for names.
        // The `top` edge is reserved for the command center (a single top-edge
        // fixture); placing bookmark groups there too lands both handles at
        // top-centre, since the shell distributes anchors within one edge, not
        // across the separate `Shell.Edge`s the command center and groups mount
        // (see AGENTS.md → "Edge reservations"). Keep bookmark groups on
        // left/bottom; `right` is reserved for tools.
        left: [
          {
            name: "Dev",
            icon: "code",
            links: [
              { url: "https://github.com", title: "GitHub", icon: "github" },
              { url: "https://stackoverflow.com" },
              { url: "https://developer.mozilla.org", title: "MDN" },
            ],
          },
          {
            name: "Docs",
            icon: "book",
            links: [
              { url: "https://nextjs.org/docs", title: "Next.js" },
              { url: "https://react.dev" },
              { url: "https://tailwindcss.com" },
            ],
          },
          {
            name: "Mail",
            icon: "mail",
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
            icon: "book",
            links: [
              { url: "https://news.ycombinator.com", title: "Hacker News" },
              { url: "https://www.reddit.com" },
            ],
          },
        ],
        bottom: [
          {
            name: "Watch",
            // Emoji still wins over a named key — overrides keep working.
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
