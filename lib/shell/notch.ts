import { NOTCH_CORNER_RADIUS } from "./constants";
import type { NotchSpec, ShellBounds } from "./types";

function joinCommands(commands: string[]): string {
  return commands.join(" ");
}

function notchCornerRadius(depth: number, halfExtent: number): number {
  return Math.min(NOTCH_CORNER_RADIUS, halfExtent, depth / 2);
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

function hasVisibleNotch(notch: NotchSpec | null): notch is NotchSpec {
  return notch !== null && notch.depth > 0 && notch.halfExtent > 0;
}

function buildNotchPath(bounds: ShellBounds, notch: NotchSpec): string {
  const { left, top, right, bottom, rx, ry } = bounds;
  const { edge, center, depth, halfExtent } = notch;
  const nr = notchCornerRadius(depth, halfExtent);

  switch (edge) {
    case "left": {
      const notchTop = center - halfExtent;
      const notchBottom = center + halfExtent;
      const wall = left + depth;
      return joinCommands([
        `M ${left + rx} ${top}`,
        `H ${right - rx}`,
        `Q ${right} ${top} ${right} ${top + ry}`,
        `V ${bottom - ry}`,
        `Q ${right} ${bottom} ${right - rx} ${bottom}`,
        `H ${left + rx}`,
        `Q ${left} ${bottom} ${left} ${bottom - ry}`,
        `V ${notchBottom + nr}`,
        `Q ${left} ${notchBottom} ${left + nr} ${notchBottom}`,
        `H ${wall - nr}`,
        `Q ${wall} ${notchBottom} ${wall} ${notchBottom - nr}`,
        `V ${notchTop + nr}`,
        `Q ${wall} ${notchTop} ${wall - nr} ${notchTop}`,
        `H ${left + nr}`,
        `Q ${left} ${notchTop} ${left} ${notchTop - nr}`,
        `V ${top + ry}`,
        `Q ${left} ${top} ${left + rx} ${top}`,
        "Z",
      ]);
    }
    case "right": {
      const notchTop = center - halfExtent;
      const notchBottom = center + halfExtent;
      const wall = right - depth;
      return joinCommands([
        `M ${left + rx} ${top}`,
        `H ${right - rx}`,
        `Q ${right} ${top} ${right} ${top + ry}`,
        `V ${notchTop - nr}`,
        `Q ${right} ${notchTop} ${right - nr} ${notchTop}`,
        `H ${wall + nr}`,
        `Q ${wall} ${notchTop} ${wall} ${notchTop + nr}`,
        `V ${notchBottom - nr}`,
        `Q ${wall} ${notchBottom} ${wall + nr} ${notchBottom}`,
        `H ${right - nr}`,
        `Q ${right} ${notchBottom} ${right} ${notchBottom + nr}`,
        `V ${bottom - ry}`,
        `Q ${right} ${bottom} ${right - rx} ${bottom}`,
        `H ${left + rx}`,
        `Q ${left} ${bottom} ${left} ${bottom - ry}`,
        `V ${top + ry}`,
        `Q ${left} ${top} ${left + rx} ${top}`,
        "Z",
      ]);
    }
    case "top": {
      const notchLeft = center - halfExtent;
      const notchRight = center + halfExtent;
      const wall = top + depth;
      return joinCommands([
        `M ${left + rx} ${top}`,
        `H ${notchLeft - nr}`,
        `Q ${notchLeft} ${top} ${notchLeft} ${top + nr}`,
        `V ${wall - nr}`,
        `Q ${notchLeft} ${wall} ${notchLeft + nr} ${wall}`,
        `H ${notchRight - nr}`,
        `Q ${notchRight} ${wall} ${notchRight} ${wall - nr}`,
        `V ${top + nr}`,
        `Q ${notchRight} ${top} ${notchRight + nr} ${top}`,
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
    case "bottom": {
      const notchLeft = center - halfExtent;
      const notchRight = center + halfExtent;
      const wall = bottom - depth;
      return joinCommands([
        `M ${left + rx} ${top}`,
        `H ${right - rx}`,
        `Q ${right} ${top} ${right} ${top + ry}`,
        `V ${bottom - ry}`,
        `Q ${right} ${bottom} ${right - rx} ${bottom}`,
        `H ${notchRight + nr}`,
        `Q ${notchRight} ${bottom} ${notchRight} ${bottom - nr}`,
        `V ${wall + nr}`,
        `Q ${notchRight} ${wall} ${notchRight - nr} ${wall}`,
        `H ${notchLeft + nr}`,
        `Q ${notchLeft} ${wall} ${notchLeft} ${wall + nr}`,
        `V ${bottom - nr}`,
        `Q ${notchLeft} ${bottom} ${notchLeft - nr} ${bottom}`,
        `H ${left + rx}`,
        `Q ${left} ${bottom} ${left} ${bottom - ry}`,
        `V ${top + ry}`,
        `Q ${left} ${top} ${left + rx} ${top}`,
        "Z",
      ]);
    }
  }
}

export function buildShellPath(
  bounds: ShellBounds,
  notch: NotchSpec | null,
): string {
  if (!hasVisibleNotch(notch)) {
    return buildRoundedRectPath(bounds);
  }

  return buildNotchPath(bounds, notch);
}
