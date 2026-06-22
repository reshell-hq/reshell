import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { iconByName, resolveIcon } from "@/lib/icons";

/**
 * The single render path for an `icon` field (CONTEXT): it resolves the raw
 * string and draws the matching kind — a curated animated pack glyph (named),
 * an emoji/literal (span), or a remote image (`<img>`). Standalone and
 * app-decoupled (ADR-0009) so the paid tiers reuse it.
 *
 * `size` (px) drives every kind uniformly so a call site sizes the box once;
 * `className` is for colour/layout. Named glyphs inherit `currentColor` and
 * animate on hover (the pack honours `prefers-reduced-motion` itself — its
 * hover trigger is gated on `useReducedMotion`); pass `animateOnHover={false}`
 * to render them static.
 */
export function Icon({
  value,
  size = 16,
  className,
  animateOnHover = true,
  fallback = null,
}: {
  value?: string;
  /** Box size in px; sizes the named SVG, the image, and the emoji alike. */
  size?: number;
  className?: string;
  /** Named glyphs only: animate on hover (ignored under reduced motion). */
  animateOnHover?: boolean;
  /** Rendered when `value` resolves to nothing (e.g. a group with no icon). */
  fallback?: ReactNode;
}) {
  const icon = resolveIcon(value);

  switch (icon.kind) {
    case "named": {
      const Glyph = iconByName[icon.name];
      return (
        <Glyph
          size={size}
          isAnimated={animateOnHover}
          aria-hidden
          className={cn("shrink-0", className)}
        />
      );
    }
    case "emoji":
      return (
        <span
          role="img"
          aria-hidden
          style={{ fontSize: size, lineHeight: 1 }}
          className={cn("inline-flex shrink-0 items-center justify-center", className)}
        >
          {icon.value}
        </span>
      );
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element -- remote favicons/icons; no next/image remote config needed for a tiny decorative glyph
        <img
          src={icon.src}
          alt=""
          aria-hidden
          loading="lazy"
          width={size}
          height={size}
          className={cn("shrink-0 rounded-[3px] object-contain", className)}
        />
      );
    case "none":
      return <>{fallback}</>;
  }
}
