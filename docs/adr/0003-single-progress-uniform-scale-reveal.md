# Single open-progress scalar drives reveal; content scales uniformly

The notch's target shape is derived from the slot's measured content size, so the final cavity and the content are the same box. We exploit this by driving the reveal from a single open-progress scalar `p` (0→1): the notch cavity is `p × contentBox` (a uniformly scaled-down version of the final box) and the content is rendered full-size with `transform: scale(p)`, origin at the docking edge. Because both scale by the same `p`, the content exactly fills the cavity every frame — it starts tiny inside the small notch and zooms up to full size as the pocket opens, with no per-axis distortion.

This replaces the earlier model where the panel was sized to the notch and full-size content was merely clipped (so it looked full-size from the first frame, just covered by the rim).

## Consequences

- The controller lerps one `p` instead of independent `depth`/`halfExtent`.
- Async content growth (e.g. search results loading) happens with `p` pinned at `1`: the target box grows and new content appears at full size, pushing the notch outward — the zoom-from-tiny only plays on the initial open, not on every update.
- `overflow: hidden` on the panel is retained as a safety net for content that exceeds the clamped maximum notch size.
