"use client";

import { useState, type FormEvent } from "react";
import { useShell } from "@/components/shell/shell-context";
import { internalToolSlotId } from "@/lib/internal-tools/handles";
import {
  addFocusTask,
  completeFocusTask,
  listBacklogTasks,
  listTodayTasks,
  moveFocusTask,
  setFocusTaskEstimate,
  setFocusTaskScheduledDate,
  setFocusTaskToday,
  startCountdownFromEstimate,
  startFocusOnTask,
} from "@/lib/internal-tools/tasks";
import type { WorkspaceInternalTools } from "@/lib/internal-tools/types";

type TasksFlyoutProps = {
  internalTools: WorkspaceInternalTools;
  onChange: (internalTools: WorkspaceInternalTools) => void;
  /** Workspace text colour, so the flyout reads on any themed panel surface. */
  textColor: string;
};

type TasksView = "today" | "backlog";

const POMODORO_SLOT_ID = internalToolSlotId("pomodoro");

const PILL_CLASS =
  "rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10 aria-pressed:bg-black/10 dark:aria-pressed:bg-white/15";
const INPUT_CLASS =
  "rounded-md border border-current/15 bg-transparent px-2 py-1 text-sm outline-none focus:border-current/40";

/**
 * The focus-tasks tool flyout (CONTEXT: "Focus task"). Stateless w.r.t. tool
 * state; the today/backlog view and the add-form drafts are local state. The
 * list defaults to the today subset. Start focus / start countdown set the task
 * active and open the pomodoro tool flyout (the timer doesn't run until the
 * explicit Start there); complete is available from each row.
 */
export function TasksFlyout({
  internalTools,
  onChange,
  textColor,
}: TasksFlyoutProps) {
  const { focusOpen, pinActive } = useShell();
  const [draft, setDraft] = useState("");
  const [estimateDraft, setEstimateDraft] = useState("");
  const [scheduledDraft, setScheduledDraft] = useState("");
  const [view, setView] = useState<TasksView>("today");

  const visibleTasks =
    view === "today" ? listTodayTasks(internalTools) : listBacklogTasks(internalTools);

  function openPomodoro() {
    focusOpen(POMODORO_SLOT_ID);
    pinActive();
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = addFocusTask(internalTools, draft, {
      estimateMinutes: estimateDraft.trim() ? Number(estimateDraft) : undefined,
      scheduledDate: scheduledDraft.trim() || undefined,
    });
    if (next === internalTools) {
      return;
    }
    onChange(next);
    setDraft("");
    setEstimateDraft("");
    setScheduledDraft("");
  }

  return (
    <div className="flex w-72 flex-col gap-2 p-3" style={{ color: textColor }}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Focus tasks</p>
        <div className="flex gap-1" role="group" aria-label="Task list view">
          <button
            type="button"
            className={PILL_CLASS}
            aria-pressed={view === "today"}
            onClick={() => setView("today")}
          >
            Today
          </button>
          <button
            type="button"
            className={PILL_CLASS}
            aria-pressed={view === "backlog"}
            onClick={() => setView("backlog")}
          >
            Backlog
          </button>
        </div>
      </div>

      <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
        {visibleTasks.length === 0 ? (
          <li className="rounded-md px-2 py-3 text-center text-xs opacity-60">
            No tasks in this list yet.
          </li>
        ) : null}
        {visibleTasks.map((task, index) => (
          <li
            key={task.id}
            className="flex flex-col gap-1.5 rounded-md bg-black/5 p-2 dark:bg-white/5"
          >
            <span className="text-sm">{task.title}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <label className="flex items-center gap-1 text-[0.625rem] opacity-70">
                Est
                <input
                  type="number"
                  min={1}
                  value={task.estimateMinutes ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    const next = setFocusTaskEstimate(
                      internalTools,
                      task.id,
                      raw ? Number(raw) : undefined,
                    );
                    if (next !== internalTools) {
                      onChange(next);
                    }
                  }}
                  placeholder="—"
                  className={`${INPUT_CLASS} w-14`}
                  aria-label={`Estimate for ${task.title}`}
                />
              </label>
              <label className="flex items-center gap-1 text-[0.625rem] opacity-70">
                On
                <input
                  type="date"
                  value={task.scheduledDate ?? ""}
                  onChange={(event) =>
                    onChange(
                      setFocusTaskScheduledDate(
                        internalTools,
                        task.id,
                        event.target.value || undefined,
                      ),
                    )
                  }
                  className={`${INPUT_CLASS} w-32`}
                  aria-label={`Scheduled date for ${task.title}`}
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                className={PILL_CLASS}
                aria-label={`Move ${task.title} up`}
                title="Move up"
                disabled={index === 0}
                onClick={() => onChange(moveFocusTask(internalTools, task.id, index - 1))}
              >
                ↑
              </button>
              <button
                type="button"
                className={PILL_CLASS}
                aria-label={`Move ${task.title} down`}
                title="Move down"
                disabled={index === visibleTasks.length - 1}
                onClick={() => onChange(moveFocusTask(internalTools, task.id, index + 1))}
              >
                ↓
              </button>
              <button
                type="button"
                className={PILL_CLASS}
                title={view === "today" ? "Move to backlog" : "Move to today"}
                onClick={() =>
                  onChange(setFocusTaskToday(internalTools, task.id, view !== "today"))
                }
              >
                {view === "today" ? "Backlog" : "Today"}
              </button>
              <button
                type="button"
                className={PILL_CLASS}
                title="Start focus"
                onClick={() => {
                  onChange(startFocusOnTask(internalTools, task.id));
                  openPomodoro();
                }}
              >
                Focus
              </button>
              <button
                type="button"
                className={PILL_CLASS}
                title={
                  task.estimateMinutes
                    ? "Start countdown"
                    : "Add an estimate to start a countdown"
                }
                disabled={!task.estimateMinutes}
                onClick={() => {
                  onChange(
                    startCountdownFromEstimate(internalTools, task.id, new Date()),
                  );
                  openPomodoro();
                }}
              >
                Timer
              </button>
              <button
                type="button"
                className={PILL_CLASS}
                title="Mark done"
                onClick={() => onChange(completeFocusTask(internalTools, task.id))}
              >
                Done
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form
        className="flex flex-col gap-1.5 border-t border-current/10 pt-2"
        onSubmit={handleAdd}
      >
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a focus task…"
          className={INPUT_CLASS}
          aria-label="New focus task"
        />
        <div className="flex items-end gap-1.5">
          <label className="flex flex-1 flex-col gap-0.5 text-[0.625rem] opacity-70">
            Estimate (min)
            <input
              type="number"
              min={1}
              value={estimateDraft}
              onChange={(event) => setEstimateDraft(event.target.value)}
              placeholder="Optional"
              className={INPUT_CLASS}
              aria-label="New focus task estimate"
            />
          </label>
          <label className="flex flex-1 flex-col gap-0.5 text-[0.625rem] opacity-70">
            Scheduled
            <input
              type="date"
              value={scheduledDraft}
              onChange={(event) => setScheduledDraft(event.target.value)}
              className={INPUT_CLASS}
              aria-label="New focus task scheduled date"
            />
          </label>
          <button
            type="submit"
            className={`${PILL_CLASS} border border-current/15`}
            disabled={!draft.trim()}
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
