import type { WorkspaceInternalTools } from "@/internal-tools/types";
import type { FractionalOrderKey } from "@/fractional-order/fractional-order";
import type { CanvasWidgetConfig, CanvasWidgetId } from "@/canvas-widgets/types";
import type { FocusRadio } from "@/focus-radio/types";

export type Link = {
  id: string;
  url: string;
  title?: string;
  image?: string;
};

export type ThemePalette = {
  background: string;
  surface: string;
  text: string;
  accent: string;
};

export type CanvasZone =
  | "center"
  | "upper-center"
  | "lower-left"
  | "lower-right"
  | "bottom-center";

export type CanvasWidgetStyle = {
  zone: CanvasZone;
  order: number;
  text: string;
  textMuted: string;
  textShadow: string;
};

export type Theme = {
  palette: ThemePalette;
  shellBorderColor?: string;
  backgroundUrl?: string;
  borderRadius: number;
  widgets: Partial<Record<CanvasWidgetId, CanvasWidgetStyle>>;
  /** @deprecated Use appliedThemePresetId */
  appliedPresetId?: string;
  appliedThemePresetId?: string;
  appliedLayoutPresetId?: string;
};

export type ThemePatch = {
  palette?: Partial<ThemePalette>;
  shellBorderColor?: string | null;
  backgroundUrl?: string | null;
  borderRadius?: number;
  widgets?: Partial<Record<CanvasWidgetId, Partial<CanvasWidgetStyle>>>;
  /** @deprecated Use appliedThemePresetId */
  appliedPresetId?: string | null;
  appliedThemePresetId?: string | null;
  appliedLayoutPresetId?: string | null;
};

export type EdgeGroupLinkPlacement = {
  linkId: string;
  orderKey: FractionalOrderKey;
};

export type EdgeGroup = {
  id: string;
  name: string;
  handleIcon?: string;
  orderKey: FractionalOrderKey;
  links: EdgeGroupLinkPlacement[];
};

export type EdgePlacements = {
  left: EdgeGroup[];
  top: EdgeGroup[];
  bottom: EdgeGroup[];
};

export type WorkspacePlacements = {
  edges: EdgePlacements;
};

export type Workspace = {
  id: string;
  name: string;
  theme: Theme;
  placements: WorkspacePlacements;
  internalTools: WorkspaceInternalTools;
  canvasWidgets: CanvasWidgetConfig;
  canvasNowPlayingDismissed?: boolean;
  icsFeedUrl?: string;
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
  focusRadio: FocusRadio;
  activeWorkspaceId: string;
  /** Shown in the canvas welcome widget; not the workspace name. */
  displayName?: string;
};

export type LibraryPatch = {
  activeWorkspaceId?: string;
  shortcuts?: Partial<ShortcutBindings>;
  displayName?: string | null;
};

export type CatalogLinkInput = {
  url: string;
  title?: string;
  image?: string;
};

export type CatalogLinkPatch = {
  url?: string;
  title?: string;
  image?: string;
};

export type LibraryStore = {
  read(): Promise<Library | null>;
  write(library: Library): Promise<void>;
};

export type EdgePosition = "left" | "top" | "bottom";
