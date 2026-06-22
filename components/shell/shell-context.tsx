"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { MIN_NOTCH_SIZE, SHELL_CORNER_RADIUS } from "@/lib/shell/constants";
import {
  extentFromPixelSize,
  getSlotAnchor,
  shellBoundsForViewport,
} from "@/lib/shell/geometry";
import {
  DEFAULT_THEME_STYLE,
  type ShellTheme,
  type ShellThemeInput,
} from "@/lib/shell/theme";
import type {
  EdgeGutters,
  ShellBounds,
  ShellEdge,
  Size,
  SlotAnchor,
  SlotExtent,
  SlotRegistration,
} from "@/lib/shell/types";
import { DefaultHandle } from "./default-handle";
import { useSlotActivation } from "./use-slot-activation";

/**
 * The live on-screen portal for the active slot, registered as raw DOM elements
 * so the rAF render loop can position them each frame without a React render
 * (see docs/adr/0006). `clip` is the cavity layer, `inner` holds the scaled
 * content, `edge` is the slot's docking edge.
 */
export type PortalEntry = {
  slotId: string;
  edge: ShellEdge;
  clip: HTMLElement;
  inner: HTMLElement;
};

type ShellContextValue = {
  theme: ShellTheme;
  bounds: ShellBounds;
  viewport: Size;
  activeSlotId: string | null;
  slots: ReadonlyMap<string, SlotRegistration>;
  slotContentSizes: ReadonlyMap<string, Size>;
  shellSvgRef: RefObject<SVGSVGElement | null>;
  overlayElement: HTMLDivElement | null;
  setOverlayElement: (element: HTMLDivElement | null) => void;
  setViewport: (size: Size) => void;
  hoverEnter: (id: string) => void;
  hoverLeave: () => void;
  focusOpen: (id: string) => void;
  toggleSlot: (id: string) => void;
  pinActive: () => void;
  unpinActive: () => void;
  closeActive: () => void;
  registerSlot: (slot: SlotRegistration) => void;
  unregisterSlot: (id: string) => void;
  getAnchor: (id: string) => SlotAnchor | null;
  getSlotExtent: (id: string) => SlotExtent | null;
  getMinSlotExtent: (id: string) => SlotExtent | null;
  updateSlotContentSize: (id: string, size: Size) => void;
  // Ref-driven portal channel: the active portal registers its DOM here; the
  // animation loop reads `portalRef` and publishes its per-frame writer into
  // `portalPaintRef` so a freshly-mounted portal paints immediately.
  portalRef: RefObject<PortalEntry | null>;
  portalPaintRef: RefObject<(() => void) | null>;
  setPortal: (entry: PortalEntry) => void;
  clearPortal: (slotId: string) => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

type ShellProviderProps = {
  theme?: ShellThemeInput;
  children: ReactNode;
};

function resolveTheme(input?: ShellThemeInput): ShellTheme {
  return {
    ...DEFAULT_THEME_STYLE,
    Handle: DefaultHandle,
    ...input,
  };
}

export function ShellProvider({
  theme: themeInput,
  children,
}: ShellProviderProps) {
  const theme = useMemo(() => resolveTheme(themeInput), [themeInput]);
  const {
    activeSlotId,
    setActiveSlotId,
    hoverEnter,
    hoverLeave,
    focusOpen,
    toggleSlot,
    pinActive,
    unpinActive,
    closeActive,
  } = useSlotActivation();
  const portalRef = useRef<PortalEntry | null>(null);
  const portalPaintRef = useRef<(() => void) | null>(null);
  const [slots, setSlots] = useState<Map<string, SlotRegistration>>(
    () => new Map(),
  );
  const [slotContentSizes, setSlotContentSizes] = useState<
    Map<string, Size>
  >(() => new Map());
  const shellSvgRef = useRef<SVGSVGElement | null>(null);
  // Monotonic registration order + a stable per-id map, so a slot keeps its
  // order across re-registration (deps change) and reused ids (e.g. a bookmark
  // slot id surviving a workspace switch) stay put.
  const orderSeqRef = useRef(0);
  const orderByIdRef = useRef<Map<string, number>>(new Map());
  const [overlayElement, setOverlayElement] =
    useState<HTMLDivElement | null>(null);
  const [viewport, setViewportState] = useState<Size>({
    width: 0,
    height: 0,
  });

  const setViewport = useCallback((size: Size) => {
    setViewportState((current) =>
      current.width === size.width && current.height === size.height
        ? current
        : size,
    );
  }, []);

  const setPortal = useCallback((entry: PortalEntry) => {
    portalRef.current = entry;
    // Paint once now so a freshly-mounted portal (or a reduced-motion snap) is
    // positioned before the next browser paint instead of flashing unstyled.
    portalPaintRef.current?.();
  }, []);

  const clearPortal = useCallback((slotId: string) => {
    if (portalRef.current?.slotId === slotId) {
      portalRef.current = null;
    }
  }, []);

  // An edge minimises to a sliver gutter unless one of its slots has a handle;
  // the gutter exists to hold handles (see docs/adr/0004).
  const gutters = useMemo((): EdgeGutters => {
    const full = theme.gutterPx;
    const min = theme.minimisedGutterPx;
    const next: EdgeGutters = { top: min, right: min, bottom: min, left: min };
    for (const slot of slots.values()) {
      if (slot.hasHandle) {
        next[slot.edge] = full;
      }
    }
    return next;
  }, [slots, theme.gutterPx, theme.minimisedGutterPx]);

  const bounds = useMemo(
    () => shellBoundsForViewport(viewport, gutters, SHELL_CORNER_RADIUS),
    [viewport, gutters],
  );

  const registerSlot = useCallback((slot: SlotRegistration) => {
    let order = orderByIdRef.current.get(slot.id);
    if (order === undefined) {
      order = orderSeqRef.current++;
      orderByIdRef.current.set(slot.id, order);
    }
    const withOrder: SlotRegistration = { ...slot, order };
    setSlots((previous) => new Map(previous).set(slot.id, withOrder));
  }, []);

  const unregisterSlot = useCallback((id: string) => {
    setSlots((previous) => {
      const next = new Map(previous);
      next.delete(id);
      return next;
    });
    setSlotContentSizes((previous) => {
      const next = new Map(previous);
      next.delete(id);
      return next;
    });
    setActiveSlotId((current) => (current === id ? null : current));
  }, [setActiveSlotId]);

  const updateSlotContentSize = useCallback((id: string, size: Size) => {
    setSlotContentSizes((previous) => {
      const current = previous.get(id);
      if (
        current &&
        current.width === size.width &&
        current.height === size.height
      ) {
        return previous;
      }

      return new Map(previous).set(id, size);
    });
  }, []);

  // Anchor distribution is global per edge, not per `Shell.Edge` block: every
  // slot on an edge — however its JSX is nested (the three right-edge tools each
  // mount their own `Shell.Edge`) — is spaced together so handles never stack.
  // Order within an edge: registered `anchorIndex` first (preserves a single
  // edge's authored order, e.g. bookmark groups), then registration `order`.
  const resolvedSlots = useMemo(() => {
    const byEdge = new Map<ShellEdge, SlotRegistration[]>();
    for (const slot of slots.values()) {
      const list = byEdge.get(slot.edge);
      if (list) {
        list.push(slot);
      } else {
        byEdge.set(slot.edge, [slot]);
      }
    }

    const resolved = new Map<string, SlotRegistration>();
    for (const list of byEdge.values()) {
      list.sort(
        (a, b) =>
          a.anchorIndex - b.anchorIndex || (a.order ?? 0) - (b.order ?? 0),
      );
      list.forEach((slot, index) => {
        resolved.set(slot.id, {
          ...slot,
          anchorIndex: index,
          siblingCount: list.length,
        });
      });
    }
    return resolved;
  }, [slots]);

  const getAnchor = useCallback(
    (id: string): SlotAnchor | null => {
      const slot = resolvedSlots.get(id);
      if (!slot) {
        return null;
      }
      return getSlotAnchor(bounds, slot);
    },
    [bounds, resolvedSlots],
  );

  const getSlotExtent = useCallback(
    (id: string): SlotExtent | null => {
      const slot = resolvedSlots.get(id);
      if (!slot) {
        return null;
      }

      const pixelSize = slotContentSizes.get(id) ?? MIN_NOTCH_SIZE;
      return extentFromPixelSize(
        bounds,
        slot,
        pixelSize,
        shellSvgRef.current,
      );
    },
    [bounds, resolvedSlots, slotContentSizes],
  );

  const getMinSlotExtent = useCallback(
    (id: string): SlotExtent | null => {
      const slot = resolvedSlots.get(id);
      if (!slot) {
        return null;
      }

      return extentFromPixelSize(
        bounds,
        slot,
        MIN_NOTCH_SIZE,
        shellSvgRef.current,
      );
    },
    [bounds, resolvedSlots],
  );

  const value = useMemo(
    (): ShellContextValue => ({
      theme,
      bounds,
      viewport,
      activeSlotId,
      slots,
      slotContentSizes,
      shellSvgRef,
      overlayElement,
      setOverlayElement,
      setViewport,
      hoverEnter,
      hoverLeave,
      focusOpen,
      toggleSlot,
      pinActive,
      unpinActive,
      closeActive,
      registerSlot,
      unregisterSlot,
      getAnchor,
      getSlotExtent,
      getMinSlotExtent,
      updateSlotContentSize,
      portalRef,
      portalPaintRef,
      setPortal,
      clearPortal,
    }),
    [
      theme,
      bounds,
      viewport,
      activeSlotId,
      slots,
      slotContentSizes,
      overlayElement,
      setViewport,
      hoverEnter,
      hoverLeave,
      focusOpen,
      toggleSlot,
      pinActive,
      unpinActive,
      closeActive,
      registerSlot,
      unregisterSlot,
      getAnchor,
      getSlotExtent,
      getMinSlotExtent,
      updateSlotContentSize,
      setPortal,
      clearPortal,
    ],
  );

  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error("useShell must be used within ShellProvider");
  }
  return context;
}

type ShellEdgeContextValue = {
  side: ShellEdge;
  siblingCount: number;
};

const ShellEdgeContext = createContext<ShellEdgeContextValue | null>(null);

export function ShellEdgeProvider({
  side,
  siblingCount,
  children,
}: {
  side: ShellEdge;
  siblingCount: number;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ side, siblingCount }),
    [side, siblingCount],
  );

  return (
    <ShellEdgeContext.Provider value={value}>
      {children}
    </ShellEdgeContext.Provider>
  );
}

export function useShellEdge(): ShellEdgeContextValue {
  const context = useContext(ShellEdgeContext);
  if (!context) {
    throw new Error("useShellEdge must be used within Shell.Edge");
  }
  return context;
}
