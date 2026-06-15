import type { NotchPlacement, NotchSize, ShellBounds } from "./types";

function joinCommands(commands: string[]): string {
  return commands.join(" ");
}

export function buildRoundedRectPath(bounds: ShellBounds): string {
  const { left, top, right, bottom, rx, ry } = bounds;

  return joinCommands([
    `M ${left + rx} ${top}`,
    `H ${right - rx}`,
    `Q ${right} ${top} ${right} ${top + ry}`,
    `V ${bottom - ry}`,
    `Q ${right} ${bottom} ${right - rx} ${bottom}`,
    `H ${left + rx}`,
    `Q ${left} ${bottom} ${left} ${bottom - ry}`,
    `V ${top + ry}`,
    `Q ${left} ${top} ${left + rx} ${top}`,
    "Z",
  ]);
}

function buildLeftNotchPath(
  bounds: ShellBounds,
  centerY: number,
  depth: number,
  halfExtent: number,
): string {
  const { left, top, right, bottom, rx, ry } = bounds;
  const notchTop = centerY - halfExtent;
  const notchBottom = centerY + halfExtent;

  return joinCommands([
    `M ${left + rx} ${top}`,
    `H ${right - rx}`,
    `Q ${right} ${top} ${right} ${top + ry}`,
    `V ${bottom - ry}`,
    `Q ${right} ${bottom} ${right - rx} ${bottom}`,
    `H ${left + rx}`,
    `Q ${left} ${bottom} ${left} ${bottom - ry}`,
    `V ${notchBottom}`,
    `L ${left + depth} ${notchBottom}`,
    `L ${left + depth} ${notchTop}`,
    `L ${left} ${notchTop}`,
    `V ${top + ry}`,
    `Q ${left} ${top} ${left + rx} ${top}`,
    "Z",
  ]);
}

function buildRightNotchPath(
  bounds: ShellBounds,
  centerY: number,
  depth: number,
  halfExtent: number,
): string {
  const { left, top, right, bottom, rx, ry } = bounds;
  const notchTop = centerY - halfExtent;
  const notchBottom = centerY + halfExtent;

  return joinCommands([
    `M ${left + rx} ${top}`,
    `H ${right - rx}`,
    `Q ${right} ${top} ${right} ${top + ry}`,
    `V ${notchTop}`,
    `L ${right - depth} ${notchTop}`,
    `L ${right - depth} ${notchBottom}`,
    `L ${right} ${notchBottom}`,
    `V ${bottom - ry}`,
    `Q ${right} ${bottom} ${right - rx} ${bottom}`,
    `H ${left + rx}`,
    `Q ${left} ${bottom} ${left} ${bottom - ry}`,
    `V ${top + ry}`,
    `Q ${left} ${top} ${left + rx} ${top}`,
    "Z",
  ]);
}

function buildTopNotchPath(
  bounds: ShellBounds,
  centerX: number,
  depth: number,
  halfExtent: number,
): string {
  const { left, top, right, bottom, rx, ry } = bounds;
  const notchLeft = centerX - halfExtent;
  const notchRight = centerX + halfExtent;

  return joinCommands([
    `M ${left + rx} ${top}`,
    `H ${notchLeft}`,
    `L ${notchLeft} ${top + depth}`,
    `L ${notchRight} ${top + depth}`,
    `L ${notchRight} ${top}`,
    `H ${right - rx}`,
    `Q ${right} ${top} ${right} ${top + ry}`,
    `V ${bottom - ry}`,
    `Q ${right} ${bottom} ${right - rx} ${bottom}`,
    `H ${left + rx}`,
    `Q ${left} ${bottom} ${left} ${bottom - ry}`,
    `V ${top + ry}`,
    `Q ${left} ${top} ${left + rx} ${top}`,
    "Z",
  ]);
}

function buildBottomNotchPath(
  bounds: ShellBounds,
  centerX: number,
  depth: number,
  halfExtent: number,
): string {
  const { left, top, right, bottom, rx, ry } = bounds;
  const notchLeft = centerX - halfExtent;
  const notchRight = centerX + halfExtent;

  return joinCommands([
    `M ${left + rx} ${top}`,
    `H ${right - rx}`,
    `Q ${right} ${top} ${right} ${top + ry}`,
    `V ${bottom - ry}`,
    `Q ${right} ${bottom} ${right - rx} ${bottom}`,
    `H ${notchRight}`,
    `L ${notchRight} ${bottom - depth}`,
    `L ${notchLeft} ${bottom - depth}`,
    `L ${notchLeft} ${bottom}`,
    `H ${left + rx}`,
    `Q ${left} ${bottom} ${left} ${bottom - ry}`,
    `V ${top + ry}`,
    `Q ${left} ${top} ${left + rx} ${top}`,
    "Z",
  ]);
}

function hasVisibleNotch(
  placement: NotchPlacement | null,
  size: NotchSize,
): placement is NotchPlacement {
  return placement !== null && size.depth > 0 && size.halfExtent > 0;
}

export function buildShellPath(
  bounds: ShellBounds,
  placement: NotchPlacement | null,
  size: NotchSize,
): string {
  if (!hasVisibleNotch(placement, size)) {
    return buildRoundedRectPath(bounds);
  }

  const { depth, halfExtent } = size;

  switch (placement.edge) {
    case "left":
      return buildLeftNotchPath(bounds, placement.center, depth, halfExtent);
    case "right":
      return buildRightNotchPath(bounds, placement.center, depth, halfExtent);
    case "top":
      return buildTopNotchPath(bounds, placement.center, depth, halfExtent);
    case "bottom":
      return buildBottomNotchPath(bounds, placement.center, depth, halfExtent);
  }
}
