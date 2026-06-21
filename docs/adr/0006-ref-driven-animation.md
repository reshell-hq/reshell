# Ref-driven animation: React owns discrete state, rAF owns continuous geometry

The shell splits responsibility along the discrete/continuous seam. React owns **discrete** state that changes on user intent — which slot is active, slot/size registrations, the viewport — and a single `requestAnimationFrame` loop (in `hooks/use-shell-animation.ts`) owns **continuous** geometry — the rim path plus the active portal's cavity and scaled content. The loop writes both straight to the DOM each frame (`path.setAttribute("d", …)` and `Object.assign(el.style, …)`); it never calls `setState`.

The portal registers its raw clip/inner DOM nodes into a context ref (`portalRef`, via `setPortal`/`clearPortal`); the loop reads that ref and positions them. Mount/unmount of the portal stays purely discrete — keyed on `activeSlotId` — so a close unmounts the content and the empty rim collapses, and a cross-edge switch keeps the new portal hidden until the animated notch reaches its edge. `setPortal` also triggers one immediate paint (via `portalPaintRef`) so a freshly-mounted portal — or a `prefers-reduced-motion` snap — is positioned before the next browser paint instead of flashing unstyled.

This replaces the earlier model where the rAF loop pushed the lerped notch into context state (`animatedNotch`/`animatedProgress`) every frame, re-rendering the whole provider subtree ~60fps purely to reposition one portal.

## Consequences

- No `setState` on the animation hot path: the provider re-renders only on discrete changes, not per frame. The rim `d` and the portal clip are written in the same loop tick, so content never lags the rim.
- A future reader will be tempted to "simplify" this back into `setState`-per-frame (it reads as more idiomatic React). That reintroduces the per-frame re-render this record exists to prevent — don't.
- The portal renders its DOM with no positioning styles of its own (only an initial `display: none`); the loop is the sole writer. Anything that must reposition the live portal outside the loop (e.g. a resize) must call the same per-frame writer once, which the resize effect does.
