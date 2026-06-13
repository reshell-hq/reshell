"use client";

import { useState } from "react";
import { usePomodoroTimerNow } from "@/hooks/use-pomodoro-timer-now";
import {
  BUILTIN_FOCUS_SPLITS,
  CUSTOM_SPLIT_ID,
  displayPomodoroSeconds,
  formatFocusSplitSummary,
  formatPomodoroTimerLabel,
  formatTimerSeconds,
  pausePomodoro,
  resetPomodoro,
  resolveFocusSplit,
  setCustomFocusSplit,
  setPomodoroChimeEnabled,
  setPomodoroSplit,
  startPomodoro,
} from "@/internal-tools/pomodoro";
import {
  POMODORO_FLYOUT_PHASE_CLASS,
  POMODORO_FLYOUT_PRIMARY_ACTIONS_CLASS,
  POMODORO_FLYOUT_SCROLL_CLASS,
  POMODORO_FLYOUT_SPLIT_SUMMARY_CLASS,
  POMODORO_FLYOUT_STATUS_CLASS,
} from "@/internal-tools/pomodoro-flyout-display";
import { clearActiveFocusTask, getActiveFocusTask } from "@/internal-tools/tasks";
import type { WorkspaceInternalTools } from "@/internal-tools/types";

type PomodoroFlyoutProps = {
  internalTools: WorkspaceInternalTools;
  onChange: (internalTools: WorkspaceInternalTools) => void;
};

const DEFAULT_CUSTOM_DRAFT = {
  label: "",
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
};

export function PomodoroFlyout({ internalTools, onChange }: PomodoroFlyoutProps) {
  const pomodoro = internalTools.pomodoro;
  const now = usePomodoroTimerNow(pomodoro);
  const [customDraft, setCustomDraft] = useState(() => {
    const custom = internalTools.customFocusSplit;
    return custom
      ? {
          label: custom.label === "Custom" ? "" : custom.label,
          workMinutes: custom.workMinutes,
          shortBreakMinutes: custom.shortBreakMinutes,
          longBreakMinutes: custom.longBreakMinutes,
        }
      : DEFAULT_CUSTOM_DRAFT;
  });

  const activeTask = getActiveFocusTask(internalTools);
  const split = resolveFocusSplit(pomodoro.splitId, internalTools);
  const seconds = displayPomodoroSeconds(pomodoro, split, now);

  return (
    <div className="shell-tool-flyout">
      <p className="shell-flyout-title">Pomodoro</p>
      {activeTask ? (
        <div className="shell-tool-active-task-row">
          <p className="shell-tool-active-task">{activeTask.title}</p>
          <button
            type="button"
            className="shell-flyout-dismiss shell-tool-clear-focus-btn"
            onClick={() => onChange(clearActiveFocusTask(internalTools))}
          >
            Clear focus
          </button>
        </div>
      ) : null}
      <div className={POMODORO_FLYOUT_STATUS_CLASS}>
        <p className={POMODORO_FLYOUT_PHASE_CLASS}>{formatPomodoroTimerLabel(pomodoro)}</p>
        <p className="shell-tool-timer" aria-live="polite">
          {formatTimerSeconds(seconds)}
        </p>
        {pomodoro.mode === "countdown" ? (
          <p className={POMODORO_FLYOUT_SPLIT_SUMMARY_CLASS}>
            {pomodoro.countdownMinutes} min focus countdown
          </p>
        ) : (
          <p className={POMODORO_FLYOUT_SPLIT_SUMMARY_CLASS}>
            {split.label} · {formatFocusSplitSummary(split)}
          </p>
        )}
      </div>
      <div className={POMODORO_FLYOUT_PRIMARY_ACTIONS_CLASS}>
        {pomodoro.running ? (
          <button
            type="button"
            className="shell-flyout-more"
            onClick={() =>
              onChange({
                ...internalTools,
                pomodoro: pausePomodoro(pomodoro),
              })
            }
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            className="shell-flyout-more"
            onClick={() =>
              onChange({
                ...internalTools,
                pomodoro: startPomodoro(pomodoro, new Date(), split),
              })
            }
          >
            Start
          </button>
        )}
        <button
          type="button"
          className="shell-flyout-dismiss"
          onClick={() =>
            onChange({
              ...internalTools,
              pomodoro: resetPomodoro(pomodoro),
            })
          }
        >
          Reset
        </button>
        <button
          type="button"
          className="shell-flyout-more"
          aria-pressed={pomodoro.chimeEnabled}
          onClick={() => onChange(setPomodoroChimeEnabled(internalTools, !pomodoro.chimeEnabled))}
        >
          Chime
        </button>
      </div>
      <div className={POMODORO_FLYOUT_SCROLL_CLASS}>
        {pomodoro.mode === "pomodoro" ? (
          <>
            <fieldset className="shell-tool-split-picker">
              <legend className="shell-tool-split-label">Focus split</legend>
              <div className="shell-tool-split-options">
                {BUILTIN_FOCUS_SPLITS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="shell-flyout-more"
                    aria-pressed={pomodoro.splitId === option.id}
                    onClick={() => onChange(setPomodoroSplit(internalTools, option.id))}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="shell-flyout-more"
                  aria-pressed={pomodoro.splitId === CUSTOM_SPLIT_ID}
                  onClick={() => {
                    if (internalTools.customFocusSplit) {
                      onChange(setPomodoroSplit(internalTools, CUSTOM_SPLIT_ID));
                    }
                  }}
                >
                  Custom
                </button>
              </div>
            </fieldset>
            <form
              className="shell-tool-split-form"
              onSubmit={(event) => {
                event.preventDefault();
                const next = setCustomFocusSplit(internalTools, customDraft);
                if (next !== internalTools) {
                  onChange(next);
                }
              }}
            >
              <label className="shell-tool-split-field">
                <span className="shell-tool-split-label">Label</span>
                <input
                  type="text"
                  value={customDraft.label}
                  onChange={(event) =>
                    setCustomDraft((draft) => ({ ...draft, label: event.target.value }))
                  }
                  placeholder="Custom"
                  className="shell-config-input"
                  aria-label="Custom split label"
                />
              </label>
              <div className="shell-tool-split-intervals">
                <label className="shell-tool-split-field">
                  <span className="shell-tool-split-label">Work</span>
                  <input
                    type="number"
                    min={1}
                    value={customDraft.workMinutes}
                    onChange={(event) =>
                      setCustomDraft((draft) => ({
                        ...draft,
                        workMinutes: Number(event.target.value),
                      }))
                    }
                    className="shell-config-input"
                    aria-label="Work minutes"
                  />
                </label>
                <label className="shell-tool-split-field">
                  <span className="shell-tool-split-label">Short</span>
                  <input
                    type="number"
                    min={1}
                    value={customDraft.shortBreakMinutes}
                    onChange={(event) =>
                      setCustomDraft((draft) => ({
                        ...draft,
                        shortBreakMinutes: Number(event.target.value),
                      }))
                    }
                    className="shell-config-input"
                    aria-label="Short break minutes"
                  />
                </label>
                <label className="shell-tool-split-field">
                  <span className="shell-tool-split-label">Long</span>
                  <input
                    type="number"
                    min={1}
                    value={customDraft.longBreakMinutes}
                    onChange={(event) =>
                      setCustomDraft((draft) => ({
                        ...draft,
                        longBreakMinutes: Number(event.target.value),
                      }))
                    }
                    className="shell-config-input"
                    aria-label="Long break minutes"
                  />
                </label>
              </div>
              <button type="submit" className="shell-flyout-more">
                Save custom split
              </button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
