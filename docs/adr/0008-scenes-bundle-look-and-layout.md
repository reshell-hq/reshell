# Scenes bundle look and layout into one self-contained component

A **scene** is a single named React component that renders the canvas, owning *both* its visual look (palette mapped to the Shell primitive's `ShellTheme` and the app CSS vars) and the arrangement of the enabled canvas widgets. Config only names a workspace's scene and toggles which widgets are eligible; the scene decides where each widget sits. Switching scene restyles and re-lays-out the canvas in one move. Adding a scene means writing a component, not editing config — it is a small built-in plugin set (`default`, `editorial`, `meridian`, `atelier`).

This deliberately collapses yeti-workspace's two orthogonal concepts — theme presets (palette/border/background) and layout presets (zone + order + presentation mode) — which it kept separate and config-driven. We chose one bundled component because in practice a look and its arrangement are co-designed, and a self-contained component is far simpler than a zone-placement data model plus per-widget style overrides.

## Consequences

- You cannot mix an arbitrary palette with an arbitrary layout from config; a new combination requires a new scene component. This is intended — it trades data-driven flexibility for design coherence and far less surface area.
- Per-widget styling/placement is not expressible in config (yeti allowed it); scenes encode it in code.
- The scene, not config, is the source of widget placement, so the canvas-widget config reduces to on/off + content. A future reader expecting yeti's zone model in config won't find it — placement lives in the scene component.
