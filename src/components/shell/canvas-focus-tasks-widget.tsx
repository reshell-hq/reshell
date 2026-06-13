"use client";

import { listCanvasFocusTasks } from "@/canvas-widgets/focus-tasks";
import { useLibrary, useSaveLibrary } from "@/hooks/use-library";
import type { Workspace } from "@/library/types";
import { toggleFocusTaskCompletion } from "@/internal-tools/tasks";

type CanvasFocusTasksWidgetProps = {
  workspace: Workspace;
};

export function CanvasFocusTasksWidget({ workspace }: CanvasFocusTasksWidgetProps) {
  const { data: library } = useLibrary();
  const saveLibrary = useSaveLibrary();
  const tasks = listCanvasFocusTasks(workspace.internalTools);

  if (tasks.length === 0) {
    return null;
  }

  function handleToggle(taskId: string) {
    if (!library) {
      return;
    }

    saveLibrary.mutate({
      ...library,
      workspaces: library.workspaces.map((entry) =>
        entry.id === workspace.id
          ? {
              ...entry,
              internalTools: toggleFocusTaskCompletion(entry.internalTools, taskId),
            }
          : entry,
      ),
    });
  }

  return (
    <div className="canvas-focus-tasks">
      <p className="canvas-focus-tasks-header">Tasks for today</p>
      <ul className="canvas-focus-tasks-list">
      {tasks.map((task) => (
        <li key={task.id}>
          <button
            type="button"
            className={`canvas-focus-tasks-item${task.completed ? " canvas-focus-tasks-item--done" : ""}`}
            onClick={() => handleToggle(task.id)}
            aria-pressed={task.completed}
          >
            <span className="canvas-focus-tasks-title">{task.title}</span>
          </button>
        </li>
      ))}
      </ul>
    </div>
  );
}
