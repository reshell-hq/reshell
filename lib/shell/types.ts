export type Point = { x: number; y: number };

export type ShellBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  rx: number;
  ry: number;
};

export type ShellEdge = "top" | "right" | "bottom" | "left";

export type NotchPlacement =
  | { edge: "top" | "bottom"; center: number }
  | { edge: "left" | "right"; center: number };

export type NotchSize = {
  depth: number;
  halfExtent: number;
};

export type NotchState = {
  placement: NotchPlacement | null;
  size: NotchSize;
};
