"use client";

/**
 * Fixed, full-viewport layer that hosts portaled slot content. Sits above the
 * frame stroke (z-50) so revealed content reads as filling the notch cavity.
 * Pointer-events are disabled on the layer itself; individual portaled panels
 * re-enable them so the rest of the page stays interactive.
 *
 * The element is reported via a callback ref (stored in context state) so
 * portals re-render and mount as soon as the target exists.
 */
export function ShellOverlay({
  onMount,
}: {
  onMount: (element: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={onMount}
      className="pointer-events-none fixed inset-0 z-[60]"
      aria-live="polite"
    />
  );
}
