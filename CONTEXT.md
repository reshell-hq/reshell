# Context

Glossary of the domain language used in the shell UI. Implementation details live in code and `docs/adr/`.

## Terms

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
