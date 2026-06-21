import { resolveLinkTitle } from "@/lib/link-display/link-display";
import type { Library } from "@/lib/library/types";
import { searchLinks, searchWorkspaces } from "./search";

/**
 * Command-bar result model and keyboard logic (CONTEXT: "Command bar"). Pure,
 * UI-free helpers ported from the pre-rewrite `src/command-bar` (ADR 0017) and
 * adapted to the reduced `@/lib` model — no edition registries, no demo-mode
 * factory. The two modes are still distinguished by the `:` prefix; default
 * mode ranks workspace switches before links.
 */

/** Selecting a workspace row switches the active workspace (wired in issue 06). */
export type CommandBarWorkspaceResult = {
  kind: "workspace";
  workspaceId: string;
  name: string;
};

/** Selecting a link row opens its URL in a new tab. */
export type CommandBarLinkResult = {
  kind: "link";
  linkId: string;
  url: string;
  title: string;
  source: "workspace" | "catalog";
};

/** A `:`-prefixed shell action (CONTEXT: "Command bar action"). */
export type CommandBarActionResult = {
  kind: "action";
  actionId: string;
  label: string;
};

export type CommandBarResult =
  | CommandBarWorkspaceResult
  | CommandBarLinkResult
  | CommandBarActionResult;

/** Action mode: a leading `:` switches the command bar to actions-only. */
export function isCommandBarActionMode(query: string): boolean {
  return query.startsWith(":");
}

/**
 * Action-mode results. Empty until command-bar actions land (issue 12); the
 * mode toggle + empty state ship in this slice so the UI seam exists. When
 * actions arrive they will be filtered here by the text after the `:` prefix.
 */
export function buildCommandBarActionResults(
  _query: string,
): CommandBarActionResult[] {
  return [];
}

/** Default-mode results: workspace switches first, then links. */
export function buildCommandBarResults(
  library: Library,
  query: string,
): CommandBarResult[] {
  const workspaceResults: CommandBarWorkspaceResult[] = searchWorkspaces(
    library,
    query,
  ).map((workspace) => ({
    kind: "workspace",
    workspaceId: workspace.id,
    name: workspace.name,
  }));

  const linkResults: CommandBarLinkResult[] = searchLinks(library, query).map(
    ({ link, source }) => ({
      kind: "link",
      linkId: link.id,
      url: link.url,
      title: resolveLinkTitle(link),
      source,
    }),
  );

  return [...workspaceResults, ...linkResults];
}

/** Resolve the rows for the current query, picking the mode by `:` prefix. */
export function buildCommandBarRows(
  library: Library,
  query: string,
): CommandBarResult[] {
  if (isCommandBarActionMode(query)) {
    return buildCommandBarActionResults(query);
  }

  return buildCommandBarResults(library, query);
}

/** First row is highlighted when there are results; otherwise nothing is. */
export function initialCommandBarSelection(resultCount: number): number {
  return resultCount > 0 ? 0 : -1;
}

/** Wrap selection up/down through the result list. */
export function moveCommandBarSelection(
  currentIndex: number,
  direction: "up" | "down",
  resultCount: number,
): number {
  if (resultCount === 0) {
    return -1;
  }

  if (direction === "down") {
    return (currentIndex + 1) % resultCount;
  }

  return (currentIndex - 1 + resultCount) % resultCount;
}

/**
 * Map a keydown to a selection move. `↑`/`↓` and `Tab`/`Shift+Tab` move the
 * highlight; `j`/`k` deliberately do NOT (they type into the query).
 */
export function resolveCommandBarListNavigation(
  key: string,
  shiftKey: boolean,
): "up" | "down" | null {
  if (key === "ArrowDown") {
    return "down";
  }
  if (key === "ArrowUp") {
    return "up";
  }
  if (key === "Tab") {
    return shiftKey ? "up" : "down";
  }
  return null;
}

/** A printable key with no command/control/alt modifier (Shift is allowed). */
export function shouldCaptureTypeToFocusKey(
  event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey">,
): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }
  return event.key.length === 1;
}

/** An input, textarea, or contenteditable — type-to-focus must not steal it. */
export function isTextEntryElement(element: Element | null): boolean {
  if (!element) {
    return false;
  }
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return true;
  }
  return element instanceof HTMLElement && element.isContentEditable;
}

/**
 * Type-to-focus gate (CONTEXT: "Command bar" → type-to-focus): a printable key
 * pressed while the Reshell tab is focused opens/focuses the command bar and
 * inserts the character — UNLESS focus is already in a text field.
 */
export function shouldHandleTypeToFocus(options: {
  event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey">;
  activeElement: Element | null;
}): boolean {
  if (!shouldCaptureTypeToFocusKey(options.event)) {
    return false;
  }
  if (isTextEntryElement(options.activeElement)) {
    return false;
  }
  return true;
}

const SHORTCUT_ALIASES: Record<string, string> = {
  Ctrl: "Control",
  Command: "Meta",
  Cmd: "Meta",
  Option: "Alt",
};

function normalizeShortcutPart(part: string): string {
  return SHORTCUT_ALIASES[part] ?? part;
}

/** Match a library shortcut binding like `Meta+Shift+k` against a keydown. */
export function shortcutMatchesEvent(
  event: Pick<
    KeyboardEvent,
    "key" | "metaKey" | "shiftKey" | "ctrlKey" | "altKey"
  >,
  binding: string,
): boolean {
  const parts = binding
    .split("+")
    .map((part) => normalizeShortcutPart(part.trim()));
  const keyPart = parts.at(-1)!.toLowerCase();
  const modifiers = new Set(parts.slice(0, -1));

  return (
    event.key.toLowerCase() === keyPart &&
    event.metaKey === modifiers.has("Meta") &&
    event.shiftKey === modifiers.has("Shift") &&
    event.ctrlKey === modifiers.has("Control") &&
    event.altKey === modifiers.has("Alt")
  );
}
