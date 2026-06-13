import { parse, stringify } from "yaml";
import { createDefaultCanvasWidgets } from "@/canvas-widgets/config";
import { createDefaultFocusRadio } from "@/focus-radio/config";
import type { FocusRadio } from "@/focus-radio/types";
import { ensureWorkspaceInternalTools } from "@/internal-tools/defaults";
import { createDefaultWorkspaceInternalTools } from "@/internal-tools/pomodoro";
import type { WorkspaceInternalTools } from "@/internal-tools/types";
import { rebalanceKeys, sortByKey } from "@/fractional-order/fractional-order";
import { validateLibrary } from "@/library/library";
import { normalizeWorkspacePlacements } from "@/library/migrate-placements";
import type {
  EdgeGroup,
  EdgeGroupLinkPlacement,
  Library,
  Link,
  ShortcutBindings,
  Theme,
  Workspace,
} from "@/library/types";
import { LIBRARY_SCHEMA_VERSION } from "@/library/schema";
import { resolveTheme } from "@/theme/theme-defaults";
import { DEFAULT_WORKSPACE_THEME } from "@/workspace/workspaces";
import type { CanvasWidgetConfig } from "@/canvas-widgets/types";

export const SNAPSHOT_VERSION = 2;

const DEFAULT_SHORTCUTS: ShortcutBindings = {
  focusCommandBar: "Meta+Shift+k",
  cycleWorkspace: "Control+Tab",
};

type SnapshotLinkPlacement = {
  id: string;
  order: string;
};

type SnapshotEdgeGroup = {
  id: string;
  name: string;
  icon?: string;
  order: string;
  linkIds: SnapshotLinkPlacement[];
};

type SnapshotPin =
  | {
      linkId: string;
      position: "strip";
      order: string;
    }
  | {
      linkId: string;
      position: { x: number; y: number };
    };

type SnapshotWorkspace = {
  id: string;
  name: string;
  theme: Theme;
  placements: {
    edgeGroups: {
      left: SnapshotEdgeGroup[];
      top: SnapshotEdgeGroup[];
      bottom: SnapshotEdgeGroup[];
    };
    pins?: SnapshotPin[];
  };
  internalTools?: WorkspaceInternalTools;
  canvasWidgets?: CanvasWidgetConfig;
  canvasNowPlayingDismissed?: boolean;
  icsFeedUrl?: string;
};

export type LibrarySnapshot = {
  version: 1 | typeof SNAPSHOT_VERSION;
  catalog: Link[];
  workspaces: SnapshotWorkspace[];
  shortcuts: ShortcutBindings;
  focusRadio?: FocusRadio;
  activeWorkspaceId: string;
  displayName?: string;
};

type SnapshotV2BookmarkLink = {
  url: string;
  title?: string;
  image?: string;
};

type SnapshotV2Bookmark = {
  name: string;
  icon?: string;
  links: SnapshotV2BookmarkLink[];
};

type SnapshotV2HumanWorkspace = {
  id?: string;
  name: string;
  theme?: Theme;
  bookmarks: SnapshotV2Bookmark[];
  internalTools?: WorkspaceInternalTools;
  canvasWidgets?: CanvasWidgetConfig;
  canvasNowPlayingDismissed?: boolean;
  icsFeedUrl?: string;
};

export type HumanLibrarySnapshot = {
  version: typeof SNAPSHOT_VERSION;
  workspaces: SnapshotV2HumanWorkspace[];
  shortcuts?: ShortcutBindings;
  focusRadio?: FocusRadio;
  activeWorkspaceId?: string;
  displayName?: string;
};

type ParsedSnapshot =
  | { format: "machine"; snapshot: LibrarySnapshot }
  | { format: "human"; snapshot: HumanLibrarySnapshot };

function createSnapshotId(): string {
  return crypto.randomUUID();
}

function edgeGroupToSnapshot(group: EdgeGroup): SnapshotEdgeGroup {
  return {
    id: group.id,
    name: group.name,
    ...(group.handleIcon ? { icon: group.handleIcon } : {}),
    order: group.orderKey,
    linkIds: group.links.map((placement) => ({
      id: placement.linkId,
      order: placement.orderKey,
    })),
  };
}

function snapshotEdgeGroupToLibrary(group: SnapshotEdgeGroup): EdgeGroup {
  return {
    id: group.id,
    name: group.name,
    ...(group.icon ? { handleIcon: group.icon } : {}),
    orderKey: group.order,
    links: group.linkIds.map(
      (placement): EdgeGroupLinkPlacement => ({
        linkId: placement.id,
        orderKey: placement.order,
      }),
    ),
  };
}

function linkToBookmarkRow(link: Link): SnapshotV2BookmarkLink {
  return {
    url: link.url,
    ...(link.title !== undefined ? { title: link.title } : {}),
    ...(link.image !== undefined ? { image: link.image } : {}),
  };
}

function edgeGroupToBookmark(group: EdgeGroup, catalog: readonly Link[]): SnapshotV2Bookmark {
  const catalogById = new Map(catalog.map((link) => [link.id, link]));
  const links = sortByKey(group.links, (placement) => placement.orderKey).map((placement) => {
    const link = catalogById.get(placement.linkId);
    if (!link) {
      throw new Error(`Catalog link "${placement.linkId}" not found`);
    }

    return linkToBookmarkRow(link);
  });

  return {
    name: group.name,
    ...(group.handleIcon ? { icon: group.handleIcon } : {}),
    links,
  };
}

function workspaceToHumanSnapshot(workspace: Workspace, catalog: readonly Link[]): SnapshotV2HumanWorkspace {
  const bookmarks = sortByKey(workspace.placements.edges.left, (group) => group.orderKey).map(
    (group) => edgeGroupToBookmark(group, catalog),
  );

  return {
    id: workspace.id,
    name: workspace.name,
    theme: resolveTheme(workspace.theme),
    bookmarks,
    internalTools: workspace.internalTools,
    canvasWidgets: workspace.canvasWidgets,
    ...(workspace.canvasNowPlayingDismissed
      ? { canvasNowPlayingDismissed: workspace.canvasNowPlayingDismissed }
      : {}),
    ...(workspace.icsFeedUrl ? { icsFeedUrl: workspace.icsFeedUrl } : {}),
  };
}

export function libraryToSnapshot(library: Library): HumanLibrarySnapshot {
  return {
    version: SNAPSHOT_VERSION,
    workspaces: library.workspaces.map((workspace) =>
      workspaceToHumanSnapshot(workspace, library.catalog),
    ),
    shortcuts: { ...library.shortcuts },
    focusRadio: {
      stations: library.focusRadio.stations.map((station) => ({ ...station })),
      playback: { ...library.focusRadio.playback },
    },
    activeWorkspaceId: library.activeWorkspaceId,
    ...(library.displayName ? { displayName: library.displayName } : {}),
  };
}

/** Machine-format snapshot (catalog + placements) for v1 compatibility and tests. */
export function libraryToMachineSnapshot(library: Library): LibrarySnapshot {
  return {
    version: SNAPSHOT_VERSION,
    catalog: library.catalog.map((link) => ({
      id: link.id,
      url: link.url,
      ...(link.title !== undefined ? { title: link.title } : {}),
      ...(link.image !== undefined ? { image: link.image } : {}),
    })),
    workspaces: library.workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      theme: resolveTheme(workspace.theme),
      placements: {
        edgeGroups: {
          left: workspace.placements.edges.left.map(edgeGroupToSnapshot),
          top: workspace.placements.edges.top.map(edgeGroupToSnapshot),
          bottom: workspace.placements.edges.bottom.map(edgeGroupToSnapshot),
        },
      },
      internalTools: workspace.internalTools,
      canvasWidgets: workspace.canvasWidgets,
      ...(workspace.canvasNowPlayingDismissed
        ? { canvasNowPlayingDismissed: workspace.canvasNowPlayingDismissed }
        : {}),
      ...(workspace.icsFeedUrl ? { icsFeedUrl: workspace.icsFeedUrl } : {}),
    })),
    shortcuts: { ...library.shortcuts },
    focusRadio: {
      stations: library.focusRadio.stations.map((station) => ({ ...station })),
      playback: { ...library.focusRadio.playback },
    },
    activeWorkspaceId: library.activeWorkspaceId,
    ...(library.displayName ? { displayName: library.displayName } : {}),
  };
}

export function snapshotToLibrary(snapshot: LibrarySnapshot): Library {
  const library: Library = {
    schemaVersion: LIBRARY_SCHEMA_VERSION,
    catalog: snapshot.catalog.map((link) => ({
      id: link.id,
      url: link.url,
      ...(link.title !== undefined ? { title: link.title } : {}),
      ...(link.image !== undefined ? { image: link.image } : {}),
    })),
    workspaces: snapshot.workspaces.map(
      (workspace): Workspace =>
        ensureWorkspaceInternalTools({
          id: workspace.id,
          name: workspace.name,
          theme: resolveTheme({
            palette: { ...workspace.theme.palette },
            ...(workspace.theme.shellBorderColor
              ? { shellBorderColor: workspace.theme.shellBorderColor }
              : {}),
            ...(workspace.theme.backgroundUrl
              ? { backgroundUrl: workspace.theme.backgroundUrl }
              : {}),
            borderRadius: workspace.theme.borderRadius ?? 20,
            widgets: workspace.theme.widgets ?? {},
            ...(workspace.theme.appliedPresetId
              ? { appliedPresetId: workspace.theme.appliedPresetId }
              : {}),
            ...(workspace.theme.appliedThemePresetId
              ? { appliedThemePresetId: workspace.theme.appliedThemePresetId }
              : {}),
            ...(workspace.theme.appliedLayoutPresetId
              ? { appliedLayoutPresetId: workspace.theme.appliedLayoutPresetId }
              : {}),
          }),
          placements: normalizeWorkspacePlacements({
            edges: {
              left: workspace.placements.edgeGroups.left.map(snapshotEdgeGroupToLibrary),
              top: workspace.placements.edgeGroups.top.map(snapshotEdgeGroupToLibrary),
              bottom: workspace.placements.edgeGroups.bottom.map(snapshotEdgeGroupToLibrary),
            },
            pins: workspace.placements.pins,
          }),
          internalTools: workspace.internalTools ?? createDefaultWorkspaceInternalTools(),
          canvasWidgets: workspace.canvasWidgets ?? createDefaultCanvasWidgets(),
          ...(workspace.canvasNowPlayingDismissed
            ? { canvasNowPlayingDismissed: workspace.canvasNowPlayingDismissed }
            : {}),
          ...(workspace.icsFeedUrl ? { icsFeedUrl: workspace.icsFeedUrl } : {}),
        }),
    ),
    shortcuts: { ...snapshot.shortcuts },
    focusRadio: snapshot.focusRadio
      ? {
          stations: snapshot.focusRadio.stations.map((station) => ({ ...station })),
          playback: { ...snapshot.focusRadio.playback },
        }
      : createDefaultFocusRadio(),
    activeWorkspaceId: snapshot.activeWorkspaceId,
    ...(snapshot.displayName ? { displayName: snapshot.displayName } : {}),
  };

  validateLibrary(library);
  return library;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHumanSnapshotDocument(document: Record<string, unknown>): boolean {
  if (!Array.isArray(document.workspaces)) {
    return false;
  }

  return document.workspaces.some(
    (workspace) => isRecord(workspace) && Array.isArray(workspace.bookmarks),
  );
}

function parseMachineSnapshot(document: Record<string, unknown>): LibrarySnapshot {
  if (!Array.isArray(document.catalog) || !Array.isArray(document.workspaces)) {
    throw new TypeError("Snapshot is missing catalog or workspaces");
  }

  if (!isRecord(document.shortcuts) || typeof document.activeWorkspaceId !== "string") {
    throw new Error("Snapshot is missing shortcuts or activeWorkspaceId");
  }

  return document as LibrarySnapshot;
}

function parseHumanSnapshot(document: Record<string, unknown>): HumanLibrarySnapshot {
  if (!Array.isArray(document.workspaces)) {
    throw new TypeError("Snapshot is missing workspaces");
  }

  return document as HumanLibrarySnapshot;
}

function parseSnapshotDocument(document: unknown): ParsedSnapshot {
  if (!isRecord(document)) {
    throw new Error("Snapshot must be a YAML mapping");
  }

  const version = document.version;
  if (version === 1) {
    return { format: "machine", snapshot: parseMachineSnapshot(document) };
  }

  if (version === SNAPSHOT_VERSION) {
    if (isHumanSnapshotDocument(document)) {
      return { format: "human", snapshot: parseHumanSnapshot(document) };
    }
    return { format: "machine", snapshot: parseMachineSnapshot(document) };
  }

  throw new Error(`Unsupported snapshot version: ${String(version)}`);
}

function resolveWorkspaceTheme(theme: Theme | undefined): Theme {
  if (!theme) {
    return {
      ...DEFAULT_WORKSPACE_THEME,
      palette: { ...DEFAULT_WORKSPACE_THEME.palette },
    };
  }

  return resolveTheme({
    palette: { ...theme.palette },
    ...(theme.shellBorderColor ? { shellBorderColor: theme.shellBorderColor } : {}),
    ...(theme.backgroundUrl ? { backgroundUrl: theme.backgroundUrl } : {}),
    borderRadius: theme.borderRadius ?? 20,
    widgets: theme.widgets ?? {},
    ...(theme.appliedPresetId ? { appliedPresetId: theme.appliedPresetId } : {}),
    ...(theme.appliedThemePresetId ? { appliedThemePresetId: theme.appliedThemePresetId } : {}),
    ...(theme.appliedLayoutPresetId ? { appliedLayoutPresetId: theme.appliedLayoutPresetId } : {}),
  });
}

function humanSnapshotToLibrary(snapshot: HumanLibrarySnapshot): Library {
  const catalog: Link[] = [];
  const workspaces: Workspace[] = snapshot.workspaces.map((workspaceSnapshot) => {
    const workspaceId = workspaceSnapshot.id ?? createSnapshotId();
    const groupOrderKeys = rebalanceKeys(workspaceSnapshot.bookmarks.length);

    const left: EdgeGroup[] = workspaceSnapshot.bookmarks.map((bookmark, groupIndex) => {
      const linkOrderKeys = rebalanceKeys(bookmark.links.length);

      const links: EdgeGroupLinkPlacement[] = bookmark.links.map((linkSnapshot, linkIndex) => {
        const link: Link = {
          id: createSnapshotId(),
          url: linkSnapshot.url,
          ...(linkSnapshot.title !== undefined ? { title: linkSnapshot.title } : {}),
          ...(linkSnapshot.image !== undefined ? { image: linkSnapshot.image } : {}),
        };
        catalog.push(link);

        return {
          linkId: link.id,
          orderKey: linkOrderKeys[linkIndex]!,
        };
      });

      return {
        id: createSnapshotId(),
        name: bookmark.name,
        ...(bookmark.icon ? { handleIcon: bookmark.icon } : {}),
        orderKey: groupOrderKeys[groupIndex]!,
        links,
      };
    });

    return ensureWorkspaceInternalTools({
      id: workspaceId,
      name: workspaceSnapshot.name,
      theme: resolveWorkspaceTheme(workspaceSnapshot.theme),
      placements: normalizeWorkspacePlacements({
        edges: { left, top: [], bottom: [] },
      }),
      internalTools: workspaceSnapshot.internalTools ?? createDefaultWorkspaceInternalTools(),
      canvasWidgets: workspaceSnapshot.canvasWidgets ?? createDefaultCanvasWidgets(),
      ...(workspaceSnapshot.canvasNowPlayingDismissed
        ? { canvasNowPlayingDismissed: workspaceSnapshot.canvasNowPlayingDismissed }
        : {}),
      ...(workspaceSnapshot.icsFeedUrl ? { icsFeedUrl: workspaceSnapshot.icsFeedUrl } : {}),
    });
  });

  const activeWorkspaceId =
    snapshot.activeWorkspaceId &&
    workspaces.some((workspace) => workspace.id === snapshot.activeWorkspaceId)
      ? snapshot.activeWorkspaceId
      : workspaces[0]?.id;

  if (!activeWorkspaceId) {
    throw new Error("Snapshot has no workspaces");
  }

  const library: Library = {
    schemaVersion: LIBRARY_SCHEMA_VERSION,
    catalog,
    workspaces,
    shortcuts: { ...DEFAULT_SHORTCUTS, ...snapshot.shortcuts },
    focusRadio: snapshot.focusRadio
      ? {
          stations: snapshot.focusRadio.stations.map((station) => ({ ...station })),
          playback: { ...snapshot.focusRadio.playback },
        }
      : createDefaultFocusRadio(),
    activeWorkspaceId,
    ...(snapshot.displayName ? { displayName: snapshot.displayName } : {}),
  };

  validateLibrary(library);
  return library;
}

export function serializeSnapshot(library: Library): string {
  return stringify(libraryToSnapshot(library), {
    lineWidth: 0,
  });
}

export function deserializeSnapshot(yaml: string): Library {
  let document: unknown;

  try {
    document = parse(yaml);
  } catch {
    throw new Error("Snapshot is not valid YAML");
  }

  const parsed = parseSnapshotDocument(document);
  if (parsed.format === "human") {
    return humanSnapshotToLibrary(parsed.snapshot);
  }

  return snapshotToLibrary(parsed.snapshot);
}

export async function fetchSnapshotYaml(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch snapshot (${response.status})`);
  }

  return response.text();
}

export async function importSnapshotFromUrl(url: string): Promise<Library> {
  const yaml = await fetchSnapshotYaml(url);
  return deserializeSnapshot(yaml);
}
