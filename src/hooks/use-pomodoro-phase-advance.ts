"use client";

import { useEffect, useRef } from "react";
import type { Library } from "@/library/types";
import type { Workspace } from "@/library/types";
import {
  finishPomodoroInterval,
  isPomodoroPhaseComplete,
  playChimeIfEnabled,
  resolveFocusSplit,
} from "@/internal-tools/pomodoro";
import { usePomodoroTimerNow } from "./use-pomodoro-timer-now";

export function usePomodoroPhaseAdvance(
  workspace: Workspace,
  library: Library | undefined,
  onAdvance: (pomodoro: Workspace["internalTools"]["pomodoro"]) => void,
) {
  const pomodoro = workspace.internalTools.pomodoro;
  const split = resolveFocusSplit(pomodoro.splitId, workspace.internalTools);
  const now = usePomodoroTimerNow(pomodoro);
  const advancedEndsAtRef = useRef<string | null>(null);
  const onAdvanceRef = useRef(onAdvance);

  onAdvanceRef.current = onAdvance;

  useEffect(() => {
    if (!library || !pomodoro.running || !pomodoro.endsAt) {
      advancedEndsAtRef.current = null;
      return;
    }

    if (!isPomodoroPhaseComplete(pomodoro, now)) {
      return;
    }

    if (advancedEndsAtRef.current === pomodoro.endsAt) {
      return;
    }

    advancedEndsAtRef.current = pomodoro.endsAt;
    playChimeIfEnabled(pomodoro.chimeEnabled);
    onAdvanceRef.current(finishPomodoroInterval(pomodoro, split, now));
  }, [
    library,
    now,
    pomodoro.chimeEnabled,
    pomodoro.endsAt,
    pomodoro.mode,
    pomodoro.phase,
    pomodoro.running,
    split,
  ]);
}
