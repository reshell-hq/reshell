import type {
  EdgeGutters,
  NotchSpec,
  ShellBounds,
  ShellEdge,
  Size,
  SlotAnchor,
  SlotExtent,
  SlotRegistration,
} from "./types";

/** Used before the viewport is measured (SSR / first paint). */
const FALLBACK_VIEWPORT: Size = { width: 1280, height: 800 };

/** Notch may grow up to half the interior depth before content must scroll. */
const MAX_DEPTH_RATIO = 0.5;

// --- Edge spans & anchors ---------------------------------------------------

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

export function anchorPositions(
  bounds: ShellBounds,
  edge: ShellEdge,
  slotCount: number,
): number[] {
  if (slotCount <= 0) {
    return [];
  }

  const { start, length } = getEdgeSpan(bounds, edge);

  return Array.from({ length: slotCount }, (_, index) => {
    return start + (length / (slotCount + 1)) * (index + 1);
  });
}

export function getSlotAnchor(
  bounds: ShellBounds,
  slot: SlotRegistration,
): SlotAnchor {
  const positions = anchorPositions(bounds, slot.edge, slot.siblingCount);
  return {
    edge: slot.edge,
    center: positions[slot.anchorIndex] ?? positions[0],
  };
}

// --- Bounds from gutters ----------------------------------------------------

/**
 * Builds shell bounds from per-edge pixel gutters, so the margin between the
 * rim and the screen edge is a physical size set independently on each edge: a
 * full gutter where handles live, a sliver on a minimised edge (see ADR-0004).
 * Bounds stay in the shell percentage space (viewBox 100×100) for positioning;
 * only their values are derived from pixels.
 */
export function shellBoundsForViewport(
  viewport: Size,
  gutters: EdgeGutters,
  radius: number,
): ShellBounds {
  const width = viewport.width > 0 ? viewport.width : FALLBACK_VIEWPORT.width;
  const height =
    viewport.height > 0 ? viewport.height : FALLBACK_VIEWPORT.height;

  return {
    left: (gutters.left / width) * 100,
    top: (gutters.top / height) * 100,
    right: 100 - (gutters.right / width) * 100,
    bottom: 100 - (gutters.bottom / height) * 100,
    rx: radius,
    ry: radius,
  };
}

// --- Content size → notch extent (+ clamping) -------------------------------

export function contentSizeToExtent(edge: ShellEdge, size: Size): SlotExtent {
  switch (edge) {
    case "bottom":
    case "top":
      return { depth: size.height, halfExtent: size.width / 2 };
    case "left":
    case "right":
      return { depth: size.width, halfExtent: size.height / 2 };
  }
}

function maxDepth(bounds: ShellBounds, edge: NotchSpec["edge"]): number {
  const interiorHeight = bounds.bottom - bounds.top;
  const interiorWidth = bounds.right - bounds.left;

  if (edge === "top" || edge === "bottom") {
    return interiorHeight * MAX_DEPTH_RATIO;
  }

  return interiorWidth * MAX_DEPTH_RATIO;
}

function maxHalfExtent(bounds: ShellBounds, anchor: SlotAnchor): number {
  const { start, end } = getEdgeSpan(bounds, anchor.edge);
  const margin = cornerInset(bounds);
  const availableBefore = anchor.center - start - margin;
  const availableAfter = end - anchor.center - margin;

  return Math.max(0, Math.min(availableBefore, availableAfter));
}

export function clampExtent(
  bounds: ShellBounds,
  anchor: SlotAnchor,
  extent: SlotExtent,
): SlotExtent {
  return {
    depth: Math.min(extent.depth, maxDepth(bounds, anchor.edge)),
    halfExtent: Math.min(extent.halfExtent, maxHalfExtent(bounds, anchor)),
  };
}

// --- Pixels → viewBox units -------------------------------------------------

export function pixelsToViewBoxWithScreen(
  pixels: Size,
  screen: Size,
  viewBox: Size = { width: 100, height: 100 },
): Size {
  if (screen.width === 0 || screen.height === 0) {
    return { width: 0, height: 0 };
  }

  return {
    width: (pixels.width / screen.width) * viewBox.width,
    height: (pixels.height / screen.height) * viewBox.height,
  };
}

export function pixelsToViewBox(pixels: Size, svgElement: SVGSVGElement): Size {
  const rect = svgElement.getBoundingClientRect();
  const viewBox = svgElement.viewBox.baseVal;

  return pixelsToViewBoxWithScreen(
    pixels,
    { width: rect.width, height: rect.height },
    {
      width: viewBox.width > 0 ? viewBox.width : 100,
      height: viewBox.height > 0 ? viewBox.height : 100,
    },
  );
}

function pixelSizeToViewBox(pixelSize: Size, svg: SVGSVGElement | null): Size {
  if (svg) {
    return pixelsToViewBox(pixelSize, svg);
  }

  return pixelsToViewBoxWithScreen(pixelSize, {
    width: typeof window !== "undefined" ? window.innerWidth : 1000,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });
}

/**
 * Resolves a slot's measured pixel content size into its clamped notch extent
 * in viewBox units: anchor → viewBox size → edge extent → clamped to the room
 * available on its edge. The SVG (when present) supplies the live pixel↔viewBox
 * scale; otherwise a window-size fallback is used (pre-measurement / SSR).
 */
export function extentFromPixelSize(
  bounds: ShellBounds,
  slot: SlotRegistration,
  pixelSize: Size,
  svg: SVGSVGElement | null,
): SlotExtent {
  const anchor = getSlotAnchor(bounds, slot);
  const viewBoxSize = pixelSizeToViewBox(pixelSize, svg);
  const extent = contentSizeToExtent(slot.edge, viewBoxSize);

  return clampExtent(bounds, anchor, extent);
}
