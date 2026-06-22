import type { z } from "zod";
import type {
  bookmarkGroupSchema,
  bookmarkSchema,
  canvasWidgetIdSchema,
  focusSplitSchema,
  musicStationSchema,
  reshellConfigSchema,
  sceneNameSchema,
  shortcutActionSchema,
  workspaceConfigSchema,
} from "./validate";

/**
 * The `ReshellConfig` type tree, inferred from the zod schema in `./validate.ts`
 * so types and runtime validation share one source of truth (Plan 007 Step 1).
 * Read-only at runtime; the mutable layer is the localStorage override.
 */
export type ReshellConfig = z.infer<typeof reshellConfigSchema>;
export type WorkspaceConfig = z.infer<typeof workspaceConfigSchema>;
export type MusicStation = z.infer<typeof musicStationSchema>;
export type FocusSplit = z.infer<typeof focusSplitSchema>;
export type ShortcutAction = z.infer<typeof shortcutActionSchema>;
export type SceneName = z.infer<typeof sceneNameSchema>;
export type CanvasWidgetId = z.infer<typeof canvasWidgetIdSchema>;
export type BookmarkGroup = z.infer<typeof bookmarkGroupSchema>;
export type Bookmark = z.infer<typeof bookmarkSchema>;
