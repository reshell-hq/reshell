/**
 * The curated set of named icons (plan 015). This is the single source of truth
 * for which `icon: "name"` strings resolve to a pack glyph; `registry.ts` maps
 * each name to its `@animateicons/react/lucide` component and is type-checked
 * against this list, while `resolve.ts` consults `isIconName` to classify.
 *
 * Pure + zero React/DOM (ADR-0009) so the resolver stays unit-testable in node
 * without importing the (client, motion-backed) pack components. Adding a
 * default = one entry here + one mapping in `registry.ts`.
 */

export const ICON_NAMES = [
  // Dev / code
  "github",
  "gitlab",
  "git-branch",
  "code",
  "terminal",
  "figma",
  "chrome",
  "globe",
  // Communication
  "mail",
  "send",
  "message",
  "phone",
  "twitter",
  "linkedin",
  // Content / media
  "book",
  "headphones",
  "play",
  "star",
  "heart",
  "sparkles",
  "bell",
  // Navigation / places
  "home",
  "folder",
  "bookmark",
  "link",
  "search",
  "compass",
  "map-pin",
  "grid",
  "list",
  // Productivity / tools
  "settings",
  "clipboard",
  "check",
  // Commerce
  "cart",
  "wallet",
  "dollar",
  // Misc
  "rocket",
  "flame",
  "zap",
  "sun",
  "moon",
  "coffee",
  "telescope",
  "lock",
  "user",
  "users",
] as const;

/** A curated default-icon name (config authoring gets autocomplete from this). */
export type IconName = (typeof ICON_NAMES)[number];

const NAME_SET: ReadonlySet<string> = new Set(ICON_NAMES);

/** Total type guard: is `value` one of the curated names? */
export function isIconName(value: string): value is IconName {
  return NAME_SET.has(value);
}
