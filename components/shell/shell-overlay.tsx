"use client";

import type { RefObject } from "react";

/**
 * Fixed, full-viewport layer that hosts portaled slot content. Sits above the
 * frame stroke (z-50) so revealed content reads as filling the notch cavity.
 * Pointer-events are disabled on the layer itself; individual portaled panels
 * re-enable them so the rest of the page stays interactive.
 */
export function ShellOverlay({
  overlayRef,
}: {
  overlayRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-[60]"
      aria-live="polite"
    />
  );
}
