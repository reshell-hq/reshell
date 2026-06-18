"use client";

import { useEffect, useRef } from "react";
import type { Size } from "@/lib/shell/types";

export function useSlotMeasure(
  onResize: (size: Size) => void,
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const onResizeRef = useRef(onResize);

  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const { width, height } = entry.contentRect;
      onResizeRef.current({ width, height });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
}
