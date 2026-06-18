import type { ShellBounds, ShellEdge } from "./types";

export function cornerInset(bounds: ShellBounds): number {
  return bounds.rx + 1;
}

export function getEdgeSpan(
  bounds: ShellBounds,
  edge: ShellEdge,
): { start: number; end: number; length: number } {
  const inset = cornerInset(bounds);

  if (edge === "top" || edge === "bottom") {
    const start = bounds.left + inset;
    const end = bounds.right - inset;
    return { start, end, length: end - start };
  }

  const start = bounds.top + inset;
  const end = bounds.bottom - inset;
  return { start, end, length: end - start };
}
