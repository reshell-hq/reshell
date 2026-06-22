"use client";

import { useTasks } from "@/hooks/use-tasks";

// Ambient widgets are read-only and space-constrained; show a handful and let
// the right-edge tasks tool own the full list (CONTEXT: "Canvas widget").
const MAX_VISIBLE = 5;

/**
 * Ambient focus-tasks readout (CONTEXT: "Canvas widget"). Read-only mirror of
 * the tasks tool's today list (plan 012): the active task is accented, complete
 * ones are struck through. Renders nothing when there are no today tasks.
 */
export function FocusTasksWidget() {
  const { today, todayCount, activeTaskId } = useTasks();

  if (today.length === 0) {
    return null;
  }

  const visible = today.slice(0, MAX_VISIBLE);
  const overflow = today.length - visible.length;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[0.6875rem] font-semibold tracking-wide uppercase opacity-60">
        Today · {todayCount}
      </p>
      <ul className="flex flex-col gap-1.5 text-sm">
        {visible.map((task) => {
          const active = task.id === activeTaskId;
          return (
            <li key={task.id} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full"
                style={{
                  background: active
                    ? "var(--scene-accent, var(--primary))"
                    : "currentColor",
                  opacity: active ? 1 : task.completed ? 0.3 : 0.4,
                }}
              />
              <span className={task.completed ? "line-through opacity-50" : undefined}>
                {task.title}
              </span>
            </li>
          );
        })}
      </ul>
      {overflow > 0 ? (
        <p className="text-xs opacity-50">+{overflow} more</p>
      ) : null}
    </div>
  );
}
