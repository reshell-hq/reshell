"use client";

import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { anchorHitZoneStyle } from "@/lib/shell/coordinates";
import { useShell, useShellEdge } from "./shell-context";
import { ShellSlotPortal } from "./shell-slot-portal";
import { useSlotMeasure } from "./use-slot-measure";

export type ShellSlotProps = {
  id: string;
  anchorIndex?: number;
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
  children,
}: ShellSlotProps) {
  const { side, siblingCount } = useShellEdge();
  const {
    activate,
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

  useEffect(() => {
    registerSlot({ id, edge: side, anchorIndex, siblingCount });
    return () => unregisterSlot(id);
  }, [id, side, anchorIndex, siblingCount, registerSlot, unregisterSlot]);

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
          onPointerEnter={() => activate(id)}
        />
      ) : null}
      {children ? <ShellSlotPortal slotId={id}>{children}</ShellSlotPortal> : null}
    </>
  );
}
