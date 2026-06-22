"use client";

import { useClock } from "@/hooks/use-clock";
import { useReshellState } from "@/hooks/use-reshell-state";

/**
 * Ambient wall-clock widget (CONTEXT: "Canvas widget"). Presentation-only: it
 * reads the live time from `useClock` (honouring `config.clock`) and renders
 * nothing until mounted, so SSR and the first client render agree.
 *
 * Colour-agnostic by design — it inherits `currentColor` from the host scene
 * and leans on the mono face for the numerals (DESIGN.md type scale). The scene
 * owns size/placement; the widget only owns its own internal rhythm.
 */
export function ClockWidget() {
  const { config } = useReshellState();
  const time = useClock(config.clock);

  if (!time) {
    return null;
  }

  return (
    <time
      suppressHydrationWarning
      className="font-mono text-6xl leading-none font-semibold tracking-tight tabular-nums sm:text-7xl"
    >
      {time}
    </time>
  );
}
