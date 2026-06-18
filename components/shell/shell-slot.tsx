"use client";

import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { anchorHitZoneStyle, notchContentStyle } from "@/lib/shell/coordinates";
import { useShell, useShellEdge } from "./shell-context";
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
    bounds,
    activate,
    deactivate,
    activeSlotId,
    animatedNotch,
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

  const contentStyle = useMemo(() => {
    if (!isActive || !anchor || !animatedNotch) {
      return null;
    }

    if (
      animatedNotch.edge !== anchor.edge ||
      Math.abs(animatedNotch.center - anchor.center) >= 0.01
    ) {
      return null;
    }

    if (animatedNotch.depth <= 0) {
      return null;
    }

    return notchContentStyle(bounds, animatedNotch);
  }, [isActive, anchor, animatedNotch, bounds]);

  function handlePointerLeave(event: React.PointerEvent<HTMLDivElement>) {
    const relatedTarget = event.relatedTarget;
    if (
      relatedTarget instanceof Element &&
      relatedTarget.closest(`[data-shell-slot="${id}"]`)
    ) {
      return;
    }

    deactivate();
  }

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
      {children && contentStyle ? (
        <div
          data-shell-slot={id}
          className="z-[55] box-border overflow-hidden"
          style={contentStyle}
          onPointerLeave={handlePointerLeave}
        >
          {children}
        </div>
      ) : null}
    </>
  );
}
