"use client";

import { useRef, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useTasks, type UseTasks } from "@/hooks/use-tasks";
import type { FocusTask } from "@/lib/tasks";

// The second tool slot (CONTEXT: "Tool"): a fixed RIGHT-edge fixture, sibling to
// the timer. Distinct from the timer (`timer`), bookmark slots (`bm:*`), the
// command center (`command-center`), and the command bar (`command`).
const SLOT_ID = "tasks";

/**
 * Right-edge tasks tool. The wrapper owns the single `useTasks` instance and
 * feeds a stateless panel, which `Shell.Slot` renders twice (offscreen measurer
 * + portal); identical props keep both copies in sync. The only transient UI
 * state — the add field — is uncontrolled (a ref), so it never desyncs the two
 * copies. App-decoupled (ADR-0009): every read/write goes through the hook.
 */
export function TasksSlot() {
  const tasks = useTasks();

  return (
    <Shell.Edge side="right">
      <Shell.Slot
        id={SLOT_ID}
        handleLabel="Tasks"
        handle={<TasksHandle count={tasks.todayCount} />}
      >
        <TasksPanel tasks={tasks} />
      </Shell.Slot>
    </Shell.Edge>
  );
}

/** Gutter affordance: a checklist glyph badged with the open today count. */
function TasksHandle({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-1">
      <Icon value="list" size={14} />
      {count > 0 ? (
        <span className="font-mono text-[0.6875rem] font-medium tabular-nums">
          {count}
        </span>
      ) : null}
    </span>
  );
}

function TasksPanel({ tasks }: { tasks: UseTasks }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const input = inputRef.current;
    if (!input) {
      return;
    }
    tasks.addTask(input.value);
    input.value = "";
    input.focus();
  }

  return (
    <section
      aria-label="Tasks"
      className="flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-4 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl"
    >
      <header className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Tasks
        </p>
        <span className="text-xs text-muted-foreground tabular-nums">
          {tasks.todayCount} today
        </span>
      </header>

      <form onSubmit={handleAdd}>
        <Input
          ref={inputRef}
          type="text"
          aria-label="Add a task"
          placeholder="Add a task — press Enter"
          spellCheck={false}
          autoComplete="off"
        />
      </form>

      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
        <TaskSection
          label="Today"
          tasks={tasks.today}
          actions={tasks}
          empty="Nothing planned for today."
        />
        <TaskSection
          label="Backlog"
          tasks={tasks.backlog}
          actions={tasks}
          empty="Backlog is clear."
        />
      </div>
    </section>
  );
}

function TaskSection({
  label,
  tasks,
  actions,
  empty,
}: {
  label: string;
  tasks: FocusTask[];
  actions: UseTasks;
  empty: string;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <p className="text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {tasks.length === 0 ? (
        <p className="px-1 py-1.5 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {tasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              actions={actions}
              isFirst={index === 0}
              isLast={index === tasks.length - 1}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskRow({
  task,
  actions,
  isFirst,
  isLast,
}: {
  task: FocusTask;
  actions: UseTasks;
  isFirst: boolean;
  isLast: boolean;
}) {
  const isFocused = actions.activeTaskId === task.id;

  return (
    <li
      className={`flex flex-col gap-2 rounded-lg border p-2 transition-colors ${
        isFocused ? "border-primary/50 bg-primary/5" : "border-border/60 bg-background/40"
      }`}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          className="mt-0.5"
          checked={task.completed}
          onCheckedChange={() => actions.toggleCompleted(task.id)}
          aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
        />
        <span
          className={`flex-1 text-sm leading-snug ${
            task.completed ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {task.title}
        </span>
        <span className="flex shrink-0 flex-col">
          <ReorderButton
            direction="up"
            disabled={isFirst}
            onClick={() => actions.moveTask(task.id, "up")}
          />
          <ReorderButton
            direction="down"
            disabled={isLast}
            onClick={() => actions.moveTask(task.id, "down")}
          />
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pl-6">
        <label className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
          <span className="sr-only">Estimate in minutes</span>
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            value={task.estimateMinutes ?? ""}
            onChange={(event) =>
              actions.setEstimate(
                task.id,
                event.target.value === "" ? undefined : Number(event.target.value),
              )
            }
            placeholder="est"
            aria-label="Estimate in minutes"
            className="h-7 w-16 px-2 text-xs"
          />
          <span aria-hidden>min</span>
        </label>

        <Button
          type="button"
          size="xs"
          variant={isFocused ? "secondary" : "ghost"}
          aria-pressed={isFocused}
          onClick={() => actions.startFocusOnTask(task.id)}
        >
          {isFocused ? "Focused" : "Focus"}
        </Button>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          disabled={task.estimateMinutes === undefined}
          onClick={() => actions.startCountdownFromEstimate(task.id)}
        >
          Start estimate
        </Button>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          onClick={() => actions.toggleToday(task.id)}
        >
          {task.today ? "To backlog" : "To today"}
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label="Remove task"
          className="ml-auto text-muted-foreground hover:text-destructive"
          onClick={() => actions.removeTask(task.id)}
        >
          <RemoveGlyph />
        </Button>
      </div>
    </li>
  );
}

function ReorderButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "up" | "down";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="icon-xs"
      variant="ghost"
      disabled={disabled}
      aria-label={direction === "up" ? "Move task up" : "Move task down"}
      className="h-4 w-5 text-muted-foreground"
      onClick={onClick}
    >
      <Chevron direction={direction} />
    </Button>
  );
}

function Chevron({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`h-3 w-3 ${direction === "down" ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10l4-4 4 4" />
    </svg>
  );
}

function RemoveGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

