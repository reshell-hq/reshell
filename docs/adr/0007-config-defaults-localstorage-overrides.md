# Config defaults with a localStorage override layer

The personal edition is driven by a typed, build-time **config** file that statically defines the user's setup (workspaces, bookmarks, themes, layouts, tool presets). Config is read-only at runtime and never written back. Mutable runtime state — active workspace, task list, running timer, playback, and command-center toggles (layout/theme preset, canvas-widget visibility) — lives in a thin per-workspace **override** layer in localStorage that is merged over config. We deliberately rejected yeti-workspace's IndexedDB `Library` blob (single mutable source of truth, YAML export) in favour of this split.

The effective state of a field is its override if one exists, else its config value. Config edits to a field the user has *not* overridden take effect on next load; fields the user *has* overridden keep the override until a per-workspace **reset** clears it back to config. This keeps the config file authoritative and hand-editable (dotfile-style) while still letting the running app feel stateful.

## Consequences

- Two layers must be merged on every read; there is no single in-memory mutable document. Tool logic ported from yeti (which mutated one `Library`) must be reshaped to "read config + override, write override only".
- A future reader will be tempted to collapse this back into one persisted blob seeded from config (simpler merge). That makes config edits feel "stuck" behind stale persisted state — the override layer exists specifically to keep the config file authoritative. Don't.
- Overrides are keyed by workspace id; renaming/removing a workspace in config leaves orphaned overrides, which must be ignored/garbage-collected rather than resurrecting dead workspaces.
