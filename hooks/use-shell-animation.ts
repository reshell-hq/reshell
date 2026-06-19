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
    viewport,
    activeSlotId,
    getAnchor,
    getSlotExtent,
    setAnimatedNotch,
    setAnimatedProgress,
  } = useShell();
  const visiblePathRef = useRef<SVGPathElement>(null);
  const controllerRef = useRef(createShellNotchAnimationController());
  const reducedMotionRef = useRef(false);

  // Refs so the rAF render loop always reads the latest geometry without
  // tearing down the controller on every bounds/viewport change.
  const boundsRef = useRef(bounds);
  const viewportRef = useRef(viewport);

  useEffect(() => {
    boundsRef.current = bounds;
    viewportRef.current = viewport;
  }, [bounds, viewport]);

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
      const { notch, progress } = controller.getAnimatedFrame();
      visiblePath.setAttribute(
        "d",
        buildShellPath(boundsRef.current, notch, viewportRef.current),
      );
      setAnimatedNotch(notch);
      setAnimatedProgress(progress);
    };

    controller.setFrameListener(render);
    render();

    return () => controller.dispose();
  }, [setAnimatedNotch, setAnimatedProgress]);

  // Repaint the rim when bounds or viewport change (e.g. resize) without
  // disturbing an in-flight animation.
  useEffect(() => {
    const visiblePath = visiblePathRef.current;
    if (!visiblePath) {
      return;
    }

    const { notch } = controllerRef.current.getAnimatedFrame();
    visiblePath.setAttribute("d", buildShellPath(bounds, notch, viewport));
  }, [bounds, viewport]);

  return { visiblePathRef };
}
