/**
 * The tasks tool's data model (CONTEXT: "Tool"), ported from yeti-workspace's
 * `internal-tools` `FocusTask`. Pure types — zero React/DOM deps — so this is
 * part of the portable core the paid tiers import (ADR-0009).
 *
 * Tasks are runtime-only: they live in the per-workspace override (ADR-0007),
 * never in config, so a workspace "reset" wipes them by design. Plan 014's
 * focus-tasks canvas widget reads this shape — keep `FocusTask` stable.
 */

export type FocusTask = {
  id: string;
  title: string;
  /** Optional minute estimate; drives the "Start estimate" countdown. */
  estimateMinutes?: number;
  /** Today list vs the backlog. */
  today: boolean;
  completed: boolean;
  /**
   * Sort key within the task's list. ponytail: a plain integer, re-spaced or
   * swapped by `moveTask`, instead of yeti's fractional order keys — this is a
   * local single-user list, so contiguous integers are simpler and sufficient.
   * Upgrade path: fractional keys if concurrent/remote reordering ever lands.
   */
  order: number;
};
