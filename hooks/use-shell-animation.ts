"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { createShellNotchAnimationController } from "@/lib/shell/animation";
import { notchContentStyle, revealContentStyle } from "@/lib/shell/css";
import { buildShellPath } from "@/lib/shell/notch";
import type { NotchSpec, ShellBounds } from "@/lib/shell/types";
import { useShell, type PortalEntry } from "@/components/shell/shell-context";

/**
 * Writes the active portal's cavity + scaled content straight to the DOM for one
 * frame. Hidden when the animated notch isn't on this slot's edge yet (e.g. a
 * cross-edge collapse) so content never shows in the wrong place.
 */
function paintPortal(
  entry: PortalEntry | null,
  notch: NotchSpec | null,
  progress: number,
  bounds: ShellBounds,
  panelColor: string,
): void {
  if (!entry) {
    return;
  }

  if (!notch || notch.edge !== entry.edge || notch.depth <= 0) {
    entry.clip.style.display = "none";
    return;
  }

  entry.clip.style.display = "";
  Object.assign(entry.clip.style, notchContentStyle(bounds, notch));
  entry.clip.style.background = panelColor;
  Object.assign(entry.inner.style, revealContentStyle(notch.edge, progress));
}

export function useShellAnimation(): {
  visiblePathRef: RefObject<SVGPathElement | null>;
  fillPathRef: RefObject<SVGPathElement | null>;
} {
  const {
    theme,
    bounds,
    viewport,
    activeSlotId,
    getAnchor,
    getSlotExtent,
    portalRef,
    portalPaintRef,
  } = useShell();
  const visiblePathRef = useRef<SVGPathElement>(null);
  const fillPathRef = useRef<SVGPathElement>(null);
  const controllerRef = useRef(createShellNotchAnimationController());
  const reducedMotionRef = useRef(false);

  // Refs so the rAF render loop always reads the latest geometry without
  // tearing down the controller on every bounds/viewport/theme change.
  const boundsRef = useRef(bounds);
  const viewportRef = useRef(viewport);
  const panelColorRef = useRef(theme.panelColor);

  useEffect(() => {
    boundsRef.current = bounds;
    viewportRef.current = viewport;
    panelColorRef.current = theme.panelColor;
  }, [bounds, viewport, theme.panelColor]);

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

    // One frame: rim path + active portal, written together so content never
    // lags the rim. No setState — this runs ~60fps while a notch animates.
    const render = () => {
      const { notch, progress } = controller.getAnimatedFrame();
      const d = buildShellPath(boundsRef.current, notch, viewportRef.current);
      visiblePath.setAttribute("d", d);
      fillPathRef.current?.setAttribute("d", d);
      paintPortal(
        portalRef.current,
        notch,
        progress,
        boundsRef.current,
        panelColorRef.current,
      );
    };

    controller.setFrameListener(render);
    portalPaintRef.current = render;
    render();

    return () => {
      controller.dispose();
      portalPaintRef.current = null;
    };
  }, [portalRef, portalPaintRef]);

  // Repaint rim + live portal when bounds/viewport/theme change (e.g. resize)
  // without disturbing an in-flight animation.
  useEffect(() => {
    const visiblePath = visiblePathRef.current;
    if (!visiblePath) {
      return;
    }

    const { notch, progress } = controllerRef.current.getAnimatedFrame();
    const d = buildShellPath(bounds, notch, viewport);
    visiblePath.setAttribute("d", d);
    fillPathRef.current?.setAttribute("d", d);
    paintPortal(portalRef.current, notch, progress, bounds, theme.panelColor);
  }, [bounds, viewport, theme.panelColor, portalRef]);

  return { visiblePathRef, fillPathRef };
}
