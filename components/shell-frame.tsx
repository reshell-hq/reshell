"use client";

import type { RefObject } from "react";
import {
  NOTCH_ANIMATION,
  SHELL_BOUNDS,
  SHELL_VIEWBOX,
} from "@/lib/shell/constants";
import { buildRoundedRectPath } from "@/lib/shell/path";
import { useShellNotch } from "@/hooks/use-shell-notch";

export function ShellFrame() {
  const { svgRef, visiblePathRef, hitPath, pointerHandlers } = useShellNotch();

  return (
    <svg
      ref={svgRef}
      className="fixed inset-0 z-50 h-full w-full text-foreground/25 dark:text-foreground/20"
      viewBox={SHELL_VIEWBOX}
      preserveAspectRatio="none"
      aria-hidden
    >
      <ShellHitTarget path={hitPath} handlers={pointerHandlers} />
      <ShellOutline pathRef={visiblePathRef} />
    </svg>
  );
}

type PointerHandlers = ReturnType<typeof useShellNotch>["pointerHandlers"];

function ShellHitTarget({
  path,
  handlers,
}: {
  path: string;
  handlers: PointerHandlers;
}) {
  return (
    <path
      d={path}
      fill="none"
      stroke="transparent"
      strokeWidth={NOTCH_ANIMATION.hitStrokeWidth}
      vectorEffect="nonScalingStroke"
      style={{ pointerEvents: "stroke" }}
      {...handlers}
    />
  );
}

function ShellOutline({
  pathRef,
}: {
  pathRef: RefObject<SVGPathElement | null>;
}) {
  return (
    <path
      ref={pathRef}
      d={buildRoundedRectPath(SHELL_BOUNDS)}
      fill="none"
      stroke="currentColor"
      strokeWidth={NOTCH_ANIMATION.visibleStrokeWidth}
      vectorEffect="nonScalingStroke"
      className="pointer-events-none"
    />
  );
}
