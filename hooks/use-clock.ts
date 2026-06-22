"use client";

import { useEffect, useMemo, useState } from "react";

/** The clock config shape (mirrors `ReshellConfig["clock"]`, decoupled). */
export type ClockOptions = {
  format?: "12h" | "24h";
  /** IANA zone (e.g. "Europe/Paris"); "local" or absent uses the host zone. */
  timezone?: string;
};

/**
 * Live wall-clock time honouring `config.clock`, shared by the command center
 * and the clock canvas widget (plan 014). Ticks once a second via a single
 * interval cleared on unmount. Returns "" until mounted so SSR and the first
 * client render agree (no hydration mismatch) — the time appears on mount.
 */
export function useClock(options?: ClockOptions): string {
  const { format, timezone } = options ?? {};

  const formatter = useMemo(() => {
    const base: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: format === "12h",
    };
    if (timezone && timezone !== "local") {
      try {
        return new Intl.DateTimeFormat(undefined, { ...base, timeZone: timezone });
      } catch {
        // ponytail: a bad IANA zone in config falls back to local rather than
        // crashing the render. Upgrade path: validate the zone in the schema.
      }
    }
    return new Intl.DateTimeFormat(undefined, base);
  }, [format, timezone]);

  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => setTime(formatter.format(new Date()));
    update();
    // 1s cadence keeps the displayed minute aligned to the real boundary; the
    // formatted string only changes each minute, so identical sets no-op.
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [formatter]);

  return time;
}
