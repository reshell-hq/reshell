import type { Bookmark } from "@/lib/config";

/**
 * How a bookmark presents in the UI (CONTEXT: "Bookmark"). Pure, zero React/DOM
 * (ADR-0009). The single home for favicon/title resolution — the command bar
 * (plan 010) reuses it, so don't duplicate it. Icon resolution itself lives in
 * `<Icon>` (plan 015): callers pass `bookmark.icon` with a favicon `fallback`.
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
