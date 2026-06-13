# Reshell

**Make any browser your home.** Reshell is a portable home station for links, projects, and focus workflows — a spatial shell with edge quickmenus, a keyboard-first command bar, and a calm canvas. Your library stays in the browser; export it as YAML when you want to back up or move machines.

Public preview · [github.com/reshell-hq/reshell](https://github.com/reshell-hq/reshell)

## Two surfaces

| Surface | Route | Use it for |
| -------- | ----- | ---------- |
| **Home station** | `/home` | Pin this tab and work from Reshell all day — full shell, workspaces, tools, and canvas |
| **Start page** | `/start` | Bookmark as your browser new-tab URL for instant search-and-launch |

Open `/home` once before relying on `/start`. Both surfaces read the same **library** from IndexedDB in your browser.

## Try it locally

Requires Node.js 22 (see `.nvmrc`).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then:

1. Visit **/home** — seeds the starter template into IndexedDB
2. **Pin /home** — keep the full shell open as a pinned tab
3. **Bookmark /start** — set it as your new-tab URL for fast launch

## What you get

- **Spatial shell** — rim frame with notch-expanding edge menus, not a sidebar dashboard
- **Workspaces** — separate themes and link placements per context (Work, Personal, …); shared link catalog
- **Command bar** — type-to-focus fuzzy search for links, workspaces, and shell actions
- **Edge groups** — named link clusters on the left rim; control center (top), command bar (bottom), internal tools (right)
- **Internal tools** — pomodoro timer and focus tasks on the right rim
- **Canvas widgets** — clock, welcome message, quote, now playing, pomodoro, and focus tasks
- **Theme & layout presets** — bundled palettes and canvas layouts per workspace
- **Library snapshots** — export and import your entire setup as versioned YAML (dotfiles-friendly)
- **Offline-ready** — all data in IndexedDB; works on localhost or a hosted URL

## Your library

Your **library** — workspaces, link catalog, placements, themes, shortcuts, and tool state — lives in IndexedDB under the name `reshell` on this browser.

- **Export** — `:export` in the command bar or settings → `reshell-snapshot.yaml`
- **Import** — `:import` or load a snapshot from a URL (e.g. a raw file in a GitHub dotfiles repo)
- **Example config** — fork [reshell-hq/reshell-config](https://github.com/reshell-hq/reshell-config) for a starter `library.yaml` and agent skills to author your own
- **Reset** — `:reset` (requires confirmation); re-seeds the starter template

Snapshots reference theme background images by URL, not embedded bytes. Import replaces the local library. Cross-machine restore is manual via snapshot today — **cloud library sync** is planned for a future paid edition.

> **Upgrading from the Yeti preview:** the IndexedDB store was renamed `yeti` → `reshell`, so Reshell starts from the starter template on first load. Export a `yeti-snapshot.yaml` from your old library beforehand and re-import it, or just re-seed — the old `yeti` store is left untouched and can be cleared from your browser's devtools.

Machine-readable summary for assistants and crawlers: [`/llms.txt`](https://github.com/reshell-hq/reshell/blob/main/public/llms.txt) when deployed, or [`public/llms.txt`](./public/llms.txt) in this repo.

## Self-hosting (Cloudflare Workers)

Reshell uses Next.js API routes (`/api/focus-radio/stream`, `/api/calendar/ics`). Deploy with the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare) — vanilla `next build` + `.next` output is not sufficient.

1. **Workers & Pages** → **Create** → **Workers** → **Connect to Git**
2. Select this repo, production branch **`main`**
3. Build settings (Node.js **22**). Leave the build output directory empty — the adapter writes to `.open-next/`.

**Recommended:** leave build command empty, set deploy command to `npm run deploy`.

**Alternative:** build command `npm run cf:build`, deploy command `npx opennextjs-cloudflare deploy`.

Do **not** use the old Cloudflare Pages preset (`npm run build` + `.next` output).

`npm run cf:build` runs OpenNext **and** a post-build worker patch required for cold starts.

4. Under **Settings → Compatibility**, enable **`nodejs_compat`** and set compatibility date to **2024-09-23** or later.

### Local Cloudflare preview

```bash
cp .dev.vars.example .dev.vars   # once — local only, not committed
npm run preview                  # cf:build + wrangler dev
```

### Environment variables

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `NEXT_PUBLIC_WAITLIST_URL` | No | External waitlist form URL (Tally, Buttondown, etc.) |
| `NEXT_PUBLIC_SITE_URL` | No | Production URL for Open Graph absolute image links |

When `NEXT_PUBLIC_WAITLIST_URL` is set, the landing page shows a **Join the waitlist** button. When unset, the button is hidden.

## Contributing

```bash
npm run dev          # Next.js dev server
npm run test         # Vitest
npm run lint         # xo
npm run format       # prettier
```

Stack: Next.js (App Router) · TypeScript · Tailwind CSS · Framer Motion · Zustand · TanStack Query · IndexedDB (`idb`)

## Releases

Version bumps and GitHub Releases are automated from [Conventional Commits](https://www.conventionalcommits.org/) on `main` via [semantic-release](https://semantic-release.gitbook.io/). Deploy is separate — Cloudflare rebuilds when you push to `main`.
