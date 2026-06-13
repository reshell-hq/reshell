"use client";

import { useEffect, useState } from "react";
import type { PomodoroState } from "@/internal-tools/types";

export function usePomodoroTimerNow(pomodoro: PomodoroState): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!pomodoro.running) {
      return;
    }

    setNow(new Date());

    const timer = window.setInterval(() => setNow(new Date()), 250);
    return () => window.clearInterval(timer);
  }, [pomodoro.running, pomodoro.endsAt]);

  return now;
}
