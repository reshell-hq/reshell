"use client";

import {
  useEffect,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useShell } from "./shell-context";

/**
 * Renders the visible copy of a slot's children into the shell overlay via a
 * portal. An outer layer is sized to the animated cavity and clips; an inner
 * layer holds the full-size content scaled by the open progress and pinned to
 * the docking edge, so it reads as zooming out of the notch as it opens. The
 * offscreen measurer in `Shell.Slot` stays the single size source.
 *
 * Mount/unmount is purely discrete (driven by `activeSlotId`); the per-frame
 * positioning is written straight to these DOM nodes by the animation loop,
 * which reads them via `setPortal`/`clearPortal` (see docs/adr/0006). The clip
 * starts hidden and the loop reveals it once the notch reaches this edge.
 */
export function ShellSlotPortal({
  slotId,
  children,
}: {
  slotId: string;
  children: ReactNode;
}) {
  const {
    activeSlotId,
    overlayElement,
    getAnchor,
    setPortal,
    clearPortal,
    hoverEnter,
    hoverLeave,
    pinActive,
    unpinActive,
    closeActive,
  } = useShell();

  const isActive = activeSlotId === slotId;
  const edge = getAnchor(slotId)?.edge ?? null;
  const clipRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !edge || !overlayElement) {
      return;
    }
    const clip = clipRef.current;
    const inner = innerRef.current;
    if (!clip || !inner) {
      return;
    }
    setPortal({ slotId, edge, clip, inner });
    return () => clearPortal(slotId);
  }, [isActive, edge, overlayElement, slotId, setPortal, clearPortal]);

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

  if (!isActive || !overlayElement) {
    return null;
  }

  return createPortal(
    <div
      ref={clipRef}
      data-shell-slot={slotId}
      className="pointer-events-auto box-border overflow-hidden"
      style={{ display: "none" }}
      onPointerEnter={() => hoverEnter(slotId)}
      onPointerLeave={hoverLeave}
      onFocusCapture={pinActive}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <div ref={innerRef}>{children}</div>
    </div>,
    overlayElement,
  );
}
