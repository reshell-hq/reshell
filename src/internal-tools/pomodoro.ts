import { playPomodoroChimeSound } from "./chime-audio";
import type { FocusSplit, PomodoroPhase, PomodoroState, WorkspaceInternalTools } from "./types";

export const DEFAULT_SPLIT_ID = "classic";
export const CUSTOM_SPLIT_ID = "custom";

export const BUILTIN_FOCUS_SPLITS: FocusSplit[] = [
  {
    id: "classic",
    label: "Classic",
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
  },
  {
    id: "short",
    label: "Short",
    workMinutes: 15,
    shortBreakMinutes: 3,
    longBreakMinutes: 10,
  },
  {
    id: "deep",
    label: "Deep focus",
    workMinutes: 50,
    shortBreakMinutes: 10,
    longBreakMinutes: 20,
  },
];

export function resolveFocusSplit(
  splitId: string,
  tools?: Pick<WorkspaceInternalTools, "customFocusSplit">,
): FocusSplit {
  if (splitId === CUSTOM_SPLIT_ID && tools?.customFocusSplit) {
    return tools.customFocusSplit;
  }

  return BUILTIN_FOCUS_SPLITS.find((split) => split.id === splitId) ?? BUILTIN_FOCUS_SPLITS[0];
}

export function getFocusSplit(splitId: string): FocusSplit {
  return resolveFocusSplit(splitId);
}

export function createDefaultPomodoroState(): PomodoroState {
  return {
    mode: "pomodoro",
    splitId: DEFAULT_SPLIT_ID,
    phase: "work",
    running: false,
    endsAt: null,
    chimeEnabled: false,
    activeTaskId: null,
    completedWorkSessions: 0,
    countdownMinutes: null,
  };
}

export function createDefaultWorkspaceInternalTools(): WorkspaceInternalTools {
  return {
    pomodoro: createDefaultPomodoroState(),
    tasks: [],
    customFocusSplit: null,
  };
}

function phaseMinutes(phase: PomodoroPhase, split: FocusSplit): number {
  if (phase === "work") {
    return split.workMinutes;
  }
  if (phase === "shortBreak") {
    return split.shortBreakMinutes;
  }
  return split.longBreakMinutes;
}

function isValidCountdownMinutes(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function startCountdown(state: PomodoroState, minutes: number, now: Date): PomodoroState {
  if (!isValidCountdownMinutes(minutes)) {
    return state;
  }

  return {
    ...state,
    mode: "countdown",
    countdownMinutes: minutes,
    phase: "work",
    running: true,
    endsAt: new Date(now.getTime() + minutes * 60_000).toISOString(),
  };
}

export function startPomodoro(
  state: PomodoroState,
  now: Date,
  split: FocusSplit = getFocusSplit(state.splitId),
): PomodoroState {
  const minutes = phaseMinutes(state.phase, split);
  return {
    ...state,
    mode: "pomodoro",
    countdownMinutes: null,
    running: true,
    endsAt: new Date(now.getTime() + minutes * 60_000).toISOString(),
  };
}

export function pausePomodoro(state: PomodoroState): PomodoroState {
  return {
    ...state,
    running: false,
    endsAt: null,
  };
}

export type CustomFocusSplitDraft = {
  label?: string;
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
};

const MIN_SPLIT_MINUTES = 1;

function isValidSplitMinutes(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_SPLIT_MINUTES;
}

export function setCustomFocusSplit(
  tools: WorkspaceInternalTools,
  draft: CustomFocusSplitDraft,
): WorkspaceInternalTools {
  if (
    !isValidSplitMinutes(draft.workMinutes) ||
    !isValidSplitMinutes(draft.shortBreakMinutes) ||
    !isValidSplitMinutes(draft.longBreakMinutes)
  ) {
    return tools;
  }

  const customFocusSplit: FocusSplit = {
    id: CUSTOM_SPLIT_ID,
    label: draft.label?.trim() || "Custom",
    workMinutes: draft.workMinutes,
    shortBreakMinutes: draft.shortBreakMinutes,
    longBreakMinutes: draft.longBreakMinutes,
  };

  return {
    ...tools,
    customFocusSplit,
    pomodoro: {
      ...tools.pomodoro,
      splitId: CUSTOM_SPLIT_ID,
    },
  };
}

export function playPomodoroChime(): void {
  void playPomodoroChimeSound();
}

export function playChimeIfEnabled(
  chimeEnabled: boolean,
  play: () => void = playPomodoroChime,
): void {
  if (chimeEnabled) {
    play();
  }
}

export function setPomodoroChimeEnabled(
  tools: WorkspaceInternalTools,
  chimeEnabled: boolean,
): WorkspaceInternalTools {
  if (tools.pomodoro.chimeEnabled === chimeEnabled) {
    return tools;
  }

  return {
    ...tools,
    pomodoro: {
      ...tools.pomodoro,
      chimeEnabled,
    },
  };
}

export function setPomodoroSplit(
  tools: WorkspaceInternalTools,
  splitId: string,
): WorkspaceInternalTools {
  if (tools.pomodoro.splitId === splitId) {
    return tools;
  }

  return {
    ...tools,
    pomodoro: {
      ...tools.pomodoro,
      splitId,
    },
  };
}

export function resetPomodoro(state: PomodoroState): PomodoroState {
  return {
    ...createDefaultPomodoroState(),
    splitId: state.splitId,
    chimeEnabled: state.chimeEnabled,
    activeTaskId: state.activeTaskId,
  };
}

export function completeCountdown(state: PomodoroState): PomodoroState {
  return {
    ...state,
    running: false,
    endsAt: null,
  };
}

export function finishPomodoroInterval(
  state: PomodoroState,
  split: FocusSplit,
  now: Date,
): PomodoroState {
  if (state.mode === "countdown") {
    return completeCountdown(state);
  }

  return startPomodoro(advancePomodoroPhase(state), now, split);
}

const WORK_SESSIONS_BEFORE_LONG_BREAK = 4;

export function advancePomodoroPhase(state: PomodoroState): PomodoroState {
  if (state.phase === "work") {
    const completedWorkSessions = state.completedWorkSessions + 1;
    const nextPhase: PomodoroPhase =
      completedWorkSessions % WORK_SESSIONS_BEFORE_LONG_BREAK === 0 ? "longBreak" : "shortBreak";

    return {
      ...state,
      phase: nextPhase,
      running: false,
      endsAt: null,
      completedWorkSessions,
    };
  }

  return {
    ...state,
    phase: "work",
    running: false,
    endsAt: null,
  };
}

export function isPomodoroPhaseComplete(state: PomodoroState, now: Date): boolean {
  return state.running && remainingSeconds(state, now) === 0;
}

export function remainingSeconds(state: PomodoroState, now: Date): number {
  if (!state.running || !state.endsAt) {
    return 0;
  }

  const endsAtMs = new Date(state.endsAt).getTime();
  return Math.max(0, Math.floor((endsAtMs - now.getTime()) / 1000));
}

export function displayPomodoroSeconds(state: PomodoroState, split: FocusSplit, now: Date): number {
  if (state.running) {
    return remainingSeconds(state, now);
  }

  if (state.mode === "countdown" && state.countdownMinutes !== null) {
    return state.countdownMinutes * 60;
  }

  return phaseMinutes(state.phase, split) * 60;
}

export function formatPomodoroTimerLabel(state: PomodoroState): string {
  if (state.mode === "countdown") {
    return "Countdown";
  }

  return formatPomodoroPhaseLabel(state.phase);
}

export function formatTimerSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatPomodoroPhaseLabel(phase: PomodoroPhase): string {
  if (phase === "work") {
    return "Work";
  }
  if (phase === "shortBreak") {
    return "Short break";
  }
  return "Long break";
}

export function formatFocusSplitSummary(split: FocusSplit): string {
  return `${split.workMinutes} / ${split.shortBreakMinutes} / ${split.longBreakMinutes}`;
}
