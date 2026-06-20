"use client";

import { type ReactNode } from "react";
import { HANDLE_OFFSET_PX } from "@/lib/shell/constants";
import { handleStyle } from "@/lib/shell/handle-position";
import type { ShellHandleComponent } from "@/lib/shell/theme";
import { useShell } from "./shell-context";

/**
 * Wires a slot's handle to the shell interaction model (hover intent, pin/
 * toggle, focus) and gutter positioning, then delegates rendering to a headless
 * handle component: a per-slot override, else the theme's `Handle`, else the
 * built-in default. The component receives all behaviour as props and is
 * responsible only for visuals (see docs/adr/0005).
 */
export function ShellHandle({
  slotId,
  label,
  component,
  children,
}: {
  slotId: string;
  label: string;
  component?: ShellHandleComponent;
  children: ReactNode;
}) {
  const {
    theme,
    bounds,
    activeSlotId,
    hoverEnter,
    hoverLeave,
    focusOpen,
    toggleSlot,
    getAnchor,
  } = useShell();
  const anchor = getAnchor(slotId);
  const isActive = activeSlotId === slotId;

  if (!anchor) {
    return null;
  }

  const Handle = component ?? theme.Handle;

  return (
    <Handle
      slotId={slotId}
      label={label}
      active={isActive}
      style={handleStyle(bounds, anchor, HANDLE_OFFSET_PX)}
      onPointerEnter={() => hoverEnter(slotId)}
      onPointerLeave={hoverLeave}
      onFocus={() => focusOpen(slotId)}
      onBlur={hoverLeave}
      onClick={() => toggleSlot(slotId)}
    >
      {children}
    </Handle>
  );
}
