import type { NotchSpec, ShellBounds } from "./types";

export type NotchRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function notchRect(bounds: ShellBounds, notch: NotchSpec): NotchRect {
  const { edge, center, depth, halfExtent } = notch;
  const span = halfExtent * 2;

  switch (edge) {
    case "bottom":
      return {
        x: center - halfExtent,
        y: bounds.bottom - depth,
        width: span,
        height: depth,
      };
    case "top":
      return {
        x: center - halfExtent,
        y: bounds.top,
        width: span,
        height: depth,
      };
    case "left":
      return {
        x: bounds.left,
        y: center - halfExtent,
        width: depth,
        height: span,
      };
    case "right":
      return {
        x: bounds.right - depth,
        y: center - halfExtent,
        width: depth,
        height: span,
      };
  }
}
