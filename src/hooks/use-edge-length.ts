"use client";

import { useEffect, useState } from "react";
import type { EdgePosition } from "@/library/types";

export function edgeLengthPx(edge: EdgePosition): number {
  if (typeof window === "undefined") {
    return 800;
  }

  return edge === "left" ? window.innerHeight : window.innerWidth;
}

export function useEdgeLengthPx(edge: EdgePosition): number {
  const [length, setLength] = useState(() => edgeLengthPx(edge));

  useEffect(() => {
    function update() {
      setLength(edgeLengthPx(edge));
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [edge]);

  return length;
}
