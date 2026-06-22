/**
 * Command-bar input classifier (CONTEXT: "Command bar"). Pure, zero React/DOM
 * (ADR-0009). A leading `:` or `>` switches the bar to verb mode (start timer,
 * switch scene, …); anything else is nav mode (fuzzy-find workspaces +
 * bookmarks). The prefix is stripped so the rest is the searchable query.
 */

export type CommandMode = "nav" | "verb";

export type ParsedQuery = {
  mode: CommandMode;
  /** The query with any verb prefix removed (leading whitespace trimmed). */
  query: string;
};

const VERB_PREFIXES = [":", ">"] as const;

export function parseQuery(input: string): ParsedQuery {
  if (VERB_PREFIXES.some((prefix) => input.startsWith(prefix))) {
    return { mode: "verb", query: input.slice(1).replace(/^\s+/, "") };
  }
  return { mode: "nav", query: input };
}
