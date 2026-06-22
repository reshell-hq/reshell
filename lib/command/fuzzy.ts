/**
 * Tiny subsequence fuzzy ranker (CONTEXT: "Command bar"). Pure, zero React/DOM
 * (ADR-0009) and reused by any future palette UI. A query matches an entry when
 * its characters appear in order (not necessarily contiguously) within the
 * entry's label or one of its keywords; the score rewards contiguous runs and
 * word-start hits so "gh" ranks "GitHub" above "Insight".
 *
 * ponytail: this is a deliberately minimal heuristic — no tokenisation, no
 * frequency/recency weighting, no typo tolerance. It is enough for a few dozen
 * workspaces + bookmarks. Upgrade path: if the index grows large or users want
 * typo tolerance, swap `score` for a real matcher (Fzf/Fuse) behind this same
 * `rank(query, entries)` signature — callers never see the algorithm.
 */

/** Anything rankable: matched against its label and optional keywords. */
export type Rankable = {
  label: string;
  keywords?: string[];
};

const CONTIGUOUS_BONUS = 4;
const WORD_START_BONUS = 3;
const LEADING_BONUS = 5;

/**
 * Score `query` against a single `text`, or `null` when `query` is not a
 * subsequence of `text`. Higher is better; shorter haystacks win ties.
 */
export function score(query: string, text: string): number | null {
  const needle = query.trim().toLowerCase();
  if (needle === "") {
    return 0;
  }

  const haystack = text.toLowerCase();
  let needleIndex = 0;
  let total = 0;
  let prevMatch = -2;

  for (let i = 0; i < haystack.length && needleIndex < needle.length; i++) {
    if (haystack[i] !== needle[needleIndex]) {
      continue;
    }
    let points = 1;
    if (i === prevMatch + 1) {
      points += CONTIGUOUS_BONUS;
    }
    if (i === 0) {
      points += LEADING_BONUS;
    } else if (!isWordChar(haystack[i - 1])) {
      points += WORD_START_BONUS;
    }
    total += points;
    prevMatch = i;
    needleIndex++;
  }

  if (needleIndex < needle.length) {
    return null;
  }
  // Tie-break toward shorter labels (a tiny, length-proportional penalty).
  return total - haystack.length * 0.01;
}

function isWordChar(char: string): boolean {
  return /[a-z0-9]/.test(char);
}

/** Best score for an entry across its label and keywords, or `null`. */
function bestScore(query: string, entry: Rankable): number | null {
  let best: number | null = null;
  for (const text of [entry.label, ...(entry.keywords ?? [])]) {
    const candidate = score(query, text);
    if (candidate !== null && (best === null || candidate > best)) {
      best = candidate;
    }
  }
  return best;
}

/**
 * Entries that match `query`, sorted best-first (stable for ties). An empty
 * query returns every entry in its original order — the command bar's sensible
 * default set, since the index is already arranged most-likely-first.
 */
export function rank<T extends Rankable>(query: string, entries: T[]): T[] {
  if (query.trim() === "") {
    return entries.slice();
  }

  return entries
    .map((entry, index) => ({ entry, index, value: bestScore(query, entry) }))
    .filter((scored) => scored.value !== null)
    .sort((a, b) => b.value! - a.value! || a.index - b.index)
    .map((scored) => scored.entry);
}
