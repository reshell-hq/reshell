"use client";

import {
  resolveLinkImageUrl,
  resolveLinkTitle,
} from "@/lib/link-display/link-display";
import type { Link } from "@/lib/library/types";

type EdgeFlyoutProps = {
  /** Preview links (already truncated to the edge limit by placement). */
  links: Link[];
  /** Whether the group has more links than the preview shows. */
  hasMore: boolean;
  /** Workspace text colour, so rows read on any themed panel surface. */
  textColor: string;
};

/**
 * The edge flyout for one edge group (CONTEXT: "Edge flyout") — bare link rows
 * on the notch surface, no card wrapper. Each row opens its link in a new tab.
 * When a group overflows the preview, a "see more" affordance appears; it is a
 * stub here (the launcher is a later slice).
 */
export function EdgeFlyout({ links, hasMore, textColor }: EdgeFlyoutProps) {
  return (
    <nav
      className="flex w-60 flex-col gap-0.5 p-2"
      style={{ color: textColor }}
    >
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <img
            src={resolveLinkImageUrl(link)}
            alt=""
            className="h-4 w-4 shrink-0 rounded-sm"
          />
          <span className="truncate">{resolveLinkTitle(link)}</span>
        </a>
      ))}
      {hasMore ? (
        <button
          type="button"
          className="mt-0.5 rounded-md px-2 py-1.5 text-left text-xs font-medium opacity-60 transition-opacity hover:opacity-100"
        >
          See more
        </button>
      ) : null}
    </nav>
  );
}
