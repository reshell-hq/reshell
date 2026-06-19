# Context

Glossary of the domain language used in the shell UI. Implementation details live in code and `docs/adr/`.

## Terms

- **Shell** — the per-page chrome drawn as an outline (the *rim*) around the viewport, into which slots open.
- **Rim** — the drawn outline of the shell. A constant-width line with circular-looking corners on any viewport.
- **Slot** — a region docked to one edge of the shell that can open to reveal content. One slot is *active* globally at a time.
- **Handle** — the always-visible affordance for a slot, living entirely in the *gutter* (the margin between the rim and the screen edge), never overlapping the rim. Hovering it opens the slot.
- **Gutter** — the margin between the rim and the screen edge where handles sit.
- **Anchor** — a slot's position on its edge: its `edge` plus a `center` point along that edge.
- **Notch** (a.k.a. *cavity* / *pocket*) — the opening cut into the rim for the active slot, revealing its content.
- **Open progress** — a scalar `p` from 0 (closed) to 1 (fully open) that drives both the notch size and the content scale during the reveal.
- **Pin** — keeping an interactive slot open despite the pointer leaving, because it holds keyboard focus (or was click-opened). Distinguishes interactive slots (search) from pure hover slots.
- **Morph** — sliding the notch's `center` along a *single* edge from one slot's anchor to another's when switching active slots while still open. Cross-edge switches never morph; they collapse-then-grow.
