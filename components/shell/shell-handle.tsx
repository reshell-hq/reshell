"use client";

import { type PointerEvent, type ReactNode } from "react";
import { HANDLE_OFFSET_PX } from "@/lib/shell/constants";
import { handleStyle } from "@/lib/shell/handle-position";
import { useShell } from "./shell-context";

/**
 * Affordance rendered just outside the shell border that opens its slot on
 * hover. Shares the `data-shell-slot` marker with the activation zone and the
 * portal so pointer travel between handle and revealed content never closes the
 * slot. Rendered as a button for keyboard/AT users.
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
  const { bounds, activeSlotId, activate, deactivate, getAnchor } = useShell();
  const anchor = getAnchor(slotId);
  const isActive = activeSlotId === slotId;

  if (!anchor) {
    return null;
  }

  function handlePointerLeave(event: PointerEvent<HTMLButtonElement>) {
    const relatedTarget = event.relatedTarget;
    if (
      relatedTarget instanceof Element &&
      relatedTarget.closest(`[data-shell-slot="${slotId}"]`)
    ) {
      return;
    }

    deactivate();
  }

  return (
    <button
      type="button"
      data-shell-slot={slotId}
      aria-label={label}
      aria-expanded={isActive}
      className="pointer-events-auto fixed z-[70] flex items-center justify-center"
      style={handleStyle(bounds, anchor, HANDLE_OFFSET_PX)}
      onPointerEnter={() => activate(slotId)}
      onPointerLeave={handlePointerLeave}
      onFocus={() => activate(slotId)}
      onClick={() => (isActive ? deactivate() : activate(slotId))}
    >
      {children}
    </button>
  );
}
