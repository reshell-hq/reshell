"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useReshellState } from "@/hooks/use-reshell-state";
import {
  getOverrideServerSnapshot,
  getOverrideSnapshot,
  subscribeOverride,
} from "@/lib/override";
import {
  advancePhase,
  createDefaultTimerState,
  DEFAULT_SPLIT_ID,
  displaySeconds,
  getSplit,
  isPhaseComplete,
  pause as pauseTimer,
  playChimeIfEnabled,
  reset as resetTimer,
  resume as resumeTimer,
  startCountdown,
  startPomodoro,
  type FocusSplit,
  type TimerMode,
  type TimerState,
} from "@/lib/timer";

/** Default minutes for a fresh countdown before the user picks one. */
const DEFAULT_COUNTDOWN_MINUTES = 25;

/**
 * Module-scoped dedupe for the audible chime. `useTimer` is mounted by several
 * surfaces at once (the timer slot panel renders twice — offscreen measurer +
 * portal — plus the command center, plus plan 014's widget), so each runs the
 * phase-advance effect. The `advancePhase` write is naturally idempotent (every
 * surface computes the same next state from the same snapshot), but the chime
 * is a real side effect; key it on the completed `endsAt` so it fires once.
 *
 * ponytail: a single module variable, fine for a single-tab app. Ceiling — it
 * would not dedupe across tabs. Upgrade path: a dedicated single-mount engine.
 */
let lastChimedEndsAt: string | null = null;

export type UseTimer = {
  state: TimerState;
  /** Live seconds to display: remaining when running, else the idle preview. */
  remaining: number;
  split: FocusSplit;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setMode: (mode: TimerMode) => void;
  setSplit: (splitId: string) => void;
  setCountdownMinutes: (minutes: number) => void;
  toggleChime: () => void;
};

/**
 * The timer tool's React seam (CONTEXT: "Tool"). Reads the effective
 * `TimerState` (override if present, else derived from `config.timer`) and
 * writes only via `patchOverride({ timer })` — never localStorage directly
 * (ADR-0009). A 1Hz `now` tick drives `remaining` and the phase-advance effect.
 *
 * The tick is local component state, so re-renders are scoped to whichever
 * surface calls this hook (a leaf) — never the shell provider or its
 * ref-driven animation loop (ADR-0006).
 */
export function useTimer(): UseTimer {
  const { config, activeWorkspaceId, patchOverride } = useReshellState();
  const override = useSyncExternalStore(
    subscribeOverride,
    getOverrideSnapshot,
    getOverrideServerSnapshot,
  );

  const splits = config.timer?.splits;
  const defaultSplitId = config.timer?.defaultSplitId ?? DEFAULT_SPLIT_ID;
  const defaultChime = config.timer?.chimeEnabled ?? false;

  const state =
    override.workspaces[activeWorkspaceId]?.timer ??
    createDefaultTimerState(defaultSplitId, defaultChime);
  const split = getSplit(state.splitId, splits);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const writeTimer = useCallback(
    (next: TimerState) => patchOverride(activeWorkspaceId, { timer: next }),
    [patchOverride, activeWorkspaceId],
  );

  // Phase-advance: when a running interval elapses, chime (once, if enabled) and
  // write the next state. Discrete override write — off the animation path.
  useEffect(() => {
    if (!isPhaseComplete(state, now)) {
      return;
    }
    if (state.endsAt && lastChimedEndsAt !== state.endsAt) {
      lastChimedEndsAt = state.endsAt;
      playChimeIfEnabled(state.chimeEnabled);
    }
    writeTimer(advancePhase(state));
  }, [state, now, writeTimer]);

  const start = useCallback(() => {
    writeTimer(
      state.mode === "countdown"
        ? startCountdown(state, state.countdownMinutes ?? DEFAULT_COUNTDOWN_MINUTES, new Date())
        : startPomodoro(state, new Date(), split),
    );
  }, [state, split, writeTimer]);

  const pause = useCallback(() => writeTimer(pauseTimer(state)), [state, writeTimer]);
  const resume = useCallback(
    () => writeTimer(resumeTimer(state, new Date(), split)),
    [state, split, writeTimer],
  );
  const reset = useCallback(() => writeTimer(resetTimer(state)), [state, writeTimer]);

  const setMode = useCallback(
    (mode: TimerMode) =>
      writeTimer({
        ...state,
        mode,
        running: false,
        endsAt: null,
        countdownMinutes:
          mode === "countdown" ? (state.countdownMinutes ?? DEFAULT_COUNTDOWN_MINUTES) : null,
      }),
    [state, writeTimer],
  );

  const setSplit = useCallback(
    (splitId: string) => writeTimer({ ...state, splitId }),
    [state, writeTimer],
  );

  // Pick a countdown duration (re-arms idle so `start` uses it). Plan 012 will
  // route a task estimate through the lib `startCountdown(state, minutes, now)`.
  const setCountdownMinutes = useCallback(
    (minutes: number) =>
      writeTimer({ ...state, mode: "countdown", countdownMinutes: minutes, running: false, endsAt: null }),
    [state, writeTimer],
  );

  const toggleChime = useCallback(
    () => writeTimer({ ...state, chimeEnabled: !state.chimeEnabled }),
    [state, writeTimer],
  );

  return {
    state,
    remaining: displaySeconds(state, split, now),
    split,
    start,
    pause,
    resume,
    reset,
    setMode,
    setSplit,
    setCountdownMinutes,
    toggleChime,
  };
}
