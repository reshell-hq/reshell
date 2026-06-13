"use client";

import { useEffect, useState } from "react";
import { formatClockDisplay, formatEditorialClockDisplay } from "@/canvas-widgets/clock";
import { pickQuote } from "@/canvas-widgets/quote";
import { formatWelcomeMessage } from "@/canvas-widgets/welcome";
import { usePomodoroTimerNow } from "@/hooks/use-pomodoro-timer-now";
import type { Workspace } from "@/library/types";
import {
  displayPomodoroSeconds,
  formatPomodoroTimerLabel,
  formatTimerSeconds,
  resolveFocusSplit,
} from "@/internal-tools/pomodoro";

export function CanvasClockWidget({ variant = "default" }: { variant?: "default" | "hero" | "rail" }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const { time, date } = formatClockDisplay(now);
  const className =
    variant === "hero"
      ? "canvas-widget canvas-widget-clock canvas-widget-clock--hero-center"
      : variant === "rail"
        ? "canvas-widget canvas-widget-clock canvas-widget-clock--rail"
        : "canvas-widget canvas-widget-clock";

  return (
    <div className={className}>
      <p className="canvas-widget-clock-time">{time}</p>
      {variant === "default" ? <p className="canvas-widget-clock-date">{date}</p> : null}
      {variant === "rail" ? <p className="canvas-widget-clock-date">{date}</p> : null}
    </div>
  );
}

export function CanvasClockTimeWidget() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const { time } = formatClockDisplay(now);

  return (
    <div className="canvas-widget canvas-widget-clock canvas-widget-clock--hero-time">
      <p className="canvas-widget-clock-time">{time}</p>
    </div>
  );
}

export function CanvasClockDateHeroWidget() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const { dateHero, weekday } = formatEditorialClockDisplay(now);

  return (
    <div className="canvas-widget canvas-widget-clock canvas-widget-clock--hero-date">
      <p className="canvas-widget-clock-date-hero">{dateHero}</p>
      <p className="canvas-widget-clock-weekday-pill">{weekday}</p>
    </div>
  );
}

export function CanvasWelcomeWidget({ displayName }: { displayName?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <p className="canvas-widget canvas-widget-welcome">{formatWelcomeMessage(now, displayName)}</p>
  );
}

export function CanvasQuoteWidget() {
  const [quote] = useState(() => pickQuote(Math.floor(Date.now() / 86_400_000)));

  return <p className="canvas-widget canvas-widget-quote">{quote.text}</p>;
}

export function CanvasEditorialTimerTimeWidget({ workspace }: { workspace: Workspace }) {
  const pomodoro = workspace.internalTools.pomodoro;
  const split = resolveFocusSplit(pomodoro.splitId, workspace.internalTools);
  const now = usePomodoroTimerNow(pomodoro);
  const seconds = displayPomodoroSeconds(pomodoro, split, now);

  if (!pomodoro.running) {
    return null;
  }

  return (
    <div className="canvas-widget canvas-widget-clock canvas-widget-clock--hero-time canvas-widget-timer">
      <p className="canvas-widget-clock-time" aria-live="polite">
        {formatTimerSeconds(seconds)}
      </p>
    </div>
  );
}

export function CanvasEditorialTimerPhaseWidget({ workspace }: { workspace: Workspace }) {
  const pomodoro = workspace.internalTools.pomodoro;

  if (!pomodoro.running) {
    return null;
  }

  return (
    <div className="canvas-widget canvas-widget-clock canvas-widget-clock--hero-date canvas-widget-timer">
      <p className="canvas-widget-clock-date-hero">{formatPomodoroTimerLabel(pomodoro)}</p>
    </div>
  );
}
