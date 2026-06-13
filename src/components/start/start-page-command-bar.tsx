"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  initialCommandBarSelection,
  isTextEntryElement,
  moveCommandBarSelection,
  resolveCommandBarListNavigation,
  shouldCaptureTypeToFocusKey,
} from "@/command-bar/command-bar";
import type { Library } from "@/library/types";
import { buildStartPageSearchResults, type StartPageSearchResult } from "@/start/start-page-search";
import {
  focusStartPageCommandBar,
  scheduleStartPageCommandBarFocus,
} from "@/start/start-page-command-bar-focus";

type StartPageCommandBarProps = {
  library: Library | null;
  placeholder: string;
  autoFocus?: boolean;
};

function clampSelection(index: number, resultCount: number): number {
  if (resultCount === 0) {
    return -1;
  }
  if (index >= 0 && index < resultCount) {
    return index;
  }
  return 0;
}

function openStartPageLink(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function StartPageCommandBar({
  library,
  placeholder,
  autoFocus = true,
}: StartPageCommandBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const results = useMemo(() => {
    if (!library) {
      return [];
    }
    return buildStartPageSearchResults(library, query);
  }, [library, query]);

  const trimmedQuery = query.trim();
  const showResults = trimmedQuery.length > 0 && results.length > 0;
  const highlightedIndex = clampSelection(selectedIndex, results.length);
  const highlightedResult = highlightedIndex >= 0 ? results[highlightedIndex] : undefined;

  useEffect(() => {
    setSelectedIndex(initialCommandBarSelection(results.length));
  }, [results]);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    focusStartPageCommandBar(inputRef.current);
    const cancelScheduledFocus = scheduleStartPageCommandBarFocus(inputRef.current);

    function handleWindowFocus() {
      scheduleStartPageCommandBarFocus(inputRef.current);
    }

    function handlePageShow() {
      scheduleStartPageCommandBarFocus(inputRef.current);
    }

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      cancelScheduledFocus();
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [autoFocus]);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    function handleTypeToFocus(event: KeyboardEvent) {
      if (!shouldCaptureTypeToFocusKey(event)) {
        return;
      }
      if (
        isTextEntryElement(document.activeElement) &&
        document.activeElement !== inputRef.current
      ) {
        return;
      }

      event.preventDefault();
      focusStartPageCommandBar(inputRef.current);
      setQuery((current) => current + event.key);
    }

    window.addEventListener("keydown", handleTypeToFocus);
    return () => window.removeEventListener("keydown", handleTypeToFocus);
  }, [autoFocus]);

  function executeResult(result: StartPageSearchResult) {
    openStartPageLink(result.url);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const navigation = resolveCommandBarListNavigation(event.key, event.shiftKey);
    if (navigation) {
      event.preventDefault();
      setSelectedIndex((current) => moveCommandBarSelection(current, navigation, results.length));
      return;
    }

    if (event.key === "Enter" && highlightedResult) {
      event.preventDefault();
      executeResult(highlightedResult);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setQuery("");
      focusStartPageCommandBar(inputRef.current);
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <input
        ref={inputRef}
        type="search"
        name="reshell-start-command"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        aria-label="Command bar"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        aria-expanded={showResults}
        aria-controls="start-page-results"
        aria-activedescendant={
          highlightedResult ? `start-page-result-${highlightedResult.linkId}` : undefined
        }
        role="combobox"
        aria-autocomplete="list"
        className="w-full rounded-[var(--qs-border-radius)] border border-white/20 bg-[color:var(--qs-color-surface)]/80 px-4 py-2.5 text-sm text-[color:var(--qs-color-text)] shadow-sm backdrop-blur-sm outline-none ring-[color:var(--qs-color-accent)] focus:ring-2"
      />

      {showResults ? (
        <ul
          id="start-page-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-[var(--qs-border-radius)] border border-white/20 bg-[color:var(--qs-color-surface)]/95 p-1 shadow-lg backdrop-blur-md"
        >
          {results.map((result, index) => {
            const isSelected = index === highlightedIndex;
            return (
              <li key={result.linkId}>
                <button
                  id={`start-page-result-${result.linkId}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={
                    isSelected
                      ? "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm bg-[color:var(--qs-color-accent)]/15 ring-1 ring-[color:var(--qs-color-accent)]/40"
                      : "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-white/10"
                  }
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => executeResult(result)}
                >
                  <span>{result.title}</span>
                  <span className="text-xs opacity-60">{result.source}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
