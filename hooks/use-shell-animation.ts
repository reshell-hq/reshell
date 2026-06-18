"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { createShellNotchAnimationController } from "@/lib/shell/animation";
import { buildShellPath } from "@/lib/shell/notch";
import { useShell } from "@/components/shell/shell-context";

export function useShellAnimation(): {
  visiblePathRef: RefObject<SVGPathElement | null>;
} {
  const {
    bounds,
    activeSlotId,
    getAnchor,
    getSlotExtent,
    setAnimatedNotch,
  } = useShell();
  const visiblePathRef = useRef<SVGPathElement>(null);
  const controllerRef = useRef(createShellNotchAnimationController());
  const reducedMotionRef = useRef(false);

  const targetNotch = useMemo(() => {
    if (!activeSlotId) {
      return null;
    }

    const anchor = getAnchor(activeSlotId);
    const extent = getSlotExtent(activeSlotId);

    if (!anchor || !extent) {
      return null;
    }

    return { ...anchor, ...extent };
  }, [activeSlotId, getAnchor, getSlotExtent]);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    const controller = controllerRef.current;

    if (reducedMotionRef.current) {
      controller.snapTo(targetNotch);
      return;
    }

    controller.setTarget(targetNotch);
  }, [targetNotch]);

  useEffect(() => {
    const controller = controllerRef.current;
    const visiblePath = visiblePathRef.current;

    if (!visiblePath) {
      return;
    }

    const render = () => {
      const notch = controller.getAnimatedNotch();
      visiblePath.setAttribute("d", buildShellPath(bounds, notch));
      setAnimatedNotch(notch);
    };

    controller.setFrameListener(render);
    render();

    return () => controller.dispose();
  }, [bounds, setAnimatedNotch]);

  return { visiblePathRef };
}
