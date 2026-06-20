# Theme layering: shell frames, canvas is the interior; handle is headless

The theme is a single partial `theme` prop on `<Shell>`, shallow-merged over defaults and exposed via context as CSS custom properties on the shell root (so values cascade to the portaled overlay content). Its colour model is four nested surfaces, and the naming is deliberately counter-intuitive: **shell colour** fills the *frame* region (the gutter, outside the rim), **canvas colour** fills the *interior* where `Shell.Content` lives, **border** is the rim stroke (colour + width), and **panel colour** is a revealed slot's background. A reader expecting "shell" to mean the interior will get it backwards, hence this record.

The handle override (`theme.Handle`, with an optional per-`Shell.Slot` override) is *headless*: the consumer's component receives all interaction wiring (positioning `style`, hover/focus/click handlers, `aria-*`, `active`, and the inner `children`) as props and renders only visuals. Interaction stays centralised in the shell so overrides cannot break hover-intent, pinning, or the notch morph. Omitted theme tokens fall back to defaults that remain automatically light/dark-aware (via CSS variables / `currentColor`); any token the consumer sets is taken literally for both modes.

## Consequences

- The shell frame fill (shell colour) is the shell root background; the canvas fill is a filled copy of the animated rim path rendered *behind* `Shell.Content`, so the canvas/shell boundary follows the notch as it morphs.
- The existing standalone `gutterPx` prop folds into `theme.gutterPx`; `borderWidth` overrides the former `NOTCH_ANIMATION.visibleStrokeWidth`.
