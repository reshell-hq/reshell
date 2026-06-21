"use client";

import type { EdgeHandleDisplay } from "@/lib/edge-handle/edge-handle";

/**
 * The visual inside an edge group's handle (CONTEXT: "Edge handle"). Passed as
 * the `handle` content of a left-edge `Shell.Slot`; the shell's handle chrome
 * (the gutter pill) wraps it. A custom image fills the pill; an emoji/text
 * glyph or name initials render as centered text.
 */
export function EdgeHandle({ display }: { display: EdgeHandleDisplay }) {
  if (display.kind === "image") {
    return (
      <img
        src={display.url}
        alt=""
        className="h-full w-full rounded-full object-cover"
      />
    );
  }

  return (
    <span aria-hidden className="text-[0.8125rem] font-medium leading-none">
      {display.text}
    </span>
  );
}
