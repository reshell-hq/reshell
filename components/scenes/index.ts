/**
 * Scene components + registry (plan 014). Scenes are the reuse unit the paid
 * tiers extend (ADR-0009): a public barrel so a consumer can import a built-in
 * scene or the registry directly.
 */
export { defaultScene } from "./default-scene";
export { editorialScene } from "./editorial-scene";
export { meridianScene } from "./meridian-scene";
export { atelierScene } from "./atelier-scene";
export { nocturneScene } from "./nocturne-scene";
export { terminalScene } from "./terminal-scene";
export { auroraScene } from "./aurora-scene";
export { scenes, getScene } from "./registry";
