import type { SceneName } from "@/lib/config";
import type { Scene } from "@/lib/scene";
import { defaultScene } from "./default-scene";
import { editorialScene } from "./editorial-scene";
import { meridianScene } from "./meridian-scene";
import { atelierScene } from "./atelier-scene";
import { nocturneScene } from "./nocturne-scene";
import { terminalScene } from "./terminal-scene";
import { auroraScene } from "./aurora-scene";

/**
 * The built-in scene set (CONTEXT: "Scene"). Adding a scene = a new component
 * here + a `SceneName` union member; no config-schema change beyond allowing
 * the name. Keyed by `SceneName` so the type system flags a missing scene.
 */
export const scenes: Record<SceneName, Scene> = {
  default: defaultScene,
  editorial: editorialScene,
  meridian: meridianScene,
  atelier: atelierScene,
  nocturne: nocturneScene,
  terminal: terminalScene,
  aurora: auroraScene,
};

/** Resolve a scene by name; an unknown name falls back to `default`. */
export function getScene(name: string): Scene {
  return scenes[name as SceneName] ?? scenes.default;
}
