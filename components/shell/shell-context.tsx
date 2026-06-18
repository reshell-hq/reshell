"use client";

import {
  createContext,
  useCallback,
  useContext,
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
import { MIN_NOTCH_SIZE } from "@/lib/shell/constants";
import { contentSizeToExtent } from "@/lib/shell/map-content-size";
import {
  pixelsToViewBox,
  pixelsToViewBoxWithScreen,
} from "@/lib/shell/scale";
import type {
  NotchSpec,
  ShellBounds,
  ShellEdge,
  SlotAnchor,
  SlotExtent,
} from "@/lib/shell/types";
import type { SlotRegistration } from "@/lib/shell/types";

export type ContentSize = {
  width: number;
  height: number;
};

type ShellContextValue = {
  bounds: ShellBounds;
  activeSlotId: string | null;
  animatedNotch: NotchSpec | null;
  slots: ReadonlyMap<string, SlotRegistration>;
  slotContentSizes: ReadonlyMap<string, ContentSize>;
  shellSvgRef: RefObject<SVGSVGElement | null>;
  activate: (id: string) => void;
  deactivate: () => void;
  registerSlot: (slot: SlotRegistration) => void;
  unregisterSlot: (id: string) => void;
  getAnchor: (id: string) => SlotAnchor | null;
  getSlotExtent: (id: string) => SlotExtent | null;
  getMinSlotExtent: (id: string) => SlotExtent | null;
  updateSlotContentSize: (id: string, size: ContentSize) => void;
  setAnimatedNotch: Dispatch<SetStateAction<NotchSpec | null>>;
};

const ShellContext = createContext<ShellContextValue | null>(null);

type ShellProviderProps = {
  bounds: ShellBounds;
  children: ReactNode;
};

function pixelSizeToViewBox(
  pixelSize: ContentSize,
  svg: SVGSVGElement | null,
): ContentSize {
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
  pixelSize: ContentSize,
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
  const [slots, setSlots] = useState<Map<string, SlotRegistration>>(
    () => new Map(),
  );
  const [slotContentSizes, setSlotContentSizes] = useState<
    Map<string, ContentSize>
  >(() => new Map());
  const shellSvgRef = useRef<SVGSVGElement | null>(null);

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

  const updateSlotContentSize = useCallback((id: string, size: ContentSize) => {
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

  const activate = useCallback((id: string) => {
    setActiveSlotId(id);
  }, []);

  const deactivate = useCallback(() => {
    setActiveSlotId(null);
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
      activeSlotId,
      animatedNotch,
      slots,
      slotContentSizes,
      shellSvgRef,
      activate,
      deactivate,
      registerSlot,
      unregisterSlot,
      getAnchor,
      getSlotExtent,
      getMinSlotExtent,
      updateSlotContentSize,
      setAnimatedNotch,
    }),
    [
      bounds,
      activeSlotId,
      animatedNotch,
      slots,
      slotContentSizes,
      activate,
      deactivate,
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
