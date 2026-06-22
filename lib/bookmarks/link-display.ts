import type { Bookmark } from "@/lib/config";
import { resolveIcon, type ResolvedIcon } from "@/lib/icons";

/**
 * How a bookmark presents in the UI (CONTEXT: "Bookmark"). Pure, zero React/DOM
 * (ADR-0009). This is the single home for favicon/title resolution — the command
 * bar (plan 010) and `nowPlaying`/widgets reuse it, so don't duplicate it.
 */

/** Config `title` if set, else the URL hostname (sans `www.`), else the raw URL. */
export function displayTitle(bookmark: Bookmark): string {
  if (bookmark.title?.trim()) {
    return bookmark.title.trim();
  }
  try {
    const hostname = new URL(bookmark.url).hostname.replace(/^www\./, "");
    return hostname || bookmark.url;
  } catch {
    return bookmark.url;
  }
}

/**
 * A favicon URL for the link's host via Google's S2 service, falling back to the
 * site's own `/favicon.ico` when the URL can't be parsed.
 * ponytail: the S2 endpoint is a zero-config default; swap the provider here if
 * a privacy-respecting or self-hosted favicon source is ever wanted.
 */
export function faviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return "/favicon.ico";
  }
}

/** The bookmark's resolved `icon`, else its favicon as an image. */
export function displayIcon(bookmark: Bookmark): ResolvedIcon {
  const icon = resolveIcon(bookmark.icon);
  return icon.kind === "none"
    ? { kind: "image", src: faviconUrl(bookmark.url) }
    : icon;
}
