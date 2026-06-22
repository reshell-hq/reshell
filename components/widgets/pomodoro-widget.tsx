"use client";

import { useTimer } from "@/hooks/use-timer";
import { formatModeLabel, formatTimerSeconds, phaseMinutes } from "@/lib/timer";

/**
 * Ambient pomodoro readout (CONTEXT: "Canvas widget"). Read-only mirror of the
 * timer tool (plan 011) shown only while a timer is running — the
 * `visibleWidgets` rule enforces this at the scene level, and this self-guard
 * keeps the widget honest if rendered directly. The accent bar tracks elapsed
 * progress of the active interval.
 */
export function PomodoroWidget() {
  const { state, remaining, split } = useTimer();

  if (!state.running) {
    return null;
  }

  const total =
    state.mode === "countdown" && state.countdownMinutes !== null
      ? state.countdownMinutes * 60
      : phaseMinutes(state.phase, split) * 60;
  const progress = total > 0 ? Math.min(1, (total - remaining) / total) : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[0.6875rem] font-semibold tracking-wide uppercase opacity-60">
        {formatModeLabel(state)}
      </span>
      <span
        suppressHydrationWarning
        className="font-mono text-5xl leading-none font-semibold tabular-nums"
      >
        {formatTimerSeconds(remaining)}
      </span>
      <span
        aria-hidden
        className="h-1 w-32 overflow-hidden rounded-full bg-current/15"
      >
        <span
          className="block h-full rounded-full transition-[width] duration-1000 ease-linear"
          style={{
            width: `${progress * 100}%`,
            background: "var(--scene-accent, var(--primary))",
          }}
        />
      </span>
    </div>
  );
}
