"use client";

import { useEffect } from "react";
import { SHELL_VIEWBOX } from "@/lib/shell/constants";
import { buildRoundedRectPath } from "@/lib/shell/notch";
import { useShellAnimation } from "@/hooks/use-shell-animation";
import { useShell } from "./shell-context";

/**
 * Draws the rim as two stacked layers that share the same animated path:
 * a fill behind the content (z-0) painting the canvas colour over the shell
 * (frame) background, and the stroke above the content (z-50). Both update from
 * the same `d` each frame so the canvas/shell boundary tracks the notch as it
 * morphs (see docs/adr/0005).
 */
export function ShellFrame() {
  const { theme, bounds, viewport, shellSvgRef, setViewport } = useShell();
  const { visiblePathRef, fillPathRef } = useShellAnimation();

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

  const initialPath = buildRoundedRectPath(bounds, viewport);

  return (
    <>
      <svg
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
        viewBox={SHELL_VIEWBOX}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          ref={fillPathRef}
          d={initialPath}
          fill={theme.canvasColor}
          stroke="none"
        />
      </svg>
      <svg
        ref={shellSvgRef}
        className="pointer-events-none fixed inset-0 z-50 h-full w-full"
        viewBox={SHELL_VIEWBOX}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          ref={visiblePathRef}
          d={initialPath}
          fill="none"
          stroke={theme.borderColor}
          strokeWidth={theme.borderWidth}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </>
  );
}
