"use client";

import { useEffect, useState } from "react";
import { useReshellState } from "@/hooks/use-reshell-state";

/**
 * Time-of-day greeting + the configured display name (CONTEXT: "Canvas
 * widget"). The greeting depends on the local hour, so it is computed on mount
 * (not at render) to keep SSR and the first client render identical — the
 * greeting word appears once mounted.
 */
export function WelcomeWidget() {
  const { config } = useReshellState();
  const greeting = useGreeting();

  if (!greeting) {
    return null;
  }

  return (
    <p
      suppressHydrationWarning
      className="text-sm font-medium tracking-wide uppercase opacity-70"
    >
      {config.displayName ? `${greeting}, ${config.displayName}` : greeting}
    </p>
  );
}

function greetingForHour(hour: number): string {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * "" until mounted, then a local-hour greeting. Syncs the wall clock (an
 * external system) into state on mount — the same idiom as `useClock` — so SSR
 * renders nothing and the greeting appears on the client without a mismatch.
 */
function useGreeting(): string {
  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    const apply = () => setGreeting(greetingForHour(new Date().getHours()));
    apply();
  }, []);
  return greeting;
}
