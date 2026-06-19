"use client";

import { type ReactNode } from "react";
import { HANDLE_OFFSET_PX } from "@/lib/shell/constants";
import { handleStyle } from "@/lib/shell/handle-position";
import { useShell } from "./shell-context";

/**
 * Affordance rendered in the gutter outside the shell rim that opens its slot
 * on hover (debounced) and toggles a pinned-open state on click. Shares the
 * `data-shell-slot` marker with the activation zone and the portal; the
 * centralized hover controller (close delay + debounce) handles pointer travel
 * between handle and revealed content. Rendered as a button for keyboard/AT.
 */
export function ShellHandle({
  slotId,
  label,
  children,
}: {
  slotId: string;
  label: string;
  children: ReactNode;
}) {
  const { bounds, activeSlotId, hoverEnter, hoverLeave, focusOpen, toggleSlot, getAnchor } =
    useShell();
  const anchor = getAnchor(slotId);
  const isActive = activeSlotId === slotId;

  if (!anchor) {
    return null;
  }

  return (
    <button
      type="button"
      data-shell-slot={slotId}
      aria-label={label}
      aria-expanded={isActive}
      data-active={isActive ? "" : undefined}
      className="pointer-events-auto fixed z-[70] flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300/70 bg-white/90 text-zinc-700 shadow-sm backdrop-blur transition-colors hover:border-zinc-400 hover:text-zinc-950 data-[active]:border-zinc-500 data-[active]:bg-zinc-900 data-[active]:text-white dark:border-zinc-700/70 dark:bg-zinc-900/90 dark:text-zinc-200 dark:data-[active]:bg-white dark:data-[active]:text-zinc-900"
      style={handleStyle(bounds, anchor, HANDLE_OFFSET_PX)}
      onPointerEnter={() => hoverEnter(slotId)}
      onPointerLeave={hoverLeave}
      onFocus={() => focusOpen(slotId)}
      onBlur={hoverLeave}
      onClick={() => toggleSlot(slotId)}
    >
      {children}
    </button>
  );
}
