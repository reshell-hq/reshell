/**
 * The icon-resolver seam (CONTEXT: an `icon` field on bookmarks/groups/stations).
 * Pure, zero React/DOM (ADR-0009) so every tier reuses it. Classifies a raw icon
 * string in priority order: image URL (http/https) → emoji (literal) → named.
 *
 * Here it fully handles emoji + image; `named` is a placeholder kind until plan
 * 015 fills the curated `@animateicons/react` registry. Consumers render
 * `kind: "named"` as a neutral placeholder for now.
 */

export type ResolvedIcon =
  | { kind: "image"; src: string }
  | { kind: "emoji"; value: string }
  | { kind: "named"; name: string }
  | { kind: "none" };

const IMAGE_URL = /^https?:\/\//i;
// ponytail: a single Extended_Pictographic test is enough to tell a literal
// emoji from a named key like "github". Upgrade path (plan 015): full grapheme
// segmentation if multi-codepoint sequences ever need exact handling.
const EMOJI = /\p{Extended_Pictographic}/u;

export function resolveIcon(value?: string): ResolvedIcon {
  const raw = value?.trim();
  if (!raw) {
    return { kind: "none" };
  }
  if (IMAGE_URL.test(raw)) {
    return { kind: "image", src: raw };
  }
  if (EMOJI.test(raw)) {
    return { kind: "emoji", value: raw };
  }
  return { kind: "named", name: raw };
}
