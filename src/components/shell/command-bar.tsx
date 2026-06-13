"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildCommandBarRows,
  initialCommandBarSelection,
  isTextEntryElement,
  moveCommandBarSelection,
  resolveCommandBarListNavigation,
  shouldHandleTypeToFocus,
  shortcutMatchesEvent,
  type CommandBarResult,
} from "@/command-bar/command-bar";
import { commandBarActionRegistry } from "@/editions/command-bar-action-registry";
import { useResetLibrary } from "@/hooks/use-library";
import type { Library } from "@/library/types";
import { cycleActiveWorkspace } from "@/workspace/workspaces";
import { BUILTIN_SURFACE } from "@/shell-frame/rim";
import { getLatestShellZones } from "@/shell-frame/shell-state";
import { activateZone } from "@/shell-frame/shell-zones";
import { useConfigStore } from "@/store/config-store";
import { useLauncherStore } from "@/store/launcher-store";

type CommandBarProps = {
  library: Library;
  onSwitchWorkspace: (workspaceId: string) => void;
  variant?: "canvas" | "pocket";
  onFocusChange?: (focused: boolean) => void;
  onContentChange?: () => void;
};

function resultKey(result: CommandBarResult | undefined): string {
  if (!result) {
    return "none";
  }
  if (result.kind === "workspace") {
    return result.workspaceId;
  }
  if (result.kind === "link") {
    return result.linkId;
  }
  return result.actionId;
}

function clampSelection(index: number, resultCount: number): number {
  if (resultCount === 0) {
    return -1;
  }
  if (index >= 0 && index < resultCount) {
    return index;
  }
  return 0;
}

export function CommandBar({
  library,
  onSwitchWorkspace,
  variant = "canvas",
  onFocusChange,
  onContentChange,
}: CommandBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onContentChangeRef = useRef(onContentChange);
  onContentChangeRef.current = onContentChange;
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const resetLibraryMutation = useResetLibrary();
  const openSettings = useConfigStore((state) => state.openSettings);

  const results = useMemo(() => buildCommandBarRows(library, query), [library, query]);

  const trimmedQuery = query.trim();
  const showResults = trimmedQuery.length > 0 && results.length > 0;
  const isPocket = variant === "pocket";
  const highlightedIndex = clampSelection(selectedIndex, results.length);
  const highlightedResult = highlightedIndex >= 0 ? results[highlightedIndex] : undefined;

  useEffect(() => {
    setSelectedIndex(initialCommandBarSelection(results.length));
  }, [results]);

  useEffect(() => {
    onContentChangeRef.current?.();
  }, [showResults, results.length]);

  useEffect(() => {
    function handleFocusShortcut(event: KeyboardEvent) {
      if (!shortcutMatchesEvent(event, library.shortcuts.focusCommandBar)) {
        return;
      }

      event.preventDefault();
      activateZone(BUILTIN_SURFACE.BOTTOM_SEARCH, getLatestShellZones());
      inputRef.current?.focus();
      inputRef.current?.select();
    }

    window.addEventListener("keydown", handleFocusShortcut);
    return () => window.removeEventListener("keydown", handleFocusShortcut);
  }, [library.shortcuts.focusCommandBar]);

  useEffect(() => {
    function handleCycleShortcut(event: KeyboardEvent) {
      if (isTextEntryElement(document.activeElement)) {
        return;
      }
      if (!shortcutMatchesEvent(event, library.shortcuts.cycleWorkspace)) {
        return;
      }

      event.preventDefault();
      const next = cycleActiveWorkspace(library, "next");
      onSwitchWorkspace(next.activeWorkspaceId);
    }

    window.addEventListener("keydown", handleCycleShortcut);
    return () => window.removeEventListener("keydown", handleCycleShortcut);
  }, [library, library.shortcuts.cycleWorkspace, onSwitchWorkspace]);

  useEffect(() => {
    function handleTypeToFocus(event: KeyboardEvent) {
      if (
        !shouldHandleTypeToFocus({
          event,
          activeElement: document.activeElement,
          overlaysOpen: useConfigStore.getState().open || useLauncherStore.getState().open,
        })
      ) {
        return;
      }

      event.preventDefault();
      activateZone(BUILTIN_SURFACE.BOTTOM_SEARCH, getLatestShellZones());
      inputRef.current?.focus();
      setQuery((current) => current + event.key);
    }

    window.addEventListener("keydown", handleTypeToFocus);
    return () => window.removeEventListener("keydown", handleTypeToFocus);
  }, []);

  function executeResult(result: CommandBarResult) {
    if (result.kind === "workspace") {
      onSwitchWorkspace(result.workspaceId);
      setQuery("");
      return;
    }

    if (result.kind === "action") {
      if (result.actionId === "settings") {
        openSettings();
        setQuery("");
        return;
      }
      if (result.actionId === "reset") {
        const confirmed = window.confirm(
          "Reset the library to the starter template? This wipes your local library and cannot be undone without a snapshot backup.",
        );
        if (confirmed) {
          resetLibraryMutation.mutate();
          setQuery("");
        }
        return;
      }

      const registered = commandBarActionRegistry.get(result.actionId);
      if (registered) {
        registered.run();
        setQuery("");
      }
      return;
    }

    window.open(result.url, "_blank", "noopener,noreferrer");
    setQuery("");
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (trimmedQuery.length > 0) {
        setQuery("");
        return;
      }
      event.currentTarget.blur();
      return;
    }

    const direction = resolveCommandBarListNavigation(event.key, event.shiftKey);
    if (direction) {
      event.preventDefault();
      if (trimmedQuery.length === 0) {
        const next = cycleActiveWorkspace(library, direction === "down" ? "next" : "previous");
        onSwitchWorkspace(next.activeWorkspaceId);
        return;
      }

      if (!showResults) {
        return;
      }

      setSelectedIndex((current) => moveCommandBarSelection(current, direction, results.length));
      return;
    }

    if (!showResults) {
      return;
    }

    if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      const result = results[highlightedIndex];
      if (result) {
        executeResult(result);
      }
    }
  }

  function renderResultRow(
    result: CommandBarResult,
    index: number,
    selected: number,
    pocketRow: boolean,
  ) {
    const isSelected = index === selected;
    const id = `command-bar-result-${resultKey(result)}`;
    const rowClass = pocketRow
      ? `shell-search-result${isSelected ? " selected" : ""}`
      : `flex w-full items-center justify-between rounded-[var(--qs-border-radius)] px-3 py-2 text-left text-sm ${
          isSelected
            ? "bg-[color:var(--qs-color-accent)]/15 ring-1 ring-[color:var(--qs-color-accent)]/40"
            : "hover:bg-black/5"
        }`;

    const preventBlur = pocketRow ? (event: React.MouseEvent) => event.preventDefault() : undefined;

    if (result.kind === "workspace") {
      return (
        <button
          type="button"
          id={id}
          role="option"
          aria-selected={isSelected}
          className={rowClass}
          onMouseDown={preventBlur}
          onMouseEnter={() => setSelectedIndex(index)}
          onClick={() => executeResult(result)}
        >
          <span>Switch to {result.name}</span>
          <span className="shell-search-result-meta">workspace</span>
        </button>
      );
    }

    if (result.kind === "action") {
      return (
        <button
          type="button"
          id={id}
          role="option"
          aria-selected={isSelected}
          className={rowClass}
          onMouseDown={preventBlur}
          onMouseEnter={() => setSelectedIndex(index)}
          onClick={() => executeResult(result)}
        >
          <span>{result.label}</span>
          <span className="shell-search-result-meta">action</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        id={id}
        role="option"
        aria-selected={isSelected}
        className={rowClass}
        onMouseDown={preventBlur}
        onMouseEnter={() => setSelectedIndex(index)}
        onClick={() => executeResult(result)}
      >
        <span>{result.title}</span>
        <span className="shell-search-result-meta">
          {result.source === "workspace" ? "placed" : "catalog"}
        </span>
      </button>
    );
  }

  if (isPocket) {
    return (
      <div className="shell-search-pocket">
        {showResults ? (
          <ul id="command-bar-results" role="listbox" className="shell-search-results">
            {results.map((result, index) => (
              <li key={resultKey(result)}>
                {renderResultRow(result, index, highlightedIndex, true)}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="shell-search-pill">
          <span className="shell-search-pill-icon" aria-hidden>
            ⌕
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={() => onFocusChange?.(true)}
            onBlur={() => onFocusChange?.(false)}
            placeholder="Search links…"
            aria-label="Command bar"
            aria-expanded={showResults}
            aria-controls="command-bar-results"
            aria-activedescendant={
              highlightedResult ? `command-bar-result-${resultKey(highlightedResult)}` : undefined
            }
            role="combobox"
            aria-autocomplete="list"
            className="shell-search-input"
          />
          {trimmedQuery.length > 0 ? (
            <button
              type="button"
              className="shell-search-clear"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              ×
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md">
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleInputKeyDown}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        placeholder="Search links… (: for actions)"
        aria-label="Command bar"
        aria-expanded={showResults}
        aria-controls="command-bar-results"
        aria-activedescendant={
          highlightedResult ? `command-bar-result-${resultKey(highlightedResult)}` : undefined
        }
        role="combobox"
        aria-autocomplete="list"
        className="w-full rounded-[var(--qs-border-radius)] border border-white/20 bg-[color:var(--qs-color-surface)]/80 px-4 py-2.5 text-sm text-[color:var(--qs-color-text)] shadow-sm backdrop-blur-sm outline-none ring-[color:var(--qs-color-accent)] focus:ring-2"
      />

      {showResults ? (
        <ul
          id="command-bar-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-[var(--qs-border-radius)] border border-white/20 bg-[color:var(--qs-color-surface)]/95 p-1 shadow-lg backdrop-blur-md"
        >
          {results.map((result, index) => (
            <li key={resultKey(result)}>
              {renderResultRow(result, index, highlightedIndex, false)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
