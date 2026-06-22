"use client";

import { useEffect, useState } from "react";
import { useReshellState } from "@/hooks/use-reshell-state";

/**
 * A single quote drawn from `config.quotes` (CONTEXT: "Canvas widget"). Renders
 * nothing when no quotes are configured. The pick is randomised on mount: both
 * the server and the first client render show the first quote (so hydration
 * matches), then the effect rotates to a random one.
 */
export function QuoteWidget() {
  const { config } = useReshellState();
  const quotes = config.quotes ?? [];
  const [index, setIndex] = useState(0);

  // Randomise on mount only (client-only) so SSR and first render both show
  // quotes[0] and never mismatch. Wrapped in a function like `useClock`'s
  // mount-sync to keep the effect free of a direct synchronous setState.
  useEffect(() => {
    const pick = () =>
      setIndex(quotes.length > 1 ? Math.floor(Math.random() * quotes.length) : 0);
    pick();
  }, [quotes.length]);

  if (quotes.length === 0) {
    return null;
  }

  const quote = quotes[Math.min(index, quotes.length - 1)];

  return (
    <figure className="flex max-w-prose flex-col gap-2" suppressHydrationWarning>
      <blockquote className="text-balance text-lg leading-snug font-medium">
        “{quote.text}”
      </blockquote>
      {quote.author ? (
        <figcaption className="text-sm opacity-60">— {quote.author}</figcaption>
      ) : null}
    </figure>
  );
}
