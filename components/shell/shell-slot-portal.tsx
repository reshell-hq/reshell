"use client";

import {
  useMemo,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { notchContentStyle, revealContentStyle } from "@/lib/shell/coordinates";
import { useShell } from "./shell-context";

/**
 * Renders the visible copy of a slot's children into the shell overlay via a
 * portal. An outer layer is sized to the animated cavity and clips; an inner
 * layer holds the full-size content scaled by the open progress and pinned to
 * the docking edge, so it reads as zooming out of the notch as it opens. The
 * offscreen measurer in `Shell.Slot` stays the single size source; this is
 * purely the on-screen render.
 */
export function ShellSlotPortal({
  slotId,
  children,
}: {
  slotId: string;
  children: ReactNode;
}) {
  const {
    theme,
    bounds,
    activeSlotId,
    animatedNotch,
    animatedProgress,
    overlayElement,
    getAnchor,
    hoverEnter,
    hoverLeave,
    pinActive,
    unpinActive,
    closeActive,
  } = useShell();

  const isActive = activeSlotId === slotId;
  const anchor = getAnchor(slotId);

  const styles = useMemo(() => {
    if (!isActive || !anchor || !animatedNotch) {
      return null;
    }

    // The pocket may be sliding (same-edge morph) so the center need not match
    // the resting anchor; the edge and an open cavity are enough.
    if (animatedNotch.edge !== anchor.edge || animatedNotch.depth <= 0) {
      return null;
    }

    return {
      clip: {
        ...notchContentStyle(bounds, animatedNotch),
        background: theme.panelColor,
      },
      inner: revealContentStyle(animatedNotch.edge, animatedProgress),
    };
  }, [isActive, anchor, animatedNotch, animatedProgress, bounds, theme.panelColor]);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    // Focus moved outside this slot's content — release the pin and let the
    // hover controller close it.
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }
    unpinActive();
    hoverLeave();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      closeActive();
    }
  }

  if (!styles || !overlayElement) {
    return null;
  }

  return createPortal(
    <div
      data-shell-slot={slotId}
      className="pointer-events-auto box-border overflow-hidden"
      style={styles.clip}
      onPointerEnter={() => hoverEnter(slotId)}
      onPointerLeave={hoverLeave}
      onFocusCapture={pinActive}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <div style={styles.inner}>{children}</div>
    </div>,
    overlayElement,
  );
}
