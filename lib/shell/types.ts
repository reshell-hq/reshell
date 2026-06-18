export type Size = {
  width: number;
  height: number;
};

export type ShellBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  rx: number;
  ry: number;
};

export type ShellEdge = "top" | "right" | "bottom" | "left";

export type SlotAnchor = {
  edge: ShellEdge;
  center: number;
};

export type SlotExtent = {
  depth: number;
  halfExtent: number;
};

export type NotchSpec = SlotAnchor & SlotExtent;

export type SlotRegistration = {
  id: string;
  edge: ShellEdge;
  anchorIndex: number;
  siblingCount: number;
};
