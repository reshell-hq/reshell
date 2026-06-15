"use client";

import { useEffect, useRef } from "react";
import { createNotchAnimationController } from "@/lib/shell/animation";
import { clientToViewBox } from "@/lib/shell/coordinates";
import { NOTCH_LIMITS, SHELL_BOUNDS } from "@/lib/shell/constants";
import { clampPlacement, closestPlacement } from "@/lib/shell/placement";
import { buildRoundedRectPath, buildShellPath } from "@/lib/shell/path";
import type { NotchPlacement } from "@/lib/shell/types";

function placementFromPointer(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): NotchPlacement {
  const pointer = clientToViewBox(svg, clientX, clientY);
  const placement = closestPlacement(SHELL_BOUNDS, pointer);
  return clampPlacement(
    SHELL_BOUNDS,
    placement,
    NOTCH_LIMITS.maxHalfExtent,
  );
}

export function useShellNotch() {
  const svgRef = useRef<SVGSVGElement>(null);
  const visiblePathRef = useRef<SVGPathElement>(null);
  const controllerRef = useRef(createNotchAnimationController());
  const reducedMotionRef = useRef(false);

  const hitPath = buildRoundedRectPath(SHELL_BOUNDS);

  useEffect(() => {
    const controller = controllerRef.current;
    const visiblePath = visiblePathRef.current;

    if (!visiblePath) {
      return;
    }

    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const render = () => {
      const { placement, size } = controller.getSnapshot();
      visiblePath.setAttribute(
        "d",
        buildShellPath(SHELL_BOUNDS, placement, size),
      );
    };

    controller.setFrameListener(render);
    render();

    return () => controller.dispose();
  }, []);

  function updatePlacement(event: React.PointerEvent<SVGPathElement>) {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const placement = placementFromPointer(svg, event.clientX, event.clientY);
    const controller = controllerRef.current;

    if (reducedMotionRef.current) {
      controller.snapOpen(placement);
      return;
    }

    if (controller.getSnapshot().isHovering) {
      controller.move(placement);
      return;
    }

    controller.hover(placement);
  }

  function handlePointerLeave() {
    const controller = controllerRef.current;

    if (reducedMotionRef.current) {
      controller.snapClosed();
      return;
    }

    controller.leave();
  }

  return {
    svgRef,
    visiblePathRef,
    hitPath,
    pointerHandlers: {
      onPointerEnter: updatePlacement,
      onPointerMove: updatePlacement,
      onPointerLeave: handlePointerLeave,
    },
  };
}
