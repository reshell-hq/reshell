"use client";

import type { RefObject } from "react";
import {
  NOTCH_ANIMATION,
  SHELL_VIEWBOX,
} from "@/lib/shell/constants";
import { buildRoundedRectPath } from "@/lib/shell/path";
import { useShellAnimation } from "@/hooks/use-shell-animation";
import { useShell } from "./shell-context";

export function ShellFrame() {
  const { bounds, shellSvgRef } = useShell();
  const { visiblePathRef } = useShellAnimation();

  return (
    <svg
      ref={shellSvgRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full text-foreground"
      viewBox={SHELL_VIEWBOX}
      preserveAspectRatio="none"
    >
      <ShellOutline pathRef={visiblePathRef} bounds={bounds} />
    </svg>
  );
}

function ShellOutline({
  pathRef,
  bounds,
}: {
  pathRef: RefObject<SVGPathElement | null>;
  bounds: Parameters<typeof buildRoundedRectPath>[0];
}) {
  return (
    <path
      ref={pathRef}
      d={buildRoundedRectPath(bounds)}
      fill="none"
      stroke="currentColor"
      strokeWidth={NOTCH_ANIMATION.visibleStrokeWidth}
      vectorEffect="nonScalingStroke"
    />
  );
}
