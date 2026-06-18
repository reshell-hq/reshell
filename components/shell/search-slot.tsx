"use client";

import { useCallback, useRef, useState } from "react";

type SearchSlotProps = {
  onSearch: (query: string) => Promise<string[]>;
  placeholder?: string;
  label?: string;
};

/**
 * Reference implementation for an async-growing bottom-edge slot: an input with
 * results that load asynchronously and stack above it. Laid out with
 * `flex-col-reverse` so the input pins to the docking edge and results grow
 * upward, driving the notch taller as they arrive. The search runs from the
 * change handler (not an effect) and a request counter drops stale responses so
 * rapid typing never races.
 */
export function SearchSlot({
  onSearch,
  placeholder = "Search…",
  label = "Search",
}: SearchSlotProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;

      if (value.trim() === "") {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      onSearch(value).then((items) => {
        if (requestRef.current !== requestId) {
          return;
        }
        setResults(items);
        setLoading(false);
      });
    },
    [onSearch],
  );

  return (
    <div className="flex w-[min(100vw-2rem,32rem)] flex-col-reverse gap-2 p-3 text-zinc-900 dark:text-zinc-50">
      <input
        value={query}
        onChange={(event) => handleChange(event.target.value)}
        aria-label={label}
        placeholder={placeholder}
        className="w-full shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
      />
      {query.trim() === "" ? null : results.length > 0 ? (
        <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
          {results.map((item) => (
            <li
              key={item}
              className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2 py-1 text-sm text-zinc-500" role="status">
          {loading ? "Searching…" : "No matches"}
        </p>
      )}
    </div>
  );
}
