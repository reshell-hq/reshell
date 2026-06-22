"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Shell } from "@/components/shell";
import { useShell } from "@/components/shell/shell-context";
import { Icon } from "@/components/icon";
import { useGlobalTypeahead } from "@/hooks/use-global-typeahead";
import { useMusic } from "@/hooks/use-music";
import { useReshellState } from "@/hooks/use-reshell-state";
import { useTasks } from "@/hooks/use-tasks";
import { useTimer } from "@/hooks/use-timer";
import {
  buildCommandIndex,
  parseQuery,
  rank,
  type CommandEntry,
  type CommandKind,
} from "@/lib/command";

// Distinct from bookmark slots (`bm:${edge}:${index}`) and the command center
// (`command-center`). Handleless, so the bottom edge minimises (CONTEXT) — the
// bar is reached by typing (plan 010 typeahead), not a gutter handle.
const SLOT_ID = "command";

// Cap visible rows so the upward-growing notch stays bounded; the ranker keeps
// the best matches at the top.
const MAX_ROWS = 8;

const KIND_LABELS: Record<CommandKind, string> = {
  switch: "Workspace",
  open: "Bookmark",
  scene: "Scene",
  reset: "Reset",
  timer: "Timer",
  task: "Task",
  music: "Music",
};

/**
 * The command bar (CONTEXT: "Command bar"): the bottom-edge slot repurposed as
 * the single command surface, built on the `SearchSlot` layout (input pinned to
 * the docking edge, ranked results growing upward). App-decoupled (ADR-0009):
 * reads config + dispatches through the provider hook; the pure `lib/command`
 * core does the parsing/ranking/index.
 *
 * Query + selection state live here (the parent), because `Shell.Slot` renders
 * its children twice — an offscreen measurer and the live portal — so per the
 * `search-slot.tsx` contract the panel must be stateless to stay in sync.
 */
export function CommandBarSlot() {
  const { config, activeWorkspace, activeWorkspaceId, setActiveWorkspace, patchOverride, resetWorkspace } =
    useReshellState();
  const timer = useTimer();
  const tasks = useTasks();
  const music = useMusic();
  const { closeActive, focusOpen } = useShell();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  // Type-to-open: a bare printable key (no field focused) opens the bar seeded
  // with that char. Appending — not replacing — covers the brief gap between
  // opening and the input gaining focus, so a fast second key is not dropped.
  // Wired once here (the wrapper renders once), never in the twice-rendered
  // panel. Once the input is focused the hook's guard stands down.
  useGlobalTypeahead((char) => {
    setQuery((previous) => previous + char);
    setSelected(0);
    focusOpen(SLOT_ID);
  });

  const index = useMemo(
    () => buildCommandIndex({ config, activeWorkspace, activeWorkspaceId, tasks: tasks.tasks }),
    [config, activeWorkspace, activeWorkspaceId, tasks.tasks],
  );

  const results = useMemo(() => {
    const parsed = parseQuery(query);
    const pool = index.filter((entry) => entry.mode === parsed.mode);
    const ranked = rank(parsed.query, pool);
    // Inline "add task" capture: a static verb can't carry free text, so when
    // the verb query reads like `add buy milk`, surface a live create entry.
    if (parsed.mode === "verb") {
      const title = extractNewTaskTitle(parsed.query);
      if (title) {
        return [newTaskEntry(title), ...ranked].slice(0, MAX_ROWS);
      }
    }
    return ranked.slice(0, MAX_ROWS);
  }, [index, query]);

  // Clamp selection into range whenever the result set shrinks.
  const activeIndex = results.length === 0 ? -1 : Math.min(selected, results.length - 1);

  function reset() {
    setQuery("");
    setSelected(0);
  }

  function runCommand(entry: CommandEntry) {
    const { run } = entry;
    switch (run.type) {
      case "switch":
        setActiveWorkspace(run.workspaceId);
        break;
      case "open":
        window.open(run.url, "_blank", "noopener,noreferrer");
        break;
      case "scene":
        patchOverride(activeWorkspaceId, { scene: run.scene });
        break;
      case "reset":
        resetWorkspace(run.workspaceId);
        break;
      case "timer":
        if (run.action === "start") {
          timer.start();
        } else {
          timer.pause();
        }
        break;
      case "task":
        if (run.action === "add") {
          const title = extractNewTaskTitle(parseQuery(query).query);
          if (title) {
            tasks.addTask(title);
          }
        } else {
          tasks.startFocusOnTask(run.taskId);
        }
        break;
      case "music":
        if (run.action === "play") {
          music.play();
        } else if (run.action === "pause") {
          music.pause();
        } else {
          music.next();
        }
        break;
    }
    reset();
    closeActive();
  }

  return (
    <Shell.Edge side="bottom">
      <Shell.Slot id={SLOT_ID} autoFocus>
        <CommandPanel
          query={query}
          results={results}
          activeIndex={activeIndex}
          onQueryChange={(value) => {
            setQuery(value);
            setSelected(0);
          }}
          onSelect={setSelected}
          onMove={(direction) =>
            setSelected((current) => moveSelection(current, direction, results.length))
          }
          onRun={runCommand}
          onClose={() => {
            reset();
            closeActive();
          }}
        />
      </Shell.Slot>
    </Shell.Edge>
  );
}

// Pull a new-task title out of a verb query like `add buy milk`, `add task buy
// milk`, or `task buy milk`. Returns null when there's no title to create.
function extractNewTaskTitle(verbQuery: string): string | null {
  const match = verbQuery.match(/^add(?:\s+task)?\s+(.+)$|^task\s+(.+)$/i);
  if (!match) {
    return null;
  }
  return (match[1] ?? match[2]).trim() || null;
}

/** A live, query-derived "create task" row (its title is re-read on run). */
function newTaskEntry(title: string): CommandEntry {
  return {
    id: "task-add-live",
    mode: "verb",
    kind: "task",
    label: `Add task “${title}”`,
    keywords: [],
    run: { type: "task", action: "add" },
  };
}

function moveSelection(current: number, direction: "up" | "down", count: number): number {
  if (count === 0) {
    return 0;
  }
  const step = direction === "down" ? 1 : -1;
  return (current + step + count) % count;
}

type CommandPanelProps = {
  query: string;
  results: CommandEntry[];
  activeIndex: number;
  onQueryChange: (value: string) => void;
  onSelect: (index: number) => void;
  onMove: (direction: "up" | "down") => void;
  onRun: (entry: CommandEntry) => void;
  onClose: () => void;
};

function CommandPanel({
  query,
  results,
  activeIndex,
  onQueryChange,
  onSelect,
  onMove,
  onRun,
  onClose,
}: CommandPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus is handled by Shell.Slot's `autoFocus` (it waits for the portal
  // reveal — focusing a `display:none` field is a no-op, which is why early
  // mount-focus failed and the input dropped Backspace/Enter).

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      onMove("down");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      onMove("up");
    } else if (event.key === "Enter") {
      event.preventDefault();
      const entry = results[activeIndex] ?? results[0];
      if (entry) {
        onRun(entry);
      }
    } else if (event.key === "Escape") {
      // Let the shell portal's own Escape handler collapse the notch; clear here.
      onClose();
    }
  }

  return (
    <div className="flex w-[26rem] max-w-[calc(100vw-2rem)] flex-col-reverse gap-2 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl">
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Command bar"
        aria-controls="command-bar-results"
        placeholder="Search workspaces & bookmarks — : or > for commands"
        className="w-full shrink-0 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
        spellCheck={false}
        autoComplete="off"
      />

      {results.length > 0 ? (
        <ul
          id="command-bar-results"
          role="listbox"
          aria-label="Commands"
          className="max-h-72 space-y-0.5 overflow-y-auto"
        >
          {results.map((entry, rowIndex) => {
            const isActive = rowIndex === activeIndex;
            return (
              <li key={entry.id} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => onRun(entry)}
                  onMouseMove={() => onSelect(rowIndex)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/60"
                  }`}
                >
                  <Icon
                    value={entry.icon}
                    className="h-4 w-4 shrink-0"
                    fallback={<KindGlyph active={isActive} />}
                  />
                  <span className="flex-1 truncate">{entry.label}</span>
                  <span className="shrink-0 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
                    {KIND_LABELS[entry.kind]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p
          id="command-bar-results"
          role="status"
          className="px-2 py-1.5 text-sm text-muted-foreground"
        >
          No matches
        </p>
      )}
    </div>
  );
}

/** Neutral dot for entries without an icon (workspaces, verbs). */
function KindGlyph({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
        active ? "bg-accent-foreground/70" : "bg-muted-foreground/50"
      }`}
    />
  );
}
