"use client";

import type { ShellHandleRenderProps } from "@/lib/shell/theme";

/**
 * Built-in handle visual: a pill button in the gutter. Headless override
 * target — receives all interaction wiring as props and renders only the
 * button chrome. Keeps its own (light/dark-aware) palette; consumers wanting a
 * different look pass their own `Handle` via the theme or per `Shell.Slot`.
 */
export function DefaultHandle({
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
      className="pointer-events-auto fixed z-[70] flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300/70 bg-white/90 text-zinc-700 shadow-sm backdrop-blur transition-colors hover:border-zinc-400 hover:text-zinc-950 data-[active]:border-zinc-500 data-[active]:bg-zinc-900 data-[active]:text-white dark:border-zinc-700/70 dark:bg-zinc-900/90 dark:text-zinc-200 dark:data-[active]:bg-white dark:data-[active]:text-zinc-900"
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
