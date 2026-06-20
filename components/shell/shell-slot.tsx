"use client";

import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { anchorHitZoneStyle } from "@/lib/shell/coordinates";
import type { ShellHandleComponent } from "@/lib/shell/theme";
import { useShell, useShellEdge } from "./shell-context";
import { ShellHandle } from "./shell-handle";
import { ShellSlotPortal } from "./shell-slot-portal";
import { useSlotMeasure } from "./use-slot-measure";

export type ShellSlotProps = {
  id: string;
  anchorIndex?: number;
  /** Inner content of the handle (icon/label). Its presence opts the slot into a handle. */
  handle?: ReactNode;
  handleLabel?: string;
  /** Override the handle component for this slot only (else the theme's). */
  Handle?: ShellHandleComponent;
  children?: ReactNode;
};

const OFFSCREEN_MEASURE_STYLE = {
  position: "fixed",
  left: -9999,
  top: 0,
  width: "max-content",
  visibility: "hidden",
  pointerEvents: "none",
} as const;

export function ShellSlot({
  id,
  anchorIndex = 0,
  handle,
  handleLabel,
  Handle,
  children,
}: ShellSlotProps) {
  const { side, siblingCount } = useShellEdge();
  const {
    hoverEnter,
    hoverLeave,
    activeSlotId,
    registerSlot,
    unregisterSlot,
    getAnchor,
    getMinSlotExtent,
    updateSlotContentSize,
  } = useShell();

  const isActive = activeSlotId === id;

  const handleMeasure = useCallback(
    (size: { width: number; height: number }) => {
      updateSlotContentSize(id, size);
    },
    [id, updateSlotContentSize],
  );

  const measureRef = useSlotMeasure(handleMeasure);

  const hasHandle = handle != null;

  useEffect(() => {
    registerSlot({ id, edge: side, anchorIndex, siblingCount, hasHandle });
    return () => unregisterSlot(id);
  }, [
    id,
    side,
    anchorIndex,
    siblingCount,
    hasHandle,
    registerSlot,
    unregisterSlot,
  ]);

  const anchor = getAnchor(id);
  const minExtent = getMinSlotExtent(id);

  const activationStyle = useMemo(() => {
    if (!anchor || !minExtent || isActive) {
      return null;
    }

    return anchorHitZoneStyle(anchor, minExtent);
  }, [anchor, minExtent, isActive]);

  return (
    <>
      {children ? (
        <div
          ref={measureRef}
          style={OFFSCREEN_MEASURE_STYLE}
          aria-hidden
        >
          {children}
        </div>
      ) : null}
      {activationStyle ? (
        <div
          data-shell-slot={id}
          className="z-[55] touch-none"
          style={activationStyle}
          onPointerEnter={() => hoverEnter(id)}
          onPointerLeave={hoverLeave}
        />
      ) : null}
      {handle ? (
        <ShellHandle
          slotId={id}
          label={handleLabel ?? `Open ${id}`}
          component={Handle}
        >
          {handle}
        </ShellHandle>
      ) : null}
      {children ? <ShellSlotPortal slotId={id}>{children}</ShellSlotPortal> : null}
    </>
  );
}
