"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";
import { getSlotAnchor } from "@/lib/shell/active-notch";
import { clampExtent } from "@/lib/shell/clamp";
import {
  HOVER_CLOSE_DELAY_MS,
  HOVER_OPEN_DELAY_MS,
  MIN_NOTCH_SIZE,
} from "@/lib/shell/constants";
import { contentSizeToExtent } from "@/lib/shell/map-content-size";
import {
  pixelsToViewBox,
  pixelsToViewBoxWithScreen,
} from "@/lib/shell/scale";
import type {
  NotchSpec,
  ShellBounds,
  ShellEdge,
  Size,
  SlotAnchor,
  SlotExtent,
  SlotRegistration,
} from "@/lib/shell/types";

type ShellContextValue = {
  bounds: ShellBounds;
  viewport: Size;
  activeSlotId: string | null;
  animatedNotch: NotchSpec | null;
  animatedProgress: number;
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
  setAnimatedNotch: Dispatch<SetStateAction<NotchSpec | null>>;
  setAnimatedProgress: Dispatch<SetStateAction<number>>;
};

const ShellContext = createContext<ShellContextValue | null>(null);

type ShellProviderProps = {
  bounds: ShellBounds;
  children: ReactNode;
};

function pixelSizeToViewBox(
  pixelSize: Size,
  svg: SVGSVGElement | null,
): Size {
  if (svg) {
    return pixelsToViewBox(pixelSize, svg);
  }

  return pixelsToViewBoxWithScreen(pixelSize, {
    width: typeof window !== "undefined" ? window.innerWidth : 1000,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });
}

function extentFromPixelSize(
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

export function ShellProvider({ bounds, children }: ShellProviderProps) {
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [animatedNotch, setAnimatedNotch] = useState<NotchSpec | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [slots, setSlots] = useState<Map<string, SlotRegistration>>(
    () => new Map(),
  );
  const [slotContentSizes, setSlotContentSizes] = useState<
    Map<string, Size>
  >(() => new Map());
  const shellSvgRef = useRef<SVGSVGElement | null>(null);
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

  const registerSlot = useCallback((slot: SlotRegistration) => {
    setSlots((previous) => new Map(previous).set(slot.id, slot));
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
  }, []);

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

  const pinnedRef = useRef(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSlotRef = useRef<string | null>(null);

  useEffect(() => {
    activeSlotRef.current = activeSlotId;
  }, [activeSlotId]);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, [clearOpenTimer, clearCloseTimer]);

  // Hover intent (debounced): a handle/region must be hovered briefly before it
  // opens, and entering any slot region cancels a pending close.
  const hoverEnter = useCallback(
    (id: string) => {
      clearCloseTimer();
      if (activeSlotRef.current === id) {
        clearOpenTimer();
        return;
      }
      clearOpenTimer();
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null;
        pinnedRef.current = false;
        setActiveSlotId(id);
      }, HOVER_OPEN_DELAY_MS);
    },
    [clearOpenTimer, clearCloseTimer],
  );

  // Pointer left a slot region: cancel a pending open, and close after a grace
  // period unless the slot is pinned (focused / click-opened).
  const hoverLeave = useCallback(() => {
    clearOpenTimer();
    if (pinnedRef.current) {
      return;
    }
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setActiveSlotId(null);
    }, HOVER_CLOSE_DELAY_MS);
  }, [clearOpenTimer, clearCloseTimer]);

  // Keyboard focus opens immediately (no hover debounce).
  const focusOpen = useCallback(
    (id: string) => {
      clearOpenTimer();
      clearCloseTimer();
      setActiveSlotId(id);
    },
    [clearOpenTimer, clearCloseTimer],
  );

  const closeActive = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    pinnedRef.current = false;
    setActiveSlotId(null);
  }, [clearOpenTimer, clearCloseTimer]);

  // Click pins a slot open (or closes it if it's already the pinned slot).
  const toggleSlot = useCallback(
    (id: string) => {
      clearOpenTimer();
      clearCloseTimer();
      if (activeSlotRef.current === id && pinnedRef.current) {
        pinnedRef.current = false;
        setActiveSlotId(null);
        return;
      }
      pinnedRef.current = true;
      setActiveSlotId(id);
    },
    [clearOpenTimer, clearCloseTimer],
  );

  const pinActive = useCallback(() => {
    pinnedRef.current = true;
    clearCloseTimer();
  }, [clearCloseTimer]);

  const unpinActive = useCallback(() => {
    pinnedRef.current = false;
  }, []);

  const getAnchor = useCallback(
    (id: string): SlotAnchor | null => {
      const slot = slots.get(id);
      if (!slot) {
        return null;
      }
      return getSlotAnchor(bounds, slot);
    },
    [bounds, slots],
  );

  const getSlotExtent = useCallback(
    (id: string): SlotExtent | null => {
      const slot = slots.get(id);
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
    [bounds, slots, slotContentSizes],
  );

  const getMinSlotExtent = useCallback(
    (id: string): SlotExtent | null => {
      const slot = slots.get(id);
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
    [bounds, slots],
  );

  const value = useMemo(
    (): ShellContextValue => ({
      bounds,
      viewport,
      activeSlotId,
      animatedNotch,
      animatedProgress,
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
      setAnimatedNotch,
      setAnimatedProgress,
    }),
    [
      bounds,
      viewport,
      activeSlotId,
      animatedNotch,
      animatedProgress,
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
