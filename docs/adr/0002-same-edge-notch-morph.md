# Same-edge notch morph, collapse-then-grow across edges

When the active slot changes while the current notch is still open, the animation controller morphs the notch's `center` along the rim toward the new slot's anchor — but *only* when both slots share the same edge. Across different edges (or when the previous notch has already collapsed) it falls back to collapse-then-grow, because sliding a pocket from one rim to another would travel absurdly around the frame.

This makes the controller animate `center` conditionally rather than treating the anchor as fixed, which is a deliberate, non-obvious branch a future reader might otherwise try to "simplify" into a single uniform behavior. Activation is debounced so that sweeping the pointer across a cluster of handles does not start a transition for every handle passed over.

## Consequences

- The controller tracks `current.center`/`current.edge`, not just `depth`/`halfExtent`.
- Reveal uses a single open-progress scalar `p` (see ADR-0003); the morph lerps `center` and the target box while `p` stays near 1, so a same-edge hop reads as the pocket gliding to the new handle.
