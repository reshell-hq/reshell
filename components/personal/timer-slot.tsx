"use client";

import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useReshellState } from "@/hooks/use-reshell-state";
import { useTimer, type UseTimer } from "@/hooks/use-timer";
import {
  BUILTIN_FOCUS_SPLITS,
  formatModeLabel,
  formatSplitSummary,
  formatTimerSeconds,
  WORK_SESSIONS_BEFORE_LONG_BREAK,
  type FocusSplit,
} from "@/lib/timer";

// The first tool slot (CONTEXT: "Tool"): a fixed RIGHT-edge fixture. Distinct
// from bookmark slots (`bm:*`), the command center (`command-center`), and the
// command bar (`command`).
const SLOT_ID = "timer";

// Quick countdown durations (minutes) offered in countdown mode.
const COUNTDOWN_PRESETS = [5, 15, 25, 45] as const;

/**
 * Right-edge timer tool. The wrapper owns the single `useTimer` instance (its
 * 1Hz tick re-renders only this subtree, never the shell provider — ADR-0006)
 * and feeds a stateless panel, which `Shell.Slot` renders twice (offscreen
 * measurer + portal); identical props keep both copies in sync. App-decoupled
 * (ADR-0009): every read/write goes through the provider hook.
 */
export function TimerSlot() {
  const { config } = useReshellState();
  const timer = useTimer();
  const splits = config.timer?.splits ?? BUILTIN_FOCUS_SPLITS;

  return (
    <Shell.Edge side="right">
      <Shell.Slot
        id={SLOT_ID}
        handleLabel="Timer"
        handle={<TimerHandle timer={timer} />}
      >
        <TimerPanel timer={timer} splits={splits} />
      </Shell.Slot>
    </Shell.Edge>
  );
}

/** Gutter affordance: live remaining when running, else a calm timer glyph. */
function TimerHandle({ timer }: { timer: UseTimer }) {
  if (timer.state.running) {
    return (
      <span className="font-mono text-[0.6875rem] font-medium tabular-nums">
        {formatTimerSeconds(timer.remaining)}
      </span>
    );
  }
  return <TimerGlyph />;
}

function TimerPanel({ timer, splits }: { timer: UseTimer; splits: FocusSplit[] }) {
  const { state, remaining, split, start, pause, reset, setMode, setSplit, setCountdownMinutes, toggleChime } =
    timer;
  const isCountdown = state.mode === "countdown";

  return (
    <section
      aria-label="Timer"
      className="flex w-72 flex-col gap-4 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl"
    >
      <header className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {formatModeLabel(state)}
        </p>
        <SessionDots completed={state.completedWorkSessions} />
      </header>

      <p
        className="text-center font-mono text-5xl font-semibold tabular-nums tracking-tight text-foreground"
        aria-live="off"
      >
        {formatTimerSeconds(remaining)}
      </p>

      <Segmented>
        <SegmentButton active={!isCountdown} onClick={() => setMode("pomodoro")}>
          Pomodoro
        </SegmentButton>
        <SegmentButton active={isCountdown} onClick={() => setMode("countdown")}>
          Countdown
        </SegmentButton>
      </Segmented>

      {isCountdown ? (
        <Picker label="Minutes">
          {COUNTDOWN_PRESETS.map((minutes) => (
            <Button
              key={minutes}
              type="button"
              size="xs"
              variant={state.countdownMinutes === minutes ? "secondary" : "ghost"}
              aria-pressed={state.countdownMinutes === minutes}
              onClick={() => setCountdownMinutes(minutes)}
            >
              {minutes}m
            </Button>
          ))}
        </Picker>
      ) : (
        <Picker label="Split">
          {splits.map((option) => (
            <Button
              key={option.id}
              type="button"
              size="xs"
              variant={split.id === option.id ? "secondary" : "ghost"}
              aria-pressed={split.id === option.id}
              title={formatSplitSummary(option)}
              onClick={() => setSplit(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </Picker>
      )}

      <div className="flex items-center gap-2">
        {state.running ? (
          <Button type="button" size="sm" variant="default" className="flex-1" onClick={pause}>
            Pause
          </Button>
        ) : (
          <Button type="button" size="sm" variant="default" className="flex-1" onClick={start}>
            Start
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={reset}>
          Reset
        </Button>
      </div>

      <label className="flex items-center justify-between gap-2 border-t border-border pt-3 text-sm text-foreground">
        <span>Chime on finish</span>
        <Switch checked={state.chimeEnabled} onCheckedChange={toggleChime} />
      </label>
    </section>
  );
}

/** Progress toward the long break — filled dots = work sessions this cycle. */
function SessionDots({ completed }: { completed: number }) {
  const filled = completed % WORK_SESSIONS_BEFORE_LONG_BREAK;
  return (
    <span
      className="flex items-center gap-1"
      aria-label={`${completed} work sessions completed`}
    >
      {Array.from({ length: WORK_SESSIONS_BEFORE_LONG_BREAK }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${
            index < filled ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        />
      ))}
    </span>
  );
}

function Segmented({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">{children}</div>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Picker({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <p className="text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </section>
  );
}

function TimerGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="9" r="5.25" />
      <path d="M8 9V6" />
      <path d="M6.5 1.75h3" />
    </svg>
  );
}
