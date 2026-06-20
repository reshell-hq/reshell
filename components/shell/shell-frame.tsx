"use client";

import { useEffect, type RefObject } from "react";
import {
  NOTCH_ANIMATION,
  SHELL_VIEWBOX,
} from "@/lib/shell/constants";
import { buildRoundedRectPath } from "@/lib/shell/notch";
import type { ShellBounds, Size } from "@/lib/shell/types";
import { useShellAnimation } from "@/hooks/use-shell-animation";
import { useShell } from "./shell-context";

export function ShellFrame() {
  const { bounds, viewport, shellSvgRef, setViewport } = useShell();
  const { visiblePathRef } = useShellAnimation();

  useEffect(() => {
    const svg = shellSvgRef.current;
    if (!svg) {
      return;
    }

    const measure = () => {
      const rect = svg.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [shellSvgRef, setViewport]);

  return (
    <svg
      ref={shellSvgRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full text-foreground"
      viewBox={SHELL_VIEWBOX}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <ShellOutline
        pathRef={visiblePathRef}
        bounds={bounds}
        viewport={viewport}
      />
    </svg>
  );
}

function ShellOutline({
  pathRef,
  bounds,
  viewport,
}: {
  pathRef: RefObject<SVGPathElement | null>;
  bounds: ShellBounds;
  viewport: Size;
}) {
  return (
    <path
      ref={pathRef}
      d={buildRoundedRectPath(bounds, viewport)}
      fill="none"
      stroke="currentColor"
      strokeWidth={NOTCH_ANIMATION.visibleStrokeWidth}
      vectorEffect="non-scaling-stroke"
    />
  );
}
