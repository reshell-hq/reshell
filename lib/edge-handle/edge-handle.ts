import type { EdgeGroup } from "@/lib/library/types";

/**
 * The visible icon for an edge group on the rim (CONTEXT: "Edge handle").
 * Resolved from a user-assigned source: a custom image URL, else an emoji/text
 * glyph, else initials derived from the group name.
 */
export type EdgeHandleDisplay =
  | { kind: "image"; url: string }
  | { kind: "glyph"; text: string };

function isImageUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Image URL → emoji/text glyph → name initials. */
export function resolveEdgeHandleDisplay(
  group: Pick<EdgeGroup, "name" | "handleIcon">,
): EdgeHandleDisplay {
  const icon = group.handleIcon?.trim();
  if (icon && isImageUrl(icon)) {
    return { kind: "image", url: icon };
  }
  if (icon) {
    return { kind: "glyph", text: icon };
  }
  return { kind: "glyph", text: initialsFromName(group.name) };
}
