/**
 * The icon-resolver seam (CONTEXT: an `icon` field on bookmarks/groups/stations).
 * Pure, zero React/DOM (ADR-0009) so every tier reuses it. A small, total
 * function (never throws) that classifies a raw icon string in priority order:
 *
 *   1. image URL  — cheap `http(s)://` regex        → `{ kind: "image" }`
 *   2. named      — matches a curated registry key   → `{ kind: "named" }`
 *   3. emoji/text — anything else (the literal)      → `{ kind: "emoji" }`
 *
 * The curated names live in `./names` (pure) so this stays unit-testable in
 * node without pulling the client pack; `<Icon>` turns the result into pixels.
 */

import { isIconName, type IconName } from "./names";

export type ResolvedIcon =
  | { kind: "image"; src: string }
  | { kind: "named"; name: IconName }
  | { kind: "emoji"; value: string }
  | { kind: "none" };

const IMAGE_URL = /^https?:\/\//i;

export function resolveIcon(value?: string): ResolvedIcon {
  const raw = value?.trim();
  if (!raw) {
    return { kind: "none" };
  }
  if (IMAGE_URL.test(raw)) {
    return { kind: "image", src: raw };
  }
  if (isIconName(raw)) {
    return { kind: "named", name: raw };
  }
  // Fallback: treat any other literal (an emoji, an unknown name, a glyph) as
  // text. `<Icon>` renders it verbatim in a span, so nothing is ever lost.
  return { kind: "emoji", value: raw };
}
