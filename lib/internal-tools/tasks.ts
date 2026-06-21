import {
  initialKey,
  insertBetween,
  sortByKey,
} from "@/lib/fractional-order/fractional-order";
import { startCountdown } from "./pomodoro";
import type { FocusTask, WorkspaceInternalTools } from "./types";

/**
 * The focus-tasks model (CONTEXT: "Focus task"). Pure operations ported from the
 * pre-rewrite `src/internal-tools/tasks.ts` and extended with an optional
 * scheduled date (a calendar day, no time-of-day). Tasks are per-workspace,
 * ordered via fractional order; the flyout defaults to the `today` subset.
 */

export function listTodayTasks(tools: WorkspaceInternalTools): FocusTask[] {
  return listOpenTasks(tools, true);
}

export function listBacklogTasks(tools: WorkspaceInternalTools): FocusTask[] {
  return listOpenTasks(tools, false);
}

function isValidEstimateMinutes(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function listOpenTasks(
  tools: WorkspaceInternalTools,
  today: boolean,
): FocusTask[] {
  return sortByKey(
    tools.tasks.filter((task) => task.today === today && !task.completed),
    (task) => task.orderKey,
  );
}

export type AddFocusTaskOptions = {
  id?: string;
  estimateMinutes?: number;
  scheduledDate?: string;
};

export function addFocusTask(
  tools: WorkspaceInternalTools,
  title: string,
  options: AddFocusTaskOptions = {},
): WorkspaceInternalTools {
  const trimmed = title.trim();
  if (!trimmed) {
    return tools;
  }

  const lastTask = tools.tasks.at(-1);
  const orderKey = lastTask
    ? insertBetween(lastTask.orderKey, null)
    : initialKey();
  const task: FocusTask = {
    id: options.id ?? crypto.randomUUID(),
    title: trimmed,
    today: true,
    completed: false,
    orderKey,
  };

  if (
    options.estimateMinutes !== undefined &&
    isValidEstimateMinutes(options.estimateMinutes)
  ) {
    task.estimateMinutes = options.estimateMinutes;
  }

  if (options.scheduledDate) {
    task.scheduledDate = options.scheduledDate;
  }

  return {
    ...tools,
    tasks: [...tools.tasks, task],
  };
}

export function getActiveFocusTask(
  tools: WorkspaceInternalTools,
): FocusTask | null {
  const activeTaskId = tools.pomodoro.activeTaskId;
  if (!activeTaskId) {
    return null;
  }

  return (
    tools.tasks.find((task) => task.id === activeTaskId && !task.completed) ??
    null
  );
}

export function startCountdownFromEstimate(
  tools: WorkspaceInternalTools,
  taskId: string,
  now: Date,
): WorkspaceInternalTools {
  const task = tools.tasks.find((item) => item.id === taskId && !item.completed);
  if (
    !task ||
    task.estimateMinutes === undefined ||
    !isValidEstimateMinutes(task.estimateMinutes)
  ) {
    return tools;
  }

  return {
    ...tools,
    pomodoro: startCountdown(
      {
        ...tools.pomodoro,
        activeTaskId: taskId,
      },
      task.estimateMinutes,
      now,
    ),
  };
}

export function startFocusOnTask(
  tools: WorkspaceInternalTools,
  taskId: string,
): WorkspaceInternalTools {
  const task = tools.tasks.find((item) => item.id === taskId && !item.completed);
  if (!task) {
    return tools;
  }

  return {
    ...tools,
    pomodoro: {
      ...tools.pomodoro,
      mode: "pomodoro",
      countdownMinutes: null,
      activeTaskId: taskId,
      phase: "work",
      running: false,
      endsAt: null,
    },
  };
}

export function clearActiveFocusTask(
  tools: WorkspaceInternalTools,
): WorkspaceInternalTools {
  if (!tools.pomodoro.activeTaskId) {
    return tools;
  }

  return {
    ...tools,
    pomodoro: {
      ...tools.pomodoro,
      activeTaskId: null,
    },
  };
}

export function moveFocusTask(
  tools: WorkspaceInternalTools,
  taskId: string,
  targetSlotIndex: number,
): WorkspaceInternalTools {
  const task = tools.tasks.find((item) => item.id === taskId && !item.completed);
  if (!task) {
    return tools;
  }

  const sorted = listOpenTasks(tools, task.today);
  const fromIndex = sorted.findIndex((item) => item.id === taskId);
  if (fromIndex === -1) {
    return tools;
  }

  const targetIndex = Math.max(0, Math.min(targetSlotIndex, sorted.length - 1));
  if (fromIndex === targetIndex) {
    return tools;
  }

  const reordered = [...sorted];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(targetIndex, 0, moved);

  const beforeKey = targetIndex === 0 ? null : reordered[targetIndex - 1].orderKey;
  const afterKey =
    targetIndex === reordered.length - 1
      ? null
      : reordered[targetIndex + 1].orderKey;
  const newOrderKey = insertBetween(beforeKey, afterKey);

  return {
    ...tools,
    tasks: tools.tasks.map((item) =>
      item.id === taskId ? { ...item, orderKey: newOrderKey } : item,
    ),
  };
}

export function setFocusTaskEstimate(
  tools: WorkspaceInternalTools,
  taskId: string,
  estimateMinutes: number | undefined,
): WorkspaceInternalTools {
  const task = tools.tasks.find((item) => item.id === taskId && !item.completed);
  if (!task) {
    return tools;
  }

  if (estimateMinutes === undefined) {
    if (task.estimateMinutes === undefined) {
      return tools;
    }

    return {
      ...tools,
      tasks: tools.tasks.map((item) => {
        if (item.id !== taskId) {
          return item;
        }

        const { estimateMinutes: _removed, ...rest } = item;
        return rest;
      }),
    };
  }

  if (
    !isValidEstimateMinutes(estimateMinutes) ||
    task.estimateMinutes === estimateMinutes
  ) {
    return tools;
  }

  return {
    ...tools,
    tasks: tools.tasks.map((item) =>
      item.id === taskId ? { ...item, estimateMinutes } : item,
    ),
  };
}

export function setFocusTaskScheduledDate(
  tools: WorkspaceInternalTools,
  taskId: string,
  scheduledDate: string | undefined,
): WorkspaceInternalTools {
  const task = tools.tasks.find((item) => item.id === taskId && !item.completed);
  if (!task || task.scheduledDate === scheduledDate) {
    return tools;
  }

  if (!scheduledDate) {
    return {
      ...tools,
      tasks: tools.tasks.map((item) => {
        if (item.id !== taskId) {
          return item;
        }

        const { scheduledDate: _removed, ...rest } = item;
        return rest;
      }),
    };
  }

  return {
    ...tools,
    tasks: tools.tasks.map((item) =>
      item.id === taskId ? { ...item, scheduledDate } : item,
    ),
  };
}

export function setFocusTaskToday(
  tools: WorkspaceInternalTools,
  taskId: string,
  today: boolean,
): WorkspaceInternalTools {
  const task = tools.tasks.find((item) => item.id === taskId && !item.completed);
  if (!task || task.today === today) {
    return tools;
  }

  return {
    ...tools,
    tasks: tools.tasks.map((item) =>
      item.id === taskId ? { ...item, today } : item,
    ),
  };
}

export function completeFocusTask(
  tools: WorkspaceInternalTools,
  taskId: string,
): WorkspaceInternalTools {
  return {
    ...tools,
    tasks: tools.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: true } : task,
    ),
  };
}

export function toggleFocusTaskCompletion(
  tools: WorkspaceInternalTools,
  taskId: string,
): WorkspaceInternalTools {
  const task = tools.tasks.find((item) => item.id === taskId);
  if (!task) {
    return tools;
  }

  return {
    ...tools,
    tasks: tools.tasks.map((item) =>
      item.id === taskId ? { ...item, completed: !item.completed } : item,
    ),
  };
}
