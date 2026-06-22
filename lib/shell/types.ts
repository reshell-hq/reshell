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

/** Per-edge gutter sizes (CSS px) between the rim and the screen edge. */
export type EdgeGutters = Record<ShellEdge, number>;

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
  /** Whether this slot renders a handle (drives per-edge minimisation). */
  hasHandle: boolean;
  /**
   * Monotonic registration order, assigned by the provider. Used as the
   * tiebreaker when distributing slots that share an `anchorIndex` across
   * separate `Shell.Edge` blocks on the same edge, so independent slots (e.g.
   * the three right-edge tools) spread out instead of stacking at centre.
   */
  order?: number;
};
