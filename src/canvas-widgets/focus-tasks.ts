import { sortByKey } from "@/fractional-order/fractional-order";
import type { FocusTask, WorkspaceInternalTools } from "@/internal-tools/types";

export function formatCanvasFocusTaskEstimate(estimateMinutes?: number): string | null {
  if (estimateMinutes === undefined) {
    return null;
  }

  return `${estimateMinutes} min`;
}

export function canStartFocusCountdown(task: FocusTask): boolean {
  return task.estimateMinutes !== undefined && task.estimateMinutes > 0;
}

export function listCanvasFocusTasks(tools: WorkspaceInternalTools): FocusTask[] {
  return sortByKey(
    tools.tasks.filter((task) => task.today),
    (task) => task.orderKey,
  );
}
