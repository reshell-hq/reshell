import type { FractionalOrderKey } from "@/fractional-order/fractional-order";

export type InternalToolId = "pomodoro" | "tasks";

export const INTERNAL_TOOL_IDS: InternalToolId[] = ["pomodoro", "tasks"];

export function internalToolZoneId(toolId: InternalToolId | string): string {
  return `__tool_${toolId}__`;
}

export type PomodoroPhase = "work" | "shortBreak" | "longBreak";

export type PomodoroTimerMode = "pomodoro" | "countdown";

export type FocusSplit = {
  id: string;
  label: string;
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
};

export type PomodoroState = {
  mode: PomodoroTimerMode;
  splitId: string;
  phase: PomodoroPhase;
  countdownMinutes: number | null;
  running: boolean;
  endsAt: string | null;
  chimeEnabled: boolean;
  activeTaskId: string | null;
  completedWorkSessions: number;
};

export type FocusTask = {
  id: string;
  title: string;
  estimateMinutes?: number;
  today: boolean;
  completed: boolean;
  orderKey: FractionalOrderKey;
};

export type WorkspaceInternalTools = {
  pomodoro: PomodoroState;
  tasks: FocusTask[];
  customFocusSplit: FocusSplit | null;
};
