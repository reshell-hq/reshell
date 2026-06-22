"use client";

import { Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { displayTitle, faviconUrl } from "@/lib/bookmarks";
import type { Bookmark, BookmarkGroup } from "@/lib/config";
import type { ShellEdge } from "@/lib/shell/types";

/**
 * Renders one config bookmark group as a handled `Shell.Slot`: the handle shows
 * the group icon (or its initial), and the open panel lists its links. A pure
 * projection of config — no local state, no editing (CONTEXT: "Bookmark group").
 */
export function BookmarkGroupSlot({
  group,
  edge,
  index,
}: {
  group: BookmarkGroup;
  edge: ShellEdge;
  index: number;
}) {
  // Stable + unique per workspace+edge+index: a workspace renders one edge set
  // at a time, so edge+index is sufficient to disambiguate sibling groups.
  const slotId = `bm:${edge}:${index}`;
  const initial = group.name.trim().charAt(0).toUpperCase();

  return (
    <Shell.Slot
      id={slotId}
      handleLabel={group.name}
      handle={
        <Icon
          value={group.icon}
          className="text-sm"
          fallback={<span className="text-xs font-semibold">{initial}</span>}
        />
      }
    >
      <nav
        aria-label={group.name}
        className="flex w-60 flex-col gap-1 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg"
      >
        <p className="px-2 pt-1 pb-0.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {group.name}
        </p>
        <ul className="flex flex-col gap-0.5">
          {group.links.map((bookmark) => (
            <li key={bookmark.url}>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Icon value={rowIcon(bookmark)} className="h-4 w-4" />
                <span className="truncate">{displayTitle(bookmark)}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </Shell.Slot>
  );
}

/** The link row's icon: the bookmark's own icon, else its favicon (CONTEXT). */
function rowIcon(bookmark: Bookmark): string {
  return bookmark.icon?.trim() ? bookmark.icon : faviconUrl(bookmark.url);
}
