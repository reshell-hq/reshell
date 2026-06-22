"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useReshellState } from "@/hooks/use-reshell-state";
import { useTimer } from "@/hooks/use-timer";
import {
  getOverrideServerSnapshot,
  getOverrideSnapshot,
  subscribeOverride,
} from "@/lib/override";
import {
  addTask as addTaskLib,
  editTitle as editTitleLib,
  moveTask as moveTaskLib,
  removeTask as removeTaskLib,
  setEstimate as setEstimateLib,
  splitTodayBacklog,
  startCountdownFromEstimate as startCountdownFromEstimateLib,
  startFocusOnTask as startFocusOnTaskLib,
  toggleCompleted as toggleCompletedLib,
  toggleToday as toggleTodayLib,
  type FocusTask,
  type MoveDirection,
} from "@/lib/tasks";

// Stable empty reference so an untouched workspace doesn't churn renders.
const EMPTY_TASKS: FocusTask[] = [];

export type UseTasks = {
  tasks: FocusTask[];
  today: FocusTask[];
  backlog: FocusTask[];
  /** Open (incomplete) today tasks — the handle badge / status count. */
  todayCount: number;
  /** The task the timer is currently armed on, or null. */
  activeTaskId: string | null;
  addTask: (title: string, estimateMinutes?: number) => void;
  editTitle: (id: string, title: string) => void;
  setEstimate: (id: string, estimateMinutes: number | undefined) => void;
  toggleToday: (id: string) => void;
  toggleCompleted: (id: string) => void;
  removeTask: (id: string) => void;
  moveTask: (id: string, direction: MoveDirection) => void;
  startFocusOnTask: (id: string) => void;
  startCountdownFromEstimate: (id: string) => void;
};

/**
 * The tasks tool's React seam (CONTEXT: "Tool"). Reads the effective
 * `FocusTask[]` from the override (runtime-only — never config) and writes only
 * via `patchOverride({ tasks })`, never localStorage directly (ADR-0009). The
 * focus/estimate actions route a pure timer-link patch into `useTimer`.
 *
 * App-decoupled and stable for plan 014's focus-tasks widget: keep the returned
 * shape and the timer-link wiring intact.
 */
export function useTasks(): UseTasks {
  const { activeWorkspaceId, patchOverride } = useReshellState();
  const timer = useTimer();
  const override = useSyncExternalStore(
    subscribeOverride,
    getOverrideSnapshot,
    getOverrideServerSnapshot,
  );

  const tasks = override.workspaces[activeWorkspaceId]?.tasks ?? EMPTY_TASKS;

  const write = useCallback(
    (next: FocusTask[]) => patchOverride(activeWorkspaceId, { tasks: next }),
    [patchOverride, activeWorkspaceId],
  );

  const { today, backlog } = useMemo(() => splitTodayBacklog(tasks), [tasks]);

  const addTask = useCallback(
    (title: string, estimateMinutes?: number) =>
      write(addTaskLib(tasks, title, { estimateMinutes })),
    [tasks, write],
  );
  const editTitle = useCallback(
    (id: string, title: string) => write(editTitleLib(tasks, id, title)),
    [tasks, write],
  );
  const setEstimate = useCallback(
    (id: string, estimateMinutes: number | undefined) =>
      write(setEstimateLib(tasks, id, estimateMinutes)),
    [tasks, write],
  );
  const toggleToday = useCallback(
    (id: string) => write(toggleTodayLib(tasks, id)),
    [tasks, write],
  );
  const toggleCompleted = useCallback(
    (id: string) => write(toggleCompletedLib(tasks, id)),
    [tasks, write],
  );
  const removeTask = useCallback(
    (id: string) => write(removeTaskLib(tasks, id)),
    [tasks, write],
  );
  const moveTask = useCallback(
    (id: string, direction: MoveDirection) =>
      write(moveTaskLib(tasks, id, direction)),
    [tasks, write],
  );

  const startFocusOnTask = useCallback(
    (id: string) => {
      const task = tasks.find((item) => item.id === id);
      if (!task) {
        return;
      }
      timer.applyTaskTimer(startFocusOnTaskLib(id));
    },
    [tasks, timer],
  );

  const startCountdownFromEstimate = useCallback(
    (id: string) => {
      const task = tasks.find((item) => item.id === id);
      if (!task) {
        return;
      }
      const patch = startCountdownFromEstimateLib(task);
      if (patch) {
        timer.applyTaskTimer(patch);
      }
    },
    [tasks, timer],
  );

  return {
    tasks,
    today,
    backlog,
    todayCount: today.filter((task) => !task.completed).length,
    activeTaskId: timer.state.activeTaskId,
    addTask,
    editTitle,
    setEstimate,
    toggleToday,
    toggleCompleted,
    removeTask,
    moveTask,
    startFocusOnTask,
    startCountdownFromEstimate,
  };
}
