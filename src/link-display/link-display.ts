import type { Link } from "@/library/types";

export function resolveLinkTitle(link: Link): string {
  if (link.title?.trim()) {
    return link.title.trim();
  }

  try {
    const hostname = new URL(link.url).hostname.replace(/^www\./, "");
    return hostname || link.url;
  } catch {
    return link.url;
  }
}

export function defaultFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return "";
  }
}

export function resolveLinkImageUrl(
  link: Link,
  faviconUrl: (url: string) => string = defaultFaviconUrl,
): string {
  if (link.image?.trim()) {
    return link.image.trim();
  }

  return faviconUrl(link.url);
}
