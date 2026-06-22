# Icons

The icon-resolver seam for any `icon` field (bookmarks, groups, music stations,
command entries). One `icon: string` resolves — in priority order — to:

1. **image** — an `http(s)://…` URL → `<img loading="lazy">`
2. **named** — a curated key below → a tree-shaken [`lucide-react`](https://lucide.dev) glyph (animates subtly on hover, honours `prefers-reduced-motion`)
3. **emoji / literal** — anything else → rendered verbatim in a span

Everything renders through the single `<Icon>` component (`components/icon`), so
precedence is consistent everywhere. `resolveIcon` (`./resolve`) is pure and
total (never throws); the curated names live in `./names` as the single source
of truth and are re-exported as the `IconName` union for editor autocomplete:

```ts
import type { IconName } from "@/lib/icons";
```

## Authoring

```ts
{ name: "Dev", icon: "code", links: [{ url: "https://github.com", icon: "github" }] }
{ name: "Watch", icon: "📺" }              // emoji wins over any named key
{ url: "…", icon: "https://x.com/i.png" }  // image URL wins over everything
// no icon → bookmarks fall back to the site favicon
```

## Curated names

Each maps to one `lucide-react` component (see `./registry.ts`). Add a default =
one entry in `./names` + one mapping in `./registry`.

| Group | Names |
|-------|-------|
| Dev / code | `github` · `gitlab` · `git-branch` · `code` · `terminal` · `figma` · `chrome` · `globe` |
| Communication | `mail` · `send` · `message` · `phone` · `twitter` · `linkedin` |
| Content / media | `book` · `headphones` · `play` · `star` · `heart` · `sparkles` · `bell` |
| Navigation / places | `home` · `folder` · `bookmark` · `link` · `search` · `compass` · `map-pin` · `grid` · `list` |
| Productivity / tools | `settings` · `clipboard` · `check` |
| Commerce | `cart` · `wallet` · `dollar` |
| Misc | `rocket` · `flame` · `zap` · `sun` · `moon` · `coffee` · `telescope` · `lock` · `user` · `users` |

### Brand-name substitutions

lucide v1 removed its brand glyphs, so these keys keep their familiar names but
render the closest non-brand icon:

| Name | Renders | Name | Renders |
|------|---------|------|---------|
| `github` | git-repo folder | `chrome` | browser window |
| `gitlab` | git fork | `twitter` | bird |
| `figma` | vector pen tool | `linkedin` | briefcase |

For an exact brand mark, use an image URL instead (e.g. `icon: "https://…/logo.svg"`).
