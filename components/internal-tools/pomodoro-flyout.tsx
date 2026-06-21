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
} from "@/lib/internal-tools/pomodoro";
import { getActiveFocusTask, clearActiveFocusTask } from "@/lib/internal-tools/tasks";
import type { WorkspaceInternalTools } from "@/lib/internal-tools/types";

type PomodoroFlyoutProps = {
  internalTools: WorkspaceInternalTools;
  onChange: (internalTools: WorkspaceInternalTools) => void;
  /** Workspace text colour, so the flyout reads on any themed panel surface. */
  textColor: string;
};

const DEFAULT_CUSTOM_DRAFT = {
  label: "",
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
};

const PILL_CLASS =
  "rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10 aria-pressed:bg-black/10 dark:aria-pressed:bg-white/15";
const INPUT_CLASS =
  "w-full rounded-md border border-current/15 bg-transparent px-2 py-1 text-sm outline-none focus:border-current/40";

/**
 * The pomodoro tool flyout (CONTEXT: "Focus split" / "Focus countdown") — the
 * right-rim tool's notch content. Stateless w.r.t. tool state (it lives above
 * the slot, since `Shell.Slot` renders content twice); only the local custom
 * split draft is component state. Shows the active focus task, the timer, split
 * presets + a custom split, start/pause/reset, and the optional chime toggle.
 */
export function PomodoroFlyout({
  internalTools,
  onChange,
  textColor,
}: PomodoroFlyoutProps) {
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
    <div className="flex w-64 flex-col gap-3 p-3" style={{ color: textColor }}>
      <p className="text-sm font-semibold">Pomodoro</p>

      {activeTask ? (
        <div className="flex items-center justify-between gap-2 rounded-md bg-black/5 px-2 py-1.5 text-xs dark:bg-white/10">
          <span className="truncate">Focusing: {activeTask.title}</span>
          <button
            type="button"
            className={PILL_CLASS}
            onClick={() => onChange(clearActiveFocusTask(internalTools))}
          >
            Clear
          </button>
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-0.5">
        <p className="text-[0.6875rem] uppercase tracking-wide opacity-60">
          {formatPomodoroTimerLabel(pomodoro)}
        </p>
        <p className="font-mono text-4xl tabular-nums" aria-live="polite">
          {formatTimerSeconds(seconds)}
        </p>
        <p className="text-[0.6875rem] opacity-60">
          {pomodoro.mode === "countdown"
            ? `${pomodoro.countdownMinutes} min focus countdown`
            : `${split.label} · ${formatFocusSplitSummary(split)}`}
        </p>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {pomodoro.running ? (
          <button
            type="button"
            className={PILL_CLASS}
            onClick={() =>
              onChange({ ...internalTools, pomodoro: pausePomodoro(pomodoro) })
            }
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            className={PILL_CLASS}
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
          className={PILL_CLASS}
          onClick={() =>
            onChange({ ...internalTools, pomodoro: resetPomodoro(pomodoro) })
          }
        >
          Reset
        </button>
        <button
          type="button"
          className={PILL_CLASS}
          aria-pressed={pomodoro.chimeEnabled}
          onClick={() =>
            onChange(setPomodoroChimeEnabled(internalTools, !pomodoro.chimeEnabled))
          }
        >
          Chime {pomodoro.chimeEnabled ? "on" : "off"}
        </button>
      </div>

      {pomodoro.mode === "pomodoro" ? (
        <div className="flex flex-col gap-2 border-t border-current/10 pt-2">
          <fieldset>
            <legend className="mb-1 text-[0.6875rem] uppercase tracking-wide opacity-60">
              Focus split
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {BUILTIN_FOCUS_SPLITS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={PILL_CLASS}
                  aria-pressed={pomodoro.splitId === option.id}
                  onClick={() => onChange(setPomodoroSplit(internalTools, option.id))}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                className={PILL_CLASS}
                aria-pressed={pomodoro.splitId === CUSTOM_SPLIT_ID}
                disabled={!internalTools.customFocusSplit}
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
            className="flex flex-col gap-1.5"
            onSubmit={(event) => {
              event.preventDefault();
              const next = setCustomFocusSplit(internalTools, customDraft);
              if (next !== internalTools) {
                onChange(next);
              }
            }}
          >
            <label className="flex flex-col gap-0.5">
              <span className="text-[0.6875rem] uppercase tracking-wide opacity-60">
                Custom split
              </span>
              <input
                type="text"
                value={customDraft.label}
                onChange={(event) =>
                  setCustomDraft((draft) => ({ ...draft, label: event.target.value }))
                }
                placeholder="Label (optional)"
                className={INPUT_CLASS}
                aria-label="Custom split label"
              />
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <label className="flex flex-col gap-0.5">
                <span className="text-[0.625rem] opacity-60">Work</span>
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
                  className={INPUT_CLASS}
                  aria-label="Work minutes"
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[0.625rem] opacity-60">Short</span>
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
                  className={INPUT_CLASS}
                  aria-label="Short break minutes"
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[0.625rem] opacity-60">Long</span>
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
                  className={INPUT_CLASS}
                  aria-label="Long break minutes"
                />
              </label>
            </div>
            <button
              type="submit"
              className={`${PILL_CLASS} self-start border border-current/15`}
            >
              Save custom split
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
