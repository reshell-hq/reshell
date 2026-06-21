"use client";

import type { ShellHandleRenderProps } from "@/lib/shell/theme";

/**
 * The right-rim internal-tool handle (CONTEXT: "Edge handle" — internal-tool
 * handles use a "ghost variant (glyph only, no card)"). Headless: the shell owns
 * all interaction wiring; this renders a bare glyph with no pill/card surface so
 * it sits in the narrow right gutter without overflowing the canvas. The glyph
 * brightens on hover and when the tool flyout is open.
 */
export function GhostHandle({
  slotId,
  label,
  active,
  style,
  children,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  onClick,
}: ShellHandleRenderProps) {
  return (
    <button
      type="button"
      data-shell-slot={slotId}
      aria-label={label}
      aria-expanded={active}
      data-active={active ? "" : undefined}
      className="pointer-events-auto fixed z-[70] flex h-7 w-7 items-center justify-center rounded-md bg-transparent text-base leading-none text-current opacity-45 transition-opacity hover:opacity-90 focus-visible:opacity-90 focus-visible:outline-none data-[active]:opacity-100"
      style={style}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
