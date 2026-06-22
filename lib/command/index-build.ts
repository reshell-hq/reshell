import { displayTitle, faviconUrl } from "@/lib/bookmarks";
import {
  SCENE_NAMES,
  type ReshellConfig,
  type SceneName,
  type WorkspaceConfig,
} from "@/lib/config";

/**
 * Builds the command-bar index (CONTEXT: "Command bar") from the read-only
 * config plus the effective active workspace. Pure, zero React/DOM (ADR-0009),
 * so the same index feeds any future palette UI. Each entry carries a
 * serialisable `run` descriptor; the React layer's `runCommand` is the only
 * place that turns a descriptor into a side effect.
 *
 * Entry order is "most likely first" so the empty-query default set reads well:
 * nav entries (workspace switches, then bookmarks) ahead of verbs.
 *
 * New verbs register here (add a descriptor) and in `runCommand` (handle it) —
 * that is the seam later tool plans (011 timer, 012 tasks, 013 music) extend.
 */

const SCENE_LABELS: Record<SceneName, string> = {
  default: "Default",
  editorial: "Editorial",
  meridian: "Meridian",
  atelier: "Atelier",
};

/** What selecting an entry does. Serialisable — dispatched by `runCommand`. */
export type RunDescriptor =
  | { type: "switch"; workspaceId: string }
  | { type: "open"; url: string }
  | { type: "scene"; scene: SceneName }
  | { type: "reset"; workspaceId: string }
  | { type: "timer"; action: "start" | "stop" }
  | { type: "task"; action: "add" }
  | { type: "music"; action: "play" | "pause" };

export type CommandKind = RunDescriptor["type"];

export type CommandEntry = {
  id: string;
  /** Which command-bar mode surfaces this entry (parse classifies the input). */
  mode: "nav" | "verb";
  kind: CommandKind;
  label: string;
  /** Extra fuzzy-match targets beyond the label (host, scene name, synonyms). */
  keywords: string[];
  /** Optional icon hint for the row (emoji / URL / named), resolved by `<Icon>`. */
  icon?: string;
  run: RunDescriptor;
};

export type CommandIndexInput = {
  config: ReshellConfig;
  activeWorkspace: WorkspaceConfig;
  activeWorkspaceId: string;
};

export function buildCommandIndex({
  config,
  activeWorkspace,
  activeWorkspaceId,
}: CommandIndexInput): CommandEntry[] {
  return [
    ...workspaceEntries(config),
    ...bookmarkEntries(activeWorkspace),
    ...verbEntries(activeWorkspaceId),
  ];
}

function workspaceEntries(config: ReshellConfig): CommandEntry[] {
  return config.workspaces.map((workspace) => ({
    id: `switch:${workspace.id}`,
    mode: "nav",
    kind: "switch",
    label: `Switch to ${workspace.name}`,
    keywords: [workspace.name, "workspace", "switch"],
    run: { type: "switch", workspaceId: workspace.id },
  }));
}

function bookmarkEntries(workspace: WorkspaceConfig): CommandEntry[] {
  const entries: CommandEntry[] = [];
  const edges = workspace.bookmarks;
  if (!edges) {
    return entries;
  }

  for (const edge of ["left", "top", "bottom"] as const) {
    const groups = edges[edge];
    if (!groups) {
      continue;
    }
    for (const group of groups) {
      for (const bookmark of group.links) {
        const title = displayTitle(bookmark);
        entries.push({
          // URL is the bookmark's stable identity (see bookmark-group-slot).
          id: `open:${bookmark.url}`,
          mode: "nav",
          kind: "open",
          label: `Open ${title}`,
          keywords: [title, group.name, hostname(bookmark.url), "bookmark"],
          icon: bookmark.icon?.trim() ? bookmark.icon : faviconUrl(bookmark.url),
          run: { type: "open", url: bookmark.url },
        });
      }
    }
  }

  return entries;
}

function verbEntries(activeWorkspaceId: string): CommandEntry[] {
  const sceneVerbs: CommandEntry[] = SCENE_NAMES.map((scene) => ({
    id: `scene:${scene}`,
    mode: "verb",
    kind: "scene",
    label: `Switch scene: ${SCENE_LABELS[scene]}`,
    keywords: ["scene", scene],
    run: { type: "scene", scene },
  }));

  // ponytail: timer/task/music verbs are declared here so the command bar is
  // complete, but `runCommand` no-ops them until plans 011/012/013 land the
  // tools. Adding a verb = an entry here + a `runCommand` case.
  const toolVerbs: CommandEntry[] = [
    verb("timer-start", "timer", "Start timer", ["timer", "start", "pomodoro"], {
      type: "timer",
      action: "start",
    }),
    verb("timer-stop", "timer", "Stop timer", ["timer", "stop", "pomodoro"], {
      type: "timer",
      action: "stop",
    }),
    verb("task-add", "task", "Add task", ["task", "add", "todo"], {
      type: "task",
      action: "add",
    }),
    verb("music-play", "music", "Play music", ["music", "play"], {
      type: "music",
      action: "play",
    }),
    verb("music-pause", "music", "Pause music", ["music", "pause"], {
      type: "music",
      action: "pause",
    }),
  ];

  const resetVerb: CommandEntry = {
    id: "reset",
    mode: "verb",
    kind: "reset",
    label: "Reset workspace to config",
    keywords: ["reset", "workspace", "config"],
    run: { type: "reset", workspaceId: activeWorkspaceId },
  };

  return [...sceneVerbs, ...toolVerbs, resetVerb];
}

function verb(
  id: string,
  kind: CommandKind,
  label: string,
  keywords: string[],
  run: RunDescriptor,
): CommandEntry {
  return { id, mode: "verb", kind, label, keywords, run };
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
