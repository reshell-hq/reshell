"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Shell } from "@/components/shell";
import { useShell } from "@/components/shell/shell-context";
import {
  buildCommandBarRows,
  initialCommandBarSelection,
  isCommandBarActionMode,
  moveCommandBarSelection,
  resolveCommandBarListNavigation,
  shortcutMatchesEvent,
  shouldHandleTypeToFocus,
  type CommandBarResult,
} from "@/lib/command-bar/command-bar";
import type { Library } from "@/lib/library/types";
import { CommandBarPanel } from "./command-bar-panel";

const COMMAND_BAR_SLOT_ID = "command-bar";

type CommandBarProps = {
  library: Library;
  /** Workspace text colour, so rows read on the themed panel surface. */
  textColor: string;
};

/**
 * The command bar (CONTEXT: "Command bar") as a bottom-rim `Shell.Slot`. State
 * lives here (above the slot) because `Shell.Slot` renders its children twice —
 * an offscreen measurer and the visible portal — so the panel must be stateless.
 *
 * Default mode fuzzy-finds workspace switches first, then links; `Enter` opens
 * the selected link in a new tab. Action mode (`:` prefix) shows an empty state
 * (actions land in issue 12). Type-to-focus and the focus shortcut open and
 * focus the bar from a document-level key listener.
 */
export function CommandBar({ library, textColor }: CommandBarProps) {
  const { focusOpen, closeActive, activeSlotId, overlayElement } = useShell();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const mode = isCommandBarActionMode(query) ? "action" : "default";
  const results = useMemo(
    () => buildCommandBarRows(library, query),
    [library, query],
  );

  // Highlight the top row whenever the result set changes (top-result-first UX).
  // Reset during render (React's recommended pattern) rather than in an effect:
  // `results` is memoised, so this only fires when the query/library change.
  const [trackedResults, setTrackedResults] = useState(results);
  if (trackedResults !== results) {
    setTrackedResults(results);
    setSelectedIndex(initialCommandBarSelection(results.length));
  }

  // After a keyboard open, focus the *visible* input. Scoping the query to the
  // overlay avoids the offscreen measurer copy (which lives outside the portal).
  const requestFocusRef = useRef(false);
  useEffect(() => {
    if (
      activeSlotId !== COMMAND_BAR_SLOT_ID ||
      !requestFocusRef.current ||
      !overlayElement
    ) {
      return;
    }
    const input = overlayElement.querySelector<HTMLInputElement>(
      "input[data-command-bar-input]",
    );
    if (input) {
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
      requestFocusRef.current = false;
    }
  }, [activeSlotId, overlayElement, query]);

  const openAndFocus = useCallback(
    (char?: string) => {
      if (char) {
        setQuery((current) => current + char);
      }
      requestFocusRef.current = true;
      focusOpen(COMMAND_BAR_SLOT_ID);
    },
    [focusOpen],
  );

  const executeResult = useCallback((result: CommandBarResult) => {
    if (result.kind === "link") {
      window.open(result.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (result.kind === "workspace") {
      // STUB (issue 06): workspace switching is wired in the next slice. Leave
      // selection as a no-op here so the row reads as selectable without
      // changing the active workspace yet.
      return;
    }
    // Action results are empty until issue 12; nothing to execute.
  }, []);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      const direction = resolveCommandBarListNavigation(
        event.key,
        event.shiftKey,
      );
      if (direction) {
        event.preventDefault();
        setSelectedIndex((current) =>
          moveCommandBarSelection(current, direction, results.length),
        );
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          executeResult(selected);
        }
        return;
      }

      if (event.key === "Escape") {
        // Escape clears the query first, then dismisses. Stop propagation so the
        // portal's own Escape-to-close handler doesn't dismiss on the first press.
        event.preventDefault();
        event.stopPropagation();
        if (query !== "") {
          setQuery("");
          return;
        }
        event.currentTarget.blur();
        closeActive();
      }
    },
    [results, selectedIndex, query, executeResult, closeActive],
  );

  // Type-to-focus + focus shortcut (CONTEXT: "Command bar"). A printable key on
  // the focused tab opens/focuses the bar and inserts the char, unless focus is
  // already in a text field; the library's focus shortcut opens it directly.
  const shortcut = library.shortcuts.focusCommandBar;
  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (shortcutMatchesEvent(event, shortcut)) {
        event.preventDefault();
        openAndFocus();
        return;
      }
      if (
        shouldHandleTypeToFocus({
          event,
          activeElement: document.activeElement,
        })
      ) {
        event.preventDefault();
        openAndFocus(event.key);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [shortcut, openAndFocus]);

  return (
    <Shell.Edge side="bottom">
      <Shell.Slot id={COMMAND_BAR_SLOT_ID}>
        <CommandBarPanel
          query={query}
          mode={mode}
          results={results}
          selectedIndex={selectedIndex}
          textColor={textColor}
          onQueryChange={setQuery}
          onKeyDown={handleInputKeyDown}
          onHoverRow={setSelectedIndex}
          onActivateRow={executeResult}
        />
      </Shell.Slot>
    </Shell.Edge>
  );
}
