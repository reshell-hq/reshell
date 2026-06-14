"use client";

import { useState } from "react";
import { isDemoMode } from "@/editions/demo-mode";
import {
  TASKS_FLYOUT_ACTIONS_CLASS,
  TASKS_FLYOUT_FORM_CLASS,
  TASKS_FLYOUT_ITEM_CLASS,
  TASKS_FLYOUT_LIST_SCROLL_CLASS,
  TASKS_FLYOUT_MAIN_CLASS,
} from "@/internal-tools/tasks-flyout-layout";
import {
  addFocusTask,
  completeFocusTask,
  listBacklogTasks,
  listTodayTasks,
  moveFocusTask,
  setFocusTaskEstimate,
  setFocusTaskToday,
  startCountdownFromEstimate,
  startFocusOnTask,
} from "@/internal-tools/tasks";
import type { WorkspaceInternalTools } from "@/internal-tools/types";
import { getLatestShellZones } from "@/shell-frame/shell-state";
import { pinInternalToolZone } from "@/shell-frame/shell-zones";

type TasksFlyoutProps = {
  internalTools: WorkspaceInternalTools;
  onChange: (internalTools: WorkspaceInternalTools) => void;
};

type TasksView = "today" | "backlog";

export function TasksFlyout({ internalTools, onChange }: TasksFlyoutProps) {
  const demoMode = isDemoMode();
  const [draft, setDraft] = useState("");
  const [estimateDraft, setEstimateDraft] = useState("");
  const [view, setView] = useState<TasksView>("today");
  const visibleTasks =
    view === "today" ? listTodayTasks(internalTools) : listBacklogTasks(internalTools);

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const estimateMinutes = estimateDraft.trim() ? Number(estimateDraft) : undefined;
    const next = addFocusTask(internalTools, draft, crypto.randomUUID(), estimateMinutes);
    if (next === internalTools) {
      return;
    }
    onChange(next);
    setDraft("");
    setEstimateDraft("");
  }

  return (
    <div className="shell-tool-flyout shell-tool-flyout-tasks">
      <div className="shell-tool-flyout-tasks-header">
        <p className="shell-flyout-title">Focus tasks</p>
        <div className="shell-tool-task-view-toggle" role="group" aria-label="Task list view">
          <button
            type="button"
            className="shell-flyout-more"
            aria-pressed={view === "today"}
            onClick={() => setView("today")}
          >
            Today
          </button>
          <button
            type="button"
            className="shell-flyout-more"
            aria-pressed={view === "backlog"}
            onClick={() => setView("backlog")}
          >
            Backlog
          </button>
        </div>
      </div>

      <div className={TASKS_FLYOUT_LIST_SCROLL_CLASS}>
        <ul className="shell-tool-task-list">
          {visibleTasks.length === 0 ? (
            <li className="shell-tool-task-empty">No tasks in this list yet.</li>
          ) : null}
          {visibleTasks.map((task, index) => (
            <li key={task.id} className={TASKS_FLYOUT_ITEM_CLASS}>
              <div className={TASKS_FLYOUT_MAIN_CLASS}>
                <span className="shell-tool-task-title">{task.title}</span>
                <label className="shell-tool-task-estimate-field">
                  <span className="shell-tool-split-label">Est</span>
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
                    className="shell-config-input shell-tool-task-estimate-input"
                    aria-label={`Estimate for ${task.title}`}
                  />
                </label>
              </div>
              <div className={TASKS_FLYOUT_ACTIONS_CLASS}>
                <button
                  type="button"
                  className="shell-flyout-dismiss shell-tool-task-action-btn"
                  aria-label={`Move ${task.title} up`}
                  title="Move up"
                  disabled={index === 0}
                  onClick={() => onChange(moveFocusTask(internalTools, task.id, index - 1))}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="shell-flyout-dismiss shell-tool-task-action-btn"
                  aria-label={`Move ${task.title} down`}
                  title="Move down"
                  disabled={index === visibleTasks.length - 1}
                  onClick={() => onChange(moveFocusTask(internalTools, task.id, index + 1))}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="shell-flyout-more shell-tool-task-action-btn"
                  title={view === "today" ? "Move to backlog" : "Move to today"}
                  onClick={() =>
                    onChange(setFocusTaskToday(internalTools, task.id, view !== "today"))
                  }
                >
                  {view === "today" ? "Backlog" : "Today"}
                </button>
                <button
                  type="button"
                  className="shell-flyout-more shell-tool-task-action-btn"
                  title="Start focus"
                  onClick={() => {
                    onChange(startFocusOnTask(internalTools, task.id));
                    pinInternalToolZone("pomodoro", getLatestShellZones());
                  }}
                >
                  Focus
                </button>
                <button
                  type="button"
                  className="shell-flyout-more shell-tool-task-action-btn"
                  title={
                    task.estimateMinutes ? "Start countdown" : "Add an estimate to start countdown"
                  }
                  disabled={!task.estimateMinutes}
                  onClick={() => {
                    onChange(startCountdownFromEstimate(internalTools, task.id, new Date()));
                    pinInternalToolZone("pomodoro", getLatestShellZones());
                  }}
                >
                  Timer
                </button>
                <button
                  type="button"
                  className="shell-flyout-more shell-tool-task-action-btn"
                  title="Mark done"
                  disabled={demoMode}
                  onClick={() => onChange(completeFocusTask(internalTools, task.id))}
                >
                  Done
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {demoMode ? null : (
        <form className={TASKS_FLYOUT_FORM_CLASS} onSubmit={handleAdd}>
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a focus task…"
            className="shell-config-input"
            aria-label="New focus task"
          />
          <div className="shell-tool-task-form-row">
            <label className="shell-tool-task-estimate-field">
              <span className="shell-tool-split-label">Estimate (min)</span>
              <input
                type="number"
                min={1}
                value={estimateDraft}
                onChange={(event) => setEstimateDraft(event.target.value)}
                placeholder="Optional"
                className="shell-config-input"
                aria-label="New focus task estimate"
              />
            </label>
            <button type="submit" className="shell-flyout-more" disabled={!draft.trim()}>
              Add
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
