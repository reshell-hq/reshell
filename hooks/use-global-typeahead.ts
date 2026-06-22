"use client";

import { useEffect, useRef } from "react";

/**
 * Type-to-open for the command bar (CONTEXT: "Command bar"): a bare printable
 * keystroke — no field focused, no ⌘/Ctrl/Alt — opens the bar seeded with that
 * character. Standalone and app-decoupled (ADR-0009): it knows nothing about
 * the shell or `app/`; the caller supplies `onType`, which seeds the query and
 * opens/focuses the bar.
 *
 * The focus guard must be airtight (plan 010 STOP condition): keystrokes while
 * an input/textarea/select/contenteditable is focused, IME composition, and
 * modifier combos are all left alone, so the bar never hijacks real typing
 * (its own input included — once focused, keys land there) or the cycle/Escape
 * bindings (Tab/Escape/arrows are multi-char keys and never match).
 */
export function useGlobalTypeahead(onType: (char: string) => void): void {
  const onTypeRef = useRef(onType);
  useEffect(() => {
    onTypeRef.current = onType;
  }, [onType]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      // A single printable character: Tab/Escape/Enter/Arrow* are all multi-char
      // `key` values and so are deliberately excluded (Shift is allowed).
      if (event.key.length !== 1) {
        return;
      }
      // Guard both the event target and the document's active element so a
      // focused field always wins, however the event was dispatched.
      if (isEditable(event.target) || isEditable(document.activeElement)) {
        return;
      }
      event.preventDefault();
      onTypeRef.current(event.key);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}

function isEditable(node: EventTarget | null): boolean {
  if (!(node instanceof HTMLElement)) {
    return false;
  }
  const tag = node.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    node.isContentEditable
  );
}
