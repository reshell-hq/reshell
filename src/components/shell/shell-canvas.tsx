"use client";

import { useEffect, useRef } from "react";
import type { Theme } from "@/library/types";
import {
  startShellAnimation,
  stopShellAnimation,
  themeToShellColors,
} from "@/shell-frame/shell-animation";

type ShellCanvasProps = {
  theme: Theme;
};

export function ShellCanvas({ theme }: ShellCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    startShellAnimation(canvas, () => themeToShellColors(themeRef.current));
    return () => {
      stopShellAnimation();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="shell-rim-canvas pointer-events-none absolute inset-0 block h-full w-full"
      aria-hidden
    />
  );
}
