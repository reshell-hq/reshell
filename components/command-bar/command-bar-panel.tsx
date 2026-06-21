"use client";

import type { KeyboardEvent } from "react";
import { defaultFaviconUrl } from "@/lib/link-display/link-display";
import type { CommandBarResult } from "@/lib/command-bar/command-bar";

type CommandBarPanelProps = {
  query: string;
  mode: "default" | "action";
  results: CommandBarResult[];
  selectedIndex: number;
  /** Workspace text colour, so rows read on any themed panel surface. */
  textColor: string;
  onQueryChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onHoverRow: (index: number) => void;
  onActivateRow: (result: CommandBarResult) => void;
};

const ROW_BASE =
  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-black/5 data-[selected]:bg-black/10 dark:hover:bg-white/10 dark:data-[selected]:bg-white/15";

/**
 * Presentational command bar (CONTEXT: "Command bar") for the bottom-rim
 * `Shell.Slot`. Input sits at the bottom and results stack upward
 * (`flex-col-reverse`), so the notch grows upward as matches arrive — the same
 * composition as the prototype `SearchSlot`. Rendered in two places by
 * `Shell.Slot` (offscreen measurer + portal), so it stays stateless: query,
 * mode, and selection are owned by the parent and arrive as props.
 */
export function CommandBarPanel({
  query,
  mode,
  results,
  selectedIndex,
  textColor,
  onQueryChange,
  onKeyDown,
  onHoverRow,
  onActivateRow,
}: CommandBarPanelProps) {
  const showResults = mode === "action" || query.trim() !== "";

  return (
    <div
      className="flex w-96 flex-col-reverse gap-2 p-3"
      style={{ color: textColor }}
    >
      <input
        data-command-bar-input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Command bar"
        placeholder="Search links and workspaces, or type : for actions…"
        className="w-full shrink-0 rounded-md border border-black/15 bg-white/80 px-3 py-2 text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-black/30 dark:border-white/15 dark:bg-zinc-950/70 dark:text-zinc-50"
      />

      {!showResults ? null : mode === "action" ? (
        <p className="px-2 py-1 text-sm opacity-60" role="status">
          Action mode — no actions available yet.
        </p>
      ) : results.length === 0 ? (
        <p className="px-2 py-1 text-sm opacity-60" role="status">
          No matches
        </p>
      ) : (
        <ul
          className="max-h-72 space-y-0.5 overflow-y-auto"
          role="listbox"
          aria-label="Command bar results"
        >
          {results.map((result, index) => {
            const selected = index === selectedIndex;
            const key =
              result.kind === "link"
                ? `link:${result.linkId}`
                : result.kind === "workspace"
                  ? `workspace:${result.workspaceId}`
                  : `action:${result.actionId}`;

            return (
              <li key={key} role="option" aria-selected={selected}>
                {result.kind === "link" ? (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ROW_BASE}
                    data-selected={selected ? "" : undefined}
                    onPointerEnter={() => onHoverRow(index)}
                  >
                    <img
                      src={defaultFaviconUrl(result.url)}
                      alt=""
                      className="h-4 w-4 shrink-0 rounded-sm"
                    />
                    <span className="truncate">{result.title}</span>
                    {result.source === "catalog" ? (
                      <span className="ml-auto shrink-0 text-xs opacity-50">
                        catalog
                      </span>
                    ) : null}
                  </a>
                ) : result.kind === "workspace" ? (
                  <button
                    type="button"
                    className={ROW_BASE}
                    data-selected={selected ? "" : undefined}
                    onPointerEnter={() => onHoverRow(index)}
                    onClick={() => onActivateRow(result)}
                  >
                    <span aria-hidden className="shrink-0 opacity-60">
                      ⇆
                    </span>
                    <span className="truncate">Switch to {result.name}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={ROW_BASE}
                    data-selected={selected ? "" : undefined}
                    onPointerEnter={() => onHoverRow(index)}
                    onClick={() => onActivateRow(result)}
                  >
                    <span className="truncate">{result.label}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
