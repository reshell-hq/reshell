# Context

Glossary of the domain language used in the shell UI and the personal-edition productivity layer built on top of it. Implementation details live in code and `docs/adr/`.

## Shell primitive

- **Shell** — the per-page chrome around the viewport, into which slots open. Drawn as the *rim* outline plus a fill of the frame region (the gutter, outside the rim); the *shell colour* is that frame fill.
- **Canvas** — the interior region inside the rim where `Shell.Content` renders; the *canvas colour* is its background. Named for a painter's canvas: the drawing area framed by the shell.
- **Panel** — the background surface of a revealed slot's content within its *notch*; the *panel colour* themes it.
- **Border** — the rim line itself as a themeable stroke (colour + width). Synonym for the drawn *rim* when discussing theming.
- **Rim** — the drawn outline of the shell. A constant-width line with circular-looking corners on any viewport.
- **Slot** — a region docked to one edge of the shell that can open to reveal content. One slot is *active* globally at a time.
- **Handle** — the always-visible affordance for a slot, living entirely in the *gutter* (the margin between the rim and the screen edge), never overlapping the rim. Hovering it opens the slot.
- **Gutter** — the margin between the rim and the screen edge where handles sit. Its size is per-edge: an edge with handles uses the full gutter; a *minimised* edge uses a sliver.
- **Minimised edge** — an edge whose gutter shrinks to a bare sliver because none of its slots provide a *handle*, pulling the rim out toward the screen edge to reclaim content space. Handleless slots stay openable via their hit-zone.
- **Anchor** — a slot's position on its edge: its `edge` plus a `center` point along that edge.
- **Notch** (a.k.a. *cavity* / *pocket*) — the opening cut into the rim for the active slot, revealing its content.
- **Open progress** — a scalar `p` from 0 (closed) to 1 (fully open) that drives both the notch size and the content scale during the reveal.
- **Pin** — keeping an interactive slot open despite the pointer leaving, because it holds keyboard focus (or was click-opened). Distinguishes interactive slots (search) from pure hover slots.
- **Morph** — sliding the notch's `center` along a *single* edge from one slot's anchor to another's when switching active slots while still open. Cross-edge switches never morph; they collapse-then-grow.

## Personal edition

- **Config** — the typed, build-time config file that statically defines the user's setup: workspaces, bookmarks, the *scene* each workspace names, which *canvas widgets* are enabled, widget content (quotes, clock, display name), and tool presets (timer splits, music stations). Read-only at runtime; never written back to. *Scenes* themselves are code, not config — config only references them by name.
- **Override** — the per-workspace layer of mutable runtime state persisted to localStorage and merged over the *config*. Config edits to non-overridden fields apply immediately; overridden fields hold until *reset*.
- **Reset** — clearing a workspace's *overrides* so its effective state falls back to *config*.
- **Workspace** — a named context the user works in, owning a *scene*, *bookmark group* placements, tool state, and which *canvas widgets* are enabled. One is active at a time. Defined in *config*, adjustable at runtime via *override*.
  _Avoid_: profile, space
- **Bookmark** — a single saved link (url + optional title/icon). Lives inside a *bookmark group*.
  _Avoid_: link, favourite, shortcut
- **Bookmark group** — a named, ordered cluster of *bookmarks* placed on one shell edge as a *slot*. Placement (edge + order) is per-workspace *config*.
- **Tool** — an interactive utility (timer, tasks, music) that occupies a fixed right-edge *slot* for full control, and may also surface an ambient read-only *canvas widget*.
- **Canvas widget** — an ambient element a *scene* can render inside `Shell.Content` (clock, welcome, quote, now-playing, timer, tasks). The set is fixed and built-in; per-workspace *config* says which are enabled and supplies their content, but the active *scene* owns where each sits.
- **Scene** — a named, swappable React component that renders the *canvas*, bundling its visual look (palette → `ShellTheme` + app CSS vars) and the arrangement of the enabled *canvas widgets*. Self-contained: adding one means writing a component. A *workspace* names its scene in *config*; the *command center* switches it at runtime (an *override*). Built-ins: `default`, `editorial`, `meridian`, `atelier`.
  _Avoid_: theme, layout, skin, plugin
- **Command bar** — the bottom-edge *SearchSlot* repurposed as the single command surface. Any printable keystroke (when no field is focused) opens it pre-filled and fuzzy-finds workspaces and bookmarks; a `:` / `>` prefix switches to verbs (start timer, add task, switch scene, …). Because bare typing is captured here, there are no bare single-key shortcuts — only Escape, Tab, and a few ⌘-modifier bindings live outside it.
- **Command center** — the top-edge *slot* holding the workspace switcher, ambient status (clock, now-playing, timer), and runtime toggles for the active *scene* and which *canvas widgets* are enabled.
