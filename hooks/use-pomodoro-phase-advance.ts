"use client";

import { useEffect, useRef } from "react";
import {
  finishPomodoroInterval,
  isPomodoroPhaseComplete,
  playChimeIfEnabled,
  resolveFocusSplit,
} from "@/lib/internal-tools/pomodoro";
import type {
  PomodoroState,
  WorkspaceInternalTools,
} from "@/lib/internal-tools/types";
import { usePomodoroTimerNow } from "./use-pomodoro-timer-now";

/**
 * Watches the active per-workspace pomodoro timer and, when an interval ends,
 * advances it (auto-starting the next phase for pomodoro mode, stopping for a
 * focus countdown) and plays the chime if enabled. Owned above the slot so it
 * fires exactly once even though `Shell.Slot` renders its content twice (an
 * offscreen measurer plus the visible portal).
 */
export function usePomodoroPhaseAdvance(
  internalTools: WorkspaceInternalTools,
  enabled: boolean,
  onAdvance: (pomodoro: PomodoroState) => void,
): void {
  const pomodoro = internalTools.pomodoro;
  const split = resolveFocusSplit(pomodoro.splitId, internalTools);
  const now = usePomodoroTimerNow(pomodoro);
  const advancedEndsAtRef = useRef<string | null>(null);
  const onAdvanceRef = useRef(onAdvance);

  useEffect(() => {
    onAdvanceRef.current = onAdvance;
  }, [onAdvance]);

  useEffect(() => {
    if (!enabled || !pomodoro.running || !pomodoro.endsAt) {
      advancedEndsAtRef.current = null;
      return;
    }

    if (!isPomodoroPhaseComplete(pomodoro, now)) {
      return;
    }

    // Guard against firing twice for the same interval end.
    if (advancedEndsAtRef.current === pomodoro.endsAt) {
      return;
    }

    advancedEndsAtRef.current = pomodoro.endsAt;
    playChimeIfEnabled(pomodoro.chimeEnabled);
    onAdvanceRef.current(finishPomodoroInterval(pomodoro, split, now));
  }, [
    enabled,
    now,
    pomodoro.chimeEnabled,
    pomodoro.endsAt,
    pomodoro.mode,
    pomodoro.phase,
    pomodoro.running,
    split,
  ]);
}
