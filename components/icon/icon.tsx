import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { resolveIcon } from "@/lib/icons";

/**
 * Minimal renderer for the icon-resolver seam: emoji and image work now; a
 * `named` icon shows a neutral placeholder until plan 015 wires the curated
 * animated pack. Standalone (no app coupling) so the paid tiers reuse it.
 */
export function Icon({
  value,
  className,
  fallback = null,
}: {
  value?: string;
  className?: string;
  /** Rendered when `value` resolves to nothing (e.g. a group with no icon). */
  fallback?: ReactNode;
}) {
  const icon = resolveIcon(value);

  switch (icon.kind) {
    case "emoji":
      return (
        <span role="img" aria-hidden className={cn("leading-none", className)}>
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
          className={cn("h-4 w-4 shrink-0 rounded-[3px] object-contain", className)}
        />
      );
    case "named":
      // ponytail: placeholder until plan 015's named-icon registry lands.
      return (
        <span
          aria-hidden
          className={cn(
            "inline-block h-3.5 w-3.5 shrink-0 rounded-[3px] border border-dashed border-current opacity-50",
            className,
          )}
        />
      );
    case "none":
      return <>{fallback}</>;
  }
}
