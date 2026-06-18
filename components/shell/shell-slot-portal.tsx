"use client";

import { useMemo, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { notchContentStyle } from "@/lib/shell/coordinates";
import { transformOriginForEdge } from "@/lib/shell/viewbox-to-css";
import { useShell } from "./shell-context";

/**
 * Renders the visible copy of a slot's children into the shell overlay via a
 * portal. The panel fills the animated notch cavity (clipped by the growing
 * rect) and is anchored to its docking edge so it reads as growing out of the
 * notch. The offscreen measurer in `Shell.Slot` stays mounted as the single
 * size source; this is purely the on-screen render.
 */
export function ShellSlotPortal({
  slotId,
  children,
}: {
  slotId: string;
  children: ReactNode;
}) {
  const {
    bounds,
    activeSlotId,
    animatedNotch,
    overlayElement,
    getAnchor,
    deactivate,
  } = useShell();

  const isActive = activeSlotId === slotId;
  const anchor = getAnchor(slotId);

  const revealStyle = useMemo(() => {
    if (!isActive || !anchor || !animatedNotch) {
      return null;
    }

    const onThisAnchor =
      animatedNotch.edge === anchor.edge &&
      Math.abs(animatedNotch.center - anchor.center) < 0.01;

    if (!onThisAnchor || animatedNotch.depth <= 0) {
      return null;
    }

    return {
      ...notchContentStyle(bounds, animatedNotch),
      transformOrigin: transformOriginForEdge(animatedNotch.edge),
    };
  }, [isActive, anchor, animatedNotch, bounds]);

  function handlePointerLeave(event: PointerEvent<HTMLDivElement>) {
    const relatedTarget = event.relatedTarget;
    if (
      relatedTarget instanceof Element &&
      relatedTarget.closest(`[data-shell-slot="${slotId}"]`)
    ) {
      return;
    }

    deactivate();
  }

  if (!revealStyle || !overlayElement) {
    return null;
  }

  return createPortal(
    <div
      data-shell-slot={slotId}
      className="pointer-events-auto box-border overflow-hidden"
      style={revealStyle}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </div>,
    overlayElement,
  );
}
