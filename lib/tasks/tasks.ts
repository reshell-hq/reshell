import type { FocusTask } from "./types";

/**
 * Pure task transforms, ported from yeti-workspace's `internal-tools/tasks.ts`
 * and reshaped for the config + override model: they operate on a plain
 * `FocusTask[]` (the override's `tasks`) and return a new array, rather than
 * mutating a `Library` record. Zero React/DOM deps — the portable core
 * (ADR-0009). Each transform returns the input unchanged when it would be a
 * no-op, so callers can persist the result unconditionally.
 */

/** Direction for `moveTask`, relative to the list's display order. */
export type MoveDirection = "up" | "down";

function isValidEstimateMinutes(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/** Tasks in one list (`today`), sorted by their integer `order`. */
function siblings(tasks: FocusTask[], today: boolean): FocusTask[] {
  return tasks
    .filter((task) => task.today === today)
    .sort((a, b) => a.order - b.order);
}

export function addTask(
  tasks: FocusTask[],
  title: string,
  options: { id?: string; estimateMinutes?: number } = {},
): FocusTask[] {
  const trimmed = title.trim();
  if (!trimmed) {
    return tasks;
  }

  // Append after the current max so a new task lands at the end of its list.
  const order =
    tasks.length === 0 ? 0 : Math.max(...tasks.map((task) => task.order)) + 1;
  const task: FocusTask = {
    id: options.id ?? crypto.randomUUID(),
    title: trimmed,
    today: true,
    completed: false,
    order,
  };
  if (
    options.estimateMinutes !== undefined &&
    isValidEstimateMinutes(options.estimateMinutes)
  ) {
    task.estimateMinutes = options.estimateMinutes;
  }

  return [...tasks, task];
}

export function editTitle(
  tasks: FocusTask[],
  id: string,
  title: string,
): FocusTask[] {
  const trimmed = title.trim();
  if (!trimmed) {
    return tasks;
  }
  return tasks.map((task) =>
    task.id === id ? { ...task, title: trimmed } : task,
  );
}

export function setEstimate(
  tasks: FocusTask[],
  id: string,
  estimateMinutes: number | undefined,
): FocusTask[] {
  const task = tasks.find((item) => item.id === id);
  if (!task) {
    return tasks;
  }

  if (estimateMinutes === undefined) {
    if (task.estimateMinutes === undefined) {
      return tasks;
    }
    return tasks.map((item) => {
      if (item.id !== id) {
        return item;
      }
      const next = { ...item };
      delete next.estimateMinutes;
      return next;
    });
  }

  if (!isValidEstimateMinutes(estimateMinutes) || task.estimateMinutes === estimateMinutes) {
    return tasks;
  }
  return tasks.map((item) =>
    item.id === id ? { ...item, estimateMinutes } : item,
  );
}

export function toggleToday(tasks: FocusTask[], id: string): FocusTask[] {
  return tasks.map((task) =>
    task.id === id ? { ...task, today: !task.today } : task,
  );
}

export function toggleCompleted(tasks: FocusTask[], id: string): FocusTask[] {
  return tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task,
  );
}

export function removeTask(tasks: FocusTask[], id: string): FocusTask[] {
  return tasks.filter((task) => task.id !== id);
}

/**
 * Reorder a task one step within its own list by swapping its integer `order`
 * with the adjacent sibling's. ponytail: a swap keeps the keys contiguous and
 * unique with no re-spacing pass; an out-of-range move is a no-op.
 */
export function moveTask(
  tasks: FocusTask[],
  id: string,
  direction: MoveDirection,
): FocusTask[] {
  const task = tasks.find((item) => item.id === id);
  if (!task) {
    return tasks;
  }

  const list = siblings(tasks, task.today);
  const fromIndex = list.findIndex((item) => item.id === id);
  const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
  if (toIndex < 0 || toIndex >= list.length) {
    return tasks;
  }

  const neighbor = list[toIndex];
  return tasks.map((item) => {
    if (item.id === task.id) {
      return { ...item, order: neighbor.order };
    }
    if (item.id === neighbor.id) {
      return { ...item, order: task.order };
    }
    return item;
  });
}

/** Partition tasks into the today list and the backlog, each sorted by order. */
export function splitTodayBacklog(tasks: FocusTask[]): {
  today: FocusTask[];
  backlog: FocusTask[];
} {
  return {
    today: siblings(tasks, true),
    backlog: siblings(tasks, false),
  };
}
