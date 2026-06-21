import type { Theme } from "@/lib/theme/types";
import type { FractionalOrderKey } from "@/lib/fractional-order/fractional-order";
import type { WorkspaceInternalTools } from "@/lib/internal-tools/types";

/**
 * The library data model (CONTEXT: "Library") — a single user's complete
 * Reshell dataset, persisted in IndexedDB. This is the slice ported so far:
 * catalog, workspaces, themes, edge-group placements, and per-workspace internal
 * tools (issue 07). Canvas widgets, focus radio, and ICS feed attach in their
 * own rewrite slices (issues 09/10/11).
 */

/** A single bookmark (CONTEXT: "Link"). The atomic unit of the library. */
export type Link = {
  id: string;
  url: string;
  title?: string;
  image?: string;
};

/** A catalog link placed within an edge group, carrying its order key. */
export type EdgeGroupLinkPlacement = {
  linkId: string;
  orderKey: FractionalOrderKey;
};

/** A named cluster of links attached to one edge (CONTEXT: "Edge group"). */
export type EdgeGroup = {
  id: string;
  name: string;
  handleIcon?: string;
  orderKey: FractionalOrderKey;
  links: EdgeGroupLinkPlacement[];
};

/** Edge groups per rim. The right rim hosts internal tools, not edge groups. */
export type EdgePlacements = {
  left: EdgeGroup[];
  top: EdgeGroup[];
  bottom: EdgeGroup[];
};

export type WorkspacePlacements = {
  edges: EdgePlacements;
};

/** A named shell context (CONTEXT: "Workspace"). One is active at a time. */
export type Workspace = {
  id: string;
  name: string;
  theme: Theme;
  placements: WorkspacePlacements;
  /**
   * Per-workspace internal-tools state — pomodoro timer + focus tasks (CONTEXT:
   * "Internal tool"). Seeded by the starter template; optional so a library
   * saved before this field still loads (resolved via
   * `resolveWorkspaceInternalTools`).
   */
  internalTools?: WorkspaceInternalTools;
};

export type ShortcutBindings = {
  focusCommandBar: string;
  cycleWorkspace: string;
};

export type Library = {
  schemaVersion: number;
  catalog: Link[];
  workspaces: Workspace[];
  shortcuts: ShortcutBindings;
  activeWorkspaceId: string;
  /** Shown in the canvas welcome widget; not the workspace name. */
  displayName?: string;
};

/** Where edge groups can live on a workspace's rims. */
export type EdgePosition = "left" | "top" | "bottom";

/**
 * Persistence boundary for the library. Injected via context (ADR 0017): the
 * Personal edition defaults to IndexedDB; demo/tests inject an in-memory store;
 * Standard can inject a cloud-backed one. No global factory.
 */
export type LibraryStore = {
  read(): Promise<Library | null>;
  write(library: Library): Promise<void>;
};
