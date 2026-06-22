import { z } from "zod";

/**
 * Runtime schema for the build-time `reshell.config.ts`. This schema is the
 * single source of truth: the `ReshellConfig` type tree in `./types.ts` is
 * `z.infer`red from here, so the validated shape and the static type can never
 * drift. Pure module — zero React/DOM deps (ADR-0009).
 */

export const musicStationSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  icon: z.string().optional(),
});

export const focusSplitSchema = z.object({
  id: z.string(),
  label: z.string(),
  workMinutes: z.number(),
  shortBreakMinutes: z.number(),
  longBreakMinutes: z.number(),
});

export const shortcutActionSchema = z.enum([
  "cycleWorkspace",
  "openCommandBar",
  "toggleTimer",
]);

export const sceneNameSchema = z.enum([
  "default",
  "editorial",
  "meridian",
  "atelier",
  "nocturne",
  "terminal",
  "aurora",
]);

export const canvasWidgetIdSchema = z.enum([
  "clock",
  "welcome",
  "quote",
  "nowPlaying",
  "pomodoro",
  "focusTasks",
]);

/**
 * The full built-in scene / canvas-widget sets, derived from the schema so they
 * never drift from the types (CONTEXT: both sets are fixed and built-in). The
 * command center iterates these to render every scene choice and widget toggle.
 */
export const SCENE_NAMES = sceneNameSchema.options;
export const CANVAS_WIDGET_IDS = canvasWidgetIdSchema.options;

export const bookmarkSchema = z.object({
  url: z.string(),
  title: z.string().optional(),
  icon: z.string().optional(),
});

export const bookmarkGroupSchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
  links: z.array(bookmarkSchema),
});

export const workspaceConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  scene: sceneNameSchema,
  // Absent widget id = off. Later plans read these per-workspace.
  widgets: z.partialRecord(canvasWidgetIdSchema, z.boolean()),
  // NOTE: no `right` edge — reserved for tools (plans 011–013).
  bookmarks: z
    .object({
      left: z.array(bookmarkGroupSchema).optional(),
      top: z.array(bookmarkGroupSchema).optional(),
      bottom: z.array(bookmarkGroupSchema).optional(),
    })
    .optional(),
});

export const reshellConfigSchema = z
  .object({
    displayName: z.string().optional(),
    defaultWorkspaceId: z.string(),
    clock: z
      .object({
        format: z.enum(["12h", "24h"]).optional(),
        timezone: z.string().optional(),
      })
      .optional(),
    quotes: z
      .array(z.object({ text: z.string(), author: z.string().optional() }))
      .optional(),
    music: z.object({ stations: z.array(musicStationSchema) }).optional(),
    timer: z
      .object({
        splits: z.array(focusSplitSchema),
        defaultSplitId: z.string(),
        chimeEnabled: z.boolean().optional(),
      })
      .optional(),
    shortcuts: z.partialRecord(shortcutActionSchema, z.string()).optional(),
    workspaces: z.array(workspaceConfigSchema).min(1),
  })
  .check((ctx) => {
    const ids = ctx.value.workspaces.map((w) => w.id);
    const seen = new Set<string>();
    ids.forEach((id, index) => {
      if (seen.has(id)) {
        ctx.issues.push({
          code: "custom",
          input: id,
          path: ["workspaces", index, "id"],
          message: `Duplicate workspace id "${id}" — ids must be unique.`,
        });
      }
      seen.add(id);
    });
    if (!ids.includes(ctx.value.defaultWorkspaceId)) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.defaultWorkspaceId,
        path: ["defaultWorkspaceId"],
        message: `defaultWorkspaceId "${ctx.value.defaultWorkspaceId}" does not match any workspace id.`,
      });
    }
  });

/**
 * Validate raw config (typically the imported `reshell.config.ts`). Throws an
 * Error whose message lists every bad path in human-readable form, so a
 * mistyped config fails loud and explains itself instead of rendering blank.
 */
export function validateConfig(raw: unknown) {
  const result = reshellConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid reshell config:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
