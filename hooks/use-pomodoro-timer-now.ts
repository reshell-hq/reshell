"use client";

import { useEffect, useState } from "react";
import type { PomodoroState } from "@/lib/internal-tools/types";

/**
 * A ticking `now` that re-renders the pomodoro flyout while a timer runs so the
 * mm:ss countdown updates. Idle timers don't tick (no interval), so a paused or
 * unstarted tool stays cheap.
 */
export function usePomodoroTimerNow(pomodoro: PomodoroState): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!pomodoro.running) {
      return;
    }

    const timer = window.setInterval(() => setNow(new Date()), 250);
    return () => window.clearInterval(timer);
  }, [pomodoro.running, pomodoro.endsAt]);

  return now;
}
